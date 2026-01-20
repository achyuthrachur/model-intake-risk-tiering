// AI-specific types for the Model Intake & Risk Tiering application

import type { UseCaseFormData } from '@/lib/types';

// AI Risk Assessment types
export interface AIRiskAssessmentResult {
  enhancedRationale: string;
  mitigationRecommendations: string[];
  blindSpots: string[];
  executiveSummary: string;
  confidenceNotes?: string;
}

// AI Document Generation types
export interface AIDocumentEnhancement {
  executiveSummary: string;
  artifactRecommendations: Record<string, string>; // artifactId -> recommendation
  riskGuidance: string[];
}

// Chatbot types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatState {
  messages: ChatMessage[];
  collectedData: Partial<UseCaseFormData>;
  currentField?: string;
  isComplete: boolean;
}

export interface ExtractedFields {
  extractedFields: Partial<UseCaseFormData>;
  isComplete: boolean;
  nextQuestion?: string;
  clarificationNeeded?: string;
}

// API response wrapper
export interface AIResponse<T> {
  result: T;
  aiEnhanced: boolean;
  error?: string;
}
