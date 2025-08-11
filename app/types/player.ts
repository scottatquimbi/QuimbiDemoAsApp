/**
 * Player context used within the ChatWithContext component
 * Enhanced to match the new schema design
 */
export interface PlayerContext {
  gameLevel: number;
  playerName?: string;
  preferredName?: string;
  sessionDays?: number;
  vipLevel?: number;
  totalSpend?: number;
  freeformContext?: string;
  playerId?: string;
  likelinessToChurn?: number;
  gameId?: string;
  isSpender?: boolean;
  
  // New telemetry fields from redesigned schema
  accountStatus?: 'active' | 'locked' | 'suspended' | 'banned' | 'pending_verification';
  lockReason?: 'security' | 'payment_dispute' | 'tos_violation' | 'automated_security';
  verificationPending?: boolean;
  recentCrashes?: number;
  crashFrequency?: 'none' | 'low' | 'medium' | 'high' | 'critical';
  lastCrashAt?: string;
  deviceType?: 'ios' | 'android' | 'web';
  appVersion?: string;
  osVersion?: string;
  connectionQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  supportTier?: 'standard' | 'priority' | 'vip' | 'premium';
  churnRisk?: 'low' | 'medium' | 'high';
  sentimentHistory?: 'positive' | 'neutral' | 'negative' | 'volatile';
  previousIssues?: number;
}

/**
 * Props for components that need player context
 */
export interface PlayerContextProps {
  initialGameLevel?: number;
  initialPlayerName?: string;
  initialPreferredName?: string;
  initialSessionDays?: number;
  initialVipLevel?: number;
  initialTotalSpend?: number;
  initialFreeformContext?: string;
  initialLikelinessToChurn?: number;
}

/**
 * Game stage based on player level
 */
export type GameStage = 'Early Game' | 'Mid Game' | 'Late Game' | 'End Game';

/**
 * Chat with context component props
 */
export interface ChatWithContextProps extends PlayerContextProps {
  gameId?: string;
  showDebugPanel?: boolean;
  demoInitialMessage?: string;
  demoMessages?: string[];
  demoPlayerMessages?: string[];
  demoAgentMessages?: string[];
  forceLiveChat?: boolean;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
} 