import { CompensationTier } from '@/lib/models';

/**
 * Compensation data structure
 */
export interface CompensationData {
  issueDetected: boolean;
  recommendation?: CompensationRecommendation;
  issue?: IssueDetectionResult;
  requestId?: string;
  status?: string;
}

/**
 * Recommendation for compensation
 */
export interface CompensationRecommendation {
  tier: CompensationTier;
  tierInfo?: {
    label: string;
    color: string;
    bg: string;
  };
  reasoning: string;
  suggestedCompensation: {
    gold?: number;
    gems?: number;
    resources?: {
      [key: string]: number;
    };
    items?: Array<{
      name: string;
      quantity: number;
    }>;
  };
  playerContext?: {
    gameLevel: number;
    vipStatus: number;
    isSpender: boolean;
  };
  requiresHumanReview: boolean;
  estimatedReviewTime?: string;
  denied?: boolean;
  evidenceExists?: boolean;
}

/**
 * Issue detection result
 */
export interface IssueDetectionResult {
  detected: boolean;
  issueType: string;
  description: string;
  playerImpact: string;
  confidenceScore: number;
}

/**
 * Sentiment analysis of player message
 */
export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative' | 'very_negative';
  frustrationLevel: 'none' | 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
  isPotentialChurn: boolean;
} 