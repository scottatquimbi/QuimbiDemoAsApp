/**
 * TypeScript interfaces for the redesigned star schema
 */

// ========== DIMENSION TABLE INTERFACES ==========

/**
 * Enhanced player interface matching the redesigned schema
 */
export interface Player {
  id: number;
  player_id: string;
  player_name: string;
  
  // Game progression
  game_level: number;
  vip_level: number;
  is_spender: boolean;
  total_spend: number;
  session_days: number;
  kingdom_id?: number;
  alliance_name?: string;
  
  // Account Status Fields
  account_status: 'active' | 'locked' | 'suspended' | 'banned' | 'pending_verification';
  lock_reason?: 'security' | 'payment_dispute' | 'tos_violation' | 'automated_security';
  suspension_expires?: string;
  verification_pending: boolean;
  
  // Crash/Technical Telemetry Fields
  recent_crashes: number;
  crash_frequency: 'none' | 'low' | 'medium' | 'high' | 'critical';
  last_crash_at?: string;
  device_type?: 'ios' | 'android' | 'web';
  app_version?: string;
  os_version?: string;
  connection_quality: 'poor' | 'fair' | 'good' | 'excellent';
  
  // Behavioral Flags
  support_tier: 'standard' | 'priority' | 'vip' | 'premium';
  churn_risk: 'low' | 'medium' | 'high';
  sentiment_history: 'positive' | 'neutral' | 'negative' | 'volatile';
  previous_issues: number;
  
  // Timestamps
  last_login: string;
  account_created: string;
  created_at: string;
  updated_at: string;
}

/**
 * Issue category lookup interface
 */
export interface IssueCategory {
  id: number;
  code: string; // tech_crash, acct_lock, miss_reward, etc.
  name: string;
  severity_default: 'low' | 'medium' | 'high' | 'critical';
  auto_comp_eligible: boolean;
  avg_resolution_mins: number;
  created_at: string;
}

/**
 * Resolution method lookup interface
 */
export interface ResolutionMethod {
  id: number;
  code: string; // auto_comp, manual_fix, escalate, etc.
  name: string;
  requires_agent: boolean;
  avg_time_mins: number;
  success_rate: number;
  created_at: string;
}

/**
 * Agent interface
 */
export interface Agent {
  id: number;
  agent_id: string;
  name: string;
  role: 'agent' | 'supervisor' | 'specialist' | 'ai_bot';
  active: boolean;
  created_at: string;
}

// ========== FACT TABLE INTERFACES ==========

/**
 * Central support interaction fact table
 */
export interface SupportInteraction {
  id: number;
  
  // Dimension keys
  player_id: string;
  issue_category_id?: number;
  resolution_method_id?: number;
  agent_id?: number;
  
  // Interaction identifiers
  session_id: string;
  ticket_id?: string;
  
  // Core facts/metrics
  duration_mins: number;
  messages_exchanged: number;
  escalations: number;
  compensation_value_usd: number;
  
  // Status and outcome
  status: 'open' | 'resolved' | 'escalated' | 'closed';
  outcome: 'resolved' | 'partial' | 'escalated' | 'abandoned' | 'pending';
  satisfaction_rating?: number;
  
  // Timestamps
  interaction_date: string; // DATE
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

// ========== TRANSACTIONAL TABLE INTERFACES ==========

/**
 * Compensation awards interface
 */
export interface CompensationAward {
  id: number;
  interaction_id: number;
  
  // Award details
  gold: number;
  gems: number;
  resources: Record<string, any>; // JSONB
  items: any[]; // JSONB array
  
  // Processing
  status: 'pending' | 'approved' | 'delivered' | 'failed';
  approved_by?: number;
  delivered_at?: string;
  
  created_at: string;
}

/**
 * Post-hoc AI analysis interface
 */
export interface AIAnalysis {
  id: number;
  interaction_id: number;
  
  // AI analysis results
  issue_detected: boolean;
  confidence_score?: number;
  sentiment?: 'pos' | 'neu' | 'neg';
  urgency?: 'low' | 'med' | 'high';
  compensation_tier?: 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'NONE';
  
  // Processing metadata
  model_version?: string;
  analysis_duration_ms?: number;
  processed_at: string;
  
  // Analysis details
  key_phrases?: string[];
  issue_codes?: string[];
  
  created_at: string;
}

// ========== ANALYTICS INTERFACES ==========

/**
 * Analytics results from get_handling_time_stats() function
 */
export interface HandlingTimeStats {
  // New star schema metrics
  total_interactions: number;
  avg_resolution_mins: number;
  automated_resolution_rate: number;
  total_compensation_usd: number;
  avg_satisfaction: number;
  resolution_rate: number;
  escalation_rate: number;
  
  // Legacy compatibility metrics
  average_handling_minutes: number;
  total_estimated_hours: number;
  average_complexity: number;
  average_steps: number;
  automation_score: number;
  human_resolution_minutes: number;
  bot_resolution_minutes: number;
  human_resolution_count: number;
  automated_resolution_count: number;
  time_saved_percentage: number;
  total_time_saved_hours: number;
}

// ========== JOINED DATA INTERFACES ==========

/**
 * Support interaction with joined dimension data
 */
export interface SupportInteractionWithDetails extends SupportInteraction {
  player?: Player;
  issue_category?: IssueCategory;
  resolution_method?: ResolutionMethod;
  agent?: Agent;
  compensation_awards?: CompensationAward[];
  ai_analysis?: AIAnalysis[];
}

/**
 * Player with their support interaction history
 */
export interface PlayerWithHistory extends Player {
  support_interactions?: SupportInteraction[];
  total_interactions?: number;
  avg_resolution_time?: number;
  total_compensation_received?: number;
  last_interaction_date?: string;
}

// ========== API REQUEST/RESPONSE INTERFACES ==========

/**
 * Request interface for creating support interactions
 */
export interface CreateSupportInteractionRequest {
  player_id: string;
  session_id: string;
  issue_category_code?: string;
  initial_message?: string;
  player_context?: {
    device_type?: string;
    app_version?: string;
    connection_quality?: string;
  };
}

/**
 * Request interface for updating support interactions
 */
export interface UpdateSupportInteractionRequest {
  status?: SupportInteraction['status'];
  outcome?: SupportInteraction['outcome'];
  resolution_method_code?: string;
  agent_id?: number;
  duration_mins?: number;
  messages_exchanged?: number;
  escalations?: number;
  compensation_value_usd?: number;
  satisfaction_rating?: number;
}

/**
 * Request interface for creating AI analysis
 */
export interface CreateAIAnalysisRequest {
  interaction_id: number;
  issue_detected: boolean;
  confidence_score?: number;
  sentiment?: AIAnalysis['sentiment'];
  urgency?: AIAnalysis['urgency'];
  compensation_tier?: AIAnalysis['compensation_tier'];
  model_version?: string;
  analysis_duration_ms?: number;
  key_phrases?: string[];
  issue_codes?: string[];
}

/**
 * Request interface for creating compensation awards
 */
export interface CreateCompensationAwardRequest {
  interaction_id: number;
  gold?: number;
  gems?: number;
  resources?: Record<string, any>;
  items?: any[];
  approved_by?: number;
}

// ========== LEGACY COMPATIBILITY INTERFACES ==========

/**
 * Legacy detected_issues table interface (for backward compatibility)
 */
export interface LegacyDetectedIssue {
  id: number;
  session_id?: number;
  message_id?: number;
  issue_type: string;
  description?: string;
  player_impact?: string;
  confidence_score?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Legacy compensation_requests table interface (for backward compatibility)
 */
export interface LegacyCompensationRequest {
  id: number;
  session_id?: number;
  issue_id?: number;
  player_id: string;
  tier: string;
  reasoning?: string;
  status: string;
  requires_human_review: boolean;
  gold: number;
  resources: Record<string, any>;
  items?: any[];
  vip_points: number;
  special_offers?: Record<string, any>;
  handling_time_metrics: Record<string, any>;
  reviewed_by?: string;
  review_notes?: string;
  actual_compensation?: Record<string, any>;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

// ========== UTILITY TYPES ==========

/**
 * Issue category codes as a union type
 */
export type IssueCategoryCode = 
  | 'tech_crash' | 'tech_freeze' | 'tech_load'
  | 'acct_lock' | 'acct_susp' | 'acct_veri'
  | 'miss_reward' | 'miss_purch' | 'purch_fail'
  | 'prog_block' | 'ui_bug' | 'conn_issue';

/**
 * Resolution method codes as a union type
 */
export type ResolutionMethodCode =
  | 'auto_comp' | 'manual_fix' | 'acct_unlock'
  | 'redeliver' | 'escalate' | 'no_action' | 'workaround';

/**
 * Compensation tiers as a union type
 */
export type CompensationTier = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'NONE';

// ========== COMPENSATION REWARDS LOOKUP INTERFACES ==========

/**
 * Player spending tier classification
 */
export type PlayerTier = 'f2p' | 'light_spender' | 'medium_spender' | 'whale' | 'vip_whale';

/**
 * Issue impact levels for compensation calculation
 */
export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Compensation rewards lookup table interface
 */
export interface CompensationReward {
  id: number;
  
