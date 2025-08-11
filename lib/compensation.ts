/**
 * DEPRECATED: This file uses Gemini models which have been removed.
 * Use compensation-local.ts instead for Ollama-based compensation analysis.
 * This file is kept for reference only.
 */

import { PlayerContext, CompensationTier } from './models';

/**
 * Helper function to extract JSON from LLM responses
 * @param text The raw text response from the LLM
 * @returns Parsed JSON object or null if parsing fails
 */
function extractJsonFromLlmResponse(text: string): any | null {
  console.warn('DEPRECATED: compensation.ts functions are disabled. Use compensation-local.ts instead.');
  return null;
}

// Interface definitions (kept for compatibility)
export interface IssueDetectionResult {
  detected: boolean;
  issueType: string | null;
  description: string;
  playerImpact: 'minor' | 'moderate' | 'severe' | 'critical' | 'minimal' | null;
  confidenceScore: number;
}

export enum CompensationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DENIED = 'denied',
  DISTRIBUTED = 'distributed'
}

export interface SentimentAnalysisResult {
  tone: 'frustrated' | 'angry' | 'disappointed' | 'confused' | 'neutral' | 'appreciative';
  urgency: 'low' | 'medium' | 'high';
  isRepeatIssue: boolean;
  emotionalIntensity: number;
  keyPhrases: string[];
  confidenceScore: number;
}

export interface CompensationRecommendation {
  tier: CompensationTier;
  reasoning: string;
  suggestedCompensation: {
    gold?: number;
    gems?: number;
    resources?: { [key: string]: number };
    items?: { [key: string]: number };
  };
  requiresHumanReview: boolean;
  estimatedReviewTime?: string;
  alternativeActions?: string[];
  preventionSuggestions?: string[];
}

export interface CompensationRequest {
  id: string;
  clientId: string;
  sessionId: string;
  tier: CompensationTier;
  status: CompensationStatus;
  reasoning: string;
  suggestedCompensation: {
    gold?: number;
    gems?: number;
    resources?: { [key: string]: number };
    items?: { [key: string]: number };
  };
  playerContext: {
    gameLevel: number;
    vipStatus: number;
    isSpender: boolean;
  };
  requiresHumanReview: boolean;
  createdAt: string;
  updatedAt: string;
}

// Deprecated function stubs
export async function detectIssue(message: string): Promise<IssueDetectionResult> {
  throw new Error('DEPRECATED: Use detectIssue from compensation-local.ts instead');
}

export async function analyzeSentiment(message: string): Promise<SentimentAnalysisResult> {
  throw new Error('DEPRECATED: Use analyzeSentiment from compensation-local.ts instead');
}

export async function recommendCompensation(
  issueResult: IssueDetectionResult,
  sentimentResult: SentimentAnalysisResult,
  playerContext: PlayerContext
): Promise<CompensationRecommendation> {
  throw new Error('DEPRECATED: Use compensation-local.ts functions instead');
}

export async function analyzePlayerMessage(message: string, playerContext: PlayerContext) {
  throw new Error('DEPRECATED: Use analyzePlayerMessage from compensation-local.ts instead');
}

export function calculateHandlingTimeMetrics(
  createdAt: string,
  respondedAt?: string,
  resolvedAt?: string
) {
  console.warn('DEPRECATED: compensation.ts functions are disabled. Use compensation-local.ts instead.');
  return {
    responseTime: null,
    resolutionTime: null,
    handlingTime: null
  };
}