// Re-Tiering Logic - Apply policy changes to inventory models

import prisma from '@/lib/db';
import { evaluateUseCase } from '@/lib/rules-engine';
import type { AffectedModel, ValidationFrequencies, PolicyApplyResult } from './types';
import type { UseCaseWithRelations } from '@/lib/types';

export async function previewReTiering(
  newValidationFrequencies: ValidationFrequencies
): Promise<AffectedModel[]> {
  // Fetch all active inventory models with their use cases and decisions
  const inventoryModels = await prisma.inventoryModel.findMany({
    where: {
      status: 'Active',
    },
    include: {
      useCase: {
        include: {
          decision: true,
        },
      },
    },
  });

  const affectedModels: AffectedModel[] = [];

  for (const model of inventoryModels) {
    const currentTier = model.tier;
    const currentFrequency = model.validationFrequencyMonths;
    const currentDueDate = model.nextValidationDue;

    // Get new frequency based on current tier (tier doesn't change in this simple implementation)
    // In a full implementation, we would re-run rules engine with new rules
    const newFrequency = newValidationFrequencies[currentTier as keyof ValidationFrequencies];

    // Calculate new due date
    const lastValidation = model.lastValidationDate || model.addedToInventoryAt;
    const newDueDate = new Date(lastValidation);
    newDueDate.setMonth(newDueDate.getMonth() + newFrequency);

    // Check if anything changed
    const frequencyChanged = currentFrequency !== newFrequency;
    const dueDateChanged = currentDueDate.getTime() !== newDueDate.getTime();

    // Only include if there are actual changes
    if (frequencyChanged || dueDateChanged) {
      affectedModels.push({
        inventoryModelId: model.id,
        inventoryNumber: model.inventoryNumber,
        modelName: model.useCase.title,
        previousTier: currentTier,
        newTier: currentTier, // Tier stays same in frequency-only changes
        tierChanged: false,
        previousFrequency: currentFrequency,
        newFrequency,
        frequencyChanged,
        previousDueDate: currentDueDate,
        newDueDate,
        dueDateChanged,
      });
    }
  }

  return affectedModels;
}

export async function applyPolicyChanges(
  newValidationFrequencies: ValidationFrequencies,
  policyVersionId: string,
  appliedBy: string
): Promise<PolicyApplyResult> {
  const errors: string[] = [];
  let modelsUpdated = 0;

  try {
    // Get preview of affected models
    const affectedModels = await previewReTiering(newValidationFrequencies);

    // Apply changes in a transaction
    await prisma.$transaction(async (tx) => {
      for (const affected of affectedModels) {
        try {
          await tx.inventoryModel.update({
            where: { id: affected.inventoryModelId },
            data: {
              validationFrequencyMonths: affected.newFrequency,
              nextValidationDue: affected.newDueDate,
            },
          });
          modelsUpdated++;
        } catch (err) {
          errors.push(`Failed to update model ${affected.inventoryNumber}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Update the PolicyVersion status
      await tx.policyVersion.update({
        where: { id: policyVersionId },
        data: {
          status: 'Applied',
          appliedAt: new Date(),
        },
      });
    });

    return {
      success: errors.length === 0,
      modelsUpdated,
      newValidationFrequencies,
      appliedAt: new Date(),
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    return {
      success: false,
      modelsUpdated,
      newValidationFrequencies,
      appliedAt: new Date(),
      errors: [`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

// Re-run rules engine on a specific model (for more complex policy changes)
export async function reTierSingleModel(
  inventoryModelId: string
): Promise<{ previousTier: string; newTier: string; changed: boolean }> {
  const model = await prisma.inventoryModel.findUnique({
    where: { id: inventoryModelId },
    include: {
      useCase: {
        include: {
          decision: true,
          attachments: true,
        },
      },
    },
  });

  if (!model) {
    throw new Error(`Inventory model ${inventoryModelId} not found`);
  }

  const previousTier = model.tier;

  // Re-evaluate using rules engine
  const useCaseData = model.useCase as UseCaseWithRelations;
  const decisionResult = evaluateUseCase(useCaseData);
  const newTier = decisionResult.tier;

  const changed = previousTier !== newTier;

  return { previousTier, newTier, changed };
}

// Calculate what the new due date should be
export function calculateNewDueDate(
  lastValidationDate: Date | null,
  addedToInventoryAt: Date,
  newFrequencyMonths: number
): Date {
  // Use last validation if available, otherwise use inventory add date
  const baseDate = lastValidationDate || addedToInventoryAt;
  const newDueDate = new Date(baseDate);
  newDueDate.setMonth(newDueDate.getMonth() + newFrequencyMonths);

  // If new due date is in the past, set to now + frequency
  const now = new Date();
  if (newDueDate < now) {
    const futureDueDate = new Date(now);
    futureDueDate.setMonth(futureDueDate.getMonth() + newFrequencyMonths);
    return futureDueDate;
  }

  return newDueDate;
}

// Generate summary statistics for the preview
export function summarizePreview(affectedModels: AffectedModel[]): {
  totalAffected: number;
  tierChanges: number;
  frequencyChanges: number;
  earlierDueDates: number;
  laterDueDates: number;
  byTier: Record<string, number>;
} {
  const summary = {
    totalAffected: affectedModels.length,
    tierChanges: affectedModels.filter(m => m.tierChanged).length,
    frequencyChanges: affectedModels.filter(m => m.frequencyChanged).length,
    earlierDueDates: affectedModels.filter(m => m.newDueDate < m.previousDueDate).length,
    laterDueDates: affectedModels.filter(m => m.newDueDate > m.previousDueDate).length,
    byTier: {} as Record<string, number>,
  };

  for (const model of affectedModels) {
    const tier = model.newTier;
    summary.byTier[tier] = (summary.byTier[tier] || 0) + 1;
  }

  return summary;
}