  // Player classification
  player_tier: PlayerTier;
  
  // Level and VIP ranges
  level_min: number;
  level_max: number;
  vip_min: number;
  vip_max: number;
  
  // Spend thresholds
  spend_min: number;
  spend_max: number;
  
  // Churn risk handling
  churn_risk: 'low' | 'medium' | 'high';
  churn_multiplier: number;
  
  // Issue impact
  impact_level: ImpactLevel;
  
  // Base compensation amounts
  base_gold: number;
  base_gems: number;
  base_resources: Record<string, any>; // JSONB
  base_items: Array<{
    item: string;
    quantity: number;
  }>; // JSONB array
  
  // Additional rewards
  vip_points: number;
  special_offers: Record<string, any>; // JSONB
  
  // Multipliers
  vip_bonus_multiplier: number;
  weekend_multiplier: number;
  
  // Usage tracking
  times_used: number;
  last_used?: string;
  
  // Admin controls
  active: boolean;
  requires_approval: boolean;
  max_daily_usage?: number;
  notes?: string;
  created_by?: string;
  
  created_at: string;
  updated_at: string;
}

/**
 * Calculated compensation result from database function
 */
export interface CalculatedCompensation {
  gold: number;
  gems: number;
  resources: Record<string, any>;
  items: Array<{
    item: string;
    quantity: number;
  }>;
  vip_points: number;
  special_offers: Record<string, any>;
  rule_id?: number;
  player_tier: PlayerTier;
  multiplier_applied: number;
  requires_approval: boolean;
  error?: string;
}

/**
 * Parameters for compensation calculation
 */
export interface CompensationCalculationParams {
  player_level: number;
  vip_level: number;
  total_spend: number;
  churn_risk: 'low' | 'medium' | 'high';
  impact_level: ImpactLevel;
  is_weekend?: boolean;
}

/**
 * Request interface for creating compensation reward rules
 */
export interface CreateCompensationRewardRequest {
  player_tier: PlayerTier;
  level_min: number;
  level_max: number;
  vip_min: number;
  vip_max: number;
  spend_min: number;
  spend_max: number;
  churn_risk: 'low' | 'medium' | 'high';
  churn_multiplier: number;
  impact_level: ImpactLevel;
  base_gold: number;
  base_gems?: number;
  base_resources?: Record<string, any>;
  base_items?: Array<{ item: string; quantity: number }>;
  vip_points?: number;
  special_offers?: Record<string, any>;
  vip_bonus_multiplier?: number;
  weekend_multiplier?: number;
  requires_approval?: boolean;
  max_daily_usage?: number;
  notes?: string;
}

/**
 * Response interface for compensation calculation API
 */
export interface CompensationCalculationResponse {
  success: boolean;
  compensation?: CalculatedCompensation;
  error?: string;
  debug_info?: {
    matched_rule_id?: number;
    player_tier_classified: PlayerTier;
    multipliers_applied: number;
    fallback_used: boolean;
  };
}

// ========== ENHANCED COMPENSATION DATA INTERFACES ==========

/**
 * Issue detection result interface (imported from compensation.ts for compatibility)
 */
export interface IssueDetectionResult {
  detected: boolean;
  issueType: string;
  description: string;
  playerImpact: string;
  confidenceScore: number;
}

/**
 * Enhanced compensation data structure that includes lookup table results
 */
export interface EnhancedCompensationData {
  issueDetected: boolean;
  recommendation?: EnhancedCompensationRecommendation;
  issue?: IssueDetectionResult;
  calculatedCompensation?: CalculatedCompensation;
  requestId?: string;
  status?: string;
}

/**
 * Enhanced compensation recommendation using lookup table
 */
export interface EnhancedCompensationRecommendation {
  tier: CompensationTier;
  tierInfo?: {
    label: string;
    color: string;
    bg: string;
  };
  reasoning: string;
  calculatedRewards: CalculatedCompensation;
  playerTier: PlayerTier;
  impactLevel: ImpactLevel;
  requiresHumanReview: boolean;
  estimatedReviewTime?: string;
  ruleId?: number;
  multiplierApplied?: number;
}

// ========== ADMIN INTERFACE FOR REWARD MANAGEMENT ==========

/**
 * Interface for reward rule management in admin panel
 */
export interface RewardRuleManagement {
  rule: CompensationReward;
  usage_stats: {
    total_usage: number;
    recent_usage: number;
    avg_gold_awarded: number;
    effectiveness_score: number;
  };
  similar_rules: CompensationReward[];
  conflicts: Array<{
    conflicting_rule_id: number;
    conflict_type: 'overlap' | 'gap' | 'inconsistent';
    description: string;
  }>;
}