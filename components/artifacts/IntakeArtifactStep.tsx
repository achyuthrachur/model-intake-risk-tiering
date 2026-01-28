'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileUp, Wand2, CheckCircle, AlertCircle, Loader2, Info, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import type { UseCaseFormData, ArtifactDefinition, Tier } from '@/lib/types';
import { DropZone } from './DropZone';
import { useToast } from '@/components/ui/use-toast';

interface TierPreviewResult {
  tier: Tier;
  tierInfo: {
    name: string;
    description: string;
    color: string;
  };
  isModel: string;
  triggeredRules: Array<{
    id: string;
    name: string;
    tier: Tier;
    triggeredCriteria: string;
  }>;
  requiredArtifacts: ArtifactDefinition[];
  riskFlags: string[];
}

interface ArtifactStatus {
  artifactId: string;
  status: 'not_provided' | 'uploaded' | 'synthetic' | 'uploading' | 'generating';
  file?: { name: string; size: number };
  attachmentId?: string;
}

interface IntakeArtifactStepProps {
  formData: UseCaseFormData;
  useCaseId: string | null;
  onUseCaseCreated: (id: string) => void;
  onArtifactUploaded: (artifactId: string, attachment: any) => void;
  uploadedArtifacts: Record<string, ArtifactStatus>;
}

export function IntakeArtifactStep({
  formData,
  useCaseId,
  onUseCaseCreated,
  onArtifactUploaded,
  uploadedArtifacts,
}: IntakeArtifactStepProps) {
  const { toast } = useToast();
  const [tierPreview, setTierPreview] = useState<TierPreviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [artifactStatuses, setArtifactStatuses] = useState<Record<string, ArtifactStatus>>({});

  // Merge uploaded artifacts from parent into local state
  useEffect(() => {
    setArtifactStatuses(prev => ({ ...prev, ...uploadedArtifacts }));
  }, [uploadedArtifacts]);

  // Fetch tier preview based on form data
  const fetchTierPreview = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tier-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setTierPreview(data);
      }
    } catch (error) {
      console.error('Failed to fetch tier preview:', error);
    } finally {
      setLoading(false);
    }
  }, [formData]);

  useEffect(() => {
    fetchTierPreview();
  }, [fetchTierPreview]);

  // Create draft use case to enable uploads
  const createDraft = async (): Promise<string | null> => {
    if (useCaseId) return useCaseId;

    try {
      setCreatingDraft(true);
      const response = await fetch('/api/usecases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save draft');

      const data = await response.json();
      onUseCaseCreated(data.id);
      toast({
        title: 'Draft saved',
        description: 'Your intake has been saved as a draft.',
      });
      return data.id;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save draft. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setCreatingDraft(false);
    }
  };

  // Handle file upload
  const handleUpload = async (artifactId: string) => {
    const caseId = await createDraft();
    if (!caseId) return;

    // The DropZone component will handle the actual upload
    // This function just ensures we have a use case ID first
  };

  // Handle upload complete
  const handleUploadComplete = (artifactId: string, attachment: any) => {
    setArtifactStatuses(prev => ({
      ...prev,
      [artifactId]: {
        artifactId,
        status: 'uploaded',
        file: { name: attachment.filename, size: attachment.fileSize || 0 },
        attachmentId: attachment.id,
      },
    }));
    onArtifactUploaded(artifactId, attachment);
    toast({
      title: 'File uploaded',
      description: `Successfully uploaded artifact.`,
    });
  };

  // Handle synthetic artifact generation
  const handleGenerateSynthetic = async (artifactId: string, artifactName: string) => {
    const caseId = await createDraft();
    if (!caseId) return;

    setArtifactStatuses(prev => ({
      ...prev,
      [artifactId]: { artifactId, status: 'generating' },
    }));

    try {
      const response = await fetch(`/api/usecases/${caseId}/synthetic-artifacts/single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifactId }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const data = await response.json();
      setArtifactStatuses(prev => ({
        ...prev,
        [artifactId]: {
          artifactId,
          status: 'synthetic',
          file: { name: data.attachment.filename, size: data.attachment.fileSize || 0 },
          attachmentId: data.attachment.id,
        },
      }));
      onArtifactUploaded(artifactId, data.attachment);
      toast({
        title: 'Demo artifact generated',
        description: `Created example ${artifactName} for demonstration.`,
      });
    } catch (error) {
      setArtifactStatuses(prev => ({
        ...prev,
        [artifactId]: { artifactId, status: 'not_provided' },
      }));
      toast({
        title: 'Error',
        description: 'Failed to generate demo artifact.',
        variant: 'destructive',
      });
    }
  };

  // Get status for an artifact
  const getArtifactStatus = (artifactId: string): ArtifactStatus => {
    return artifactStatuses[artifactId] || { artifactId, status: 'not_provided' };
  };

  // Calculate completion stats
  const totalArtifacts = tierPreview?.requiredArtifacts.length || 0;
  const uploadedCount = Object.values(artifactStatuses).filter(
    s => s.status === 'uploaded' || s.status === 'synthetic'
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Analyzing requirements...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tier Preview Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg text-blue-900">Estimated Risk Tier</CardTitle>
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-lg px-3 py-1',
                tierPreview?.tier === 'T3'
                  ? 'bg-red-100 text-red-800 border-red-300'
                  : tierPreview?.tier === 'T2'
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  : 'bg-green-100 text-green-800 border-green-300'
              )}
            >
              {tierPreview?.tier} - {tierPreview?.tierInfo.name}
            </Badge>
          </div>
          <CardDescription className="text-blue-700">
            Based on your inputs, this use case is estimated to be {tierPreview?.tierInfo.name}.
            This is a preview - the final tier will be determined after submission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800">{tierPreview?.tierInfo.description}</p>
          {tierPreview?.isModel === 'Yes' && (
            <Badge className="mt-2 bg-blue-600">Qualifies as Model</Badge>
          )}
          {tierPreview?.isModel === 'Model-like' && (
            <Badge className="mt-2 bg-blue-500" variant="secondary">
              Model-like Characteristics
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Artifacts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Required Artifacts</CardTitle>
              <CardDescription>
                The following artifacts are typically required for {tierPreview?.tier} use cases.
                You can upload them now or after submission.
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {uploadedCount}/{totalArtifacts}
              </div>
              <div className="text-sm text-gray-500">Provided</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {totalArtifacts === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>No specific artifacts required for this tier.</p>
            </div>
          ) : (
            <Accordion type="multiple" className="space-y-2">
              {tierPreview?.requiredArtifacts.map((artifact) => {
                const status = getArtifactStatus(artifact.id);
                const isProvided = status.status === 'uploaded' || status.status === 'synthetic';
                const isProcessing = status.status === 'uploading' || status.status === 'generating';

                return (
                  <AccordionItem
                    key={artifact.id}
                    value={artifact.id}
                    className={cn(
                      'border rounded-lg px-4',
                      isProvided ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    )}
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 flex-1">
                        {isProvided ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : isProcessing ? (
                          <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="text-left flex-1">
                          <div className="font-medium">{artifact.name}</div>
                          <div className="text-sm text-gray-500">{artifact.category}</div>
                        </div>
                        {isProvided && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'ml-2',
                              status.status === 'synthetic'
                                ? 'bg-amber-100 text-amber-700 border-amber-300'
                                : 'bg-green-100 text-green-700 border-green-300'
                            )}
                          >
                            {status.status === 'synthetic' ? 'Demo' : 'Uploaded'}
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">{artifact.description}</p>

                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            What Good Looks Like:
                          </p>
                          <p className="text-sm text-gray-700">{artifact.whatGoodLooksLike}</p>
                        </div>

                        {isProvided ? (
                          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-100 p-2 rounded">
                            <CheckCircle className="w-4 h-4" />
                            <span>
                              {status.file?.name}
                              {status.status === 'synthetic' && ' (Demo artifact)'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            {useCaseId ? (
                              <DropZone
                                useCaseId={useCaseId}
                                artifactId={artifact.id}
                                artifactName={artifact.name}
                                type="Model documentation"
                                onUploadComplete={(attachment) =>
                                  handleUploadComplete(artifact.id, attachment)
                                }
                                onUploadError={(error) =>
                                  toast({
                                    title: 'Upload failed',
                                    description: error,
                                    variant: 'destructive',
                                  })
                                }
                                compact
                                className="flex-1"
                              />
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpload(artifact.id)}
                                disabled={creatingDraft || isProcessing}
                                className="gap-2"
                              >
                                {creatingDraft ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Upload className="w-4 h-4" />
                                )}
                                Upload
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGenerateSynthetic(artifact.id, artifact.name)}
                              disabled={creatingDraft || isProcessing}
                              className="gap-2 text-amber-700 border-amber-300 hover:bg-amber-50"
                            >
                              {status.status === 'generating' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Wand2 className="w-4 h-4" />
                              )}
                              Generate Demo
                            </Button>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Skip Note */}
      <div className="text-center text-sm text-gray-500 py-2">
        You can skip this step and upload artifacts later after submission.
      </div>
    </div>
  );
}
