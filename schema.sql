-- REDESIGNED STAR SCHEMA FOR QUIMBI AI SUPPORT SYSTEM
-- Addresses: realistic data lengths, star schema design, post-hoc AI analysis, player issue fields
--
-- DESIGN PRINCIPLES:
-- 1. Star schema with central fact table (support_interactions)
-- 2. Dimension tables for clean separation of concerns
-- 3. Player table includes telemetry/issue status fields
-- 4. AI analysis as post-hoc entries
-- 5. Realistic short field values with lookup tables

-- ========== DROP EXISTING TABLES ==========
DROP TABLE IF EXISTS ai_analysis CASCADE;
DROP TABLE IF EXISTS support_interactions CASCADE;
DROP TABLE IF EXISTS compensation_awards CASCADE;
DROP TABLE IF EXISTS issue_categories CASCADE;
DROP TABLE IF EXISTS resolution_methods CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS compensation_requests CASCADE;
DROP TABLE IF EXISTS detected_issues CASCADE;
DROP TABLE IF EXISTS support_sessions CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP FUNCTION IF EXISTS get_handling_time_stats();

-- ========== DIMENSION TABLES ==========

-- Enhanced Players table with telemetry and status fields
CREATE TABLE players (
  id SERIAL PRIMARY KEY,
  player_id TEXT UNIQUE NOT NULL,
  player_name TEXT NOT NULL,
  
  -- Game progression
  game_level INTEGER DEFAULT 1,
  vip_level INTEGER DEFAULT 0,
  is_spender BOOLEAN DEFAULT FALSE,
  total_spend DECIMAL(10,2) DEFAULT 0.00,
  session_days INTEGER DEFAULT 1,
  kingdom_id INTEGER,
  alliance_name TEXT,
  
  -- Account Status Fields
  account_status TEXT DEFAULT 'active', -- active, locked, suspended, banned, pending_verification
  lock_reason TEXT, -- security, payment_dispute, tos_violation, automated_security
  suspension_expires TIMESTAMPTZ,
  verification_pending BOOLEAN DEFAULT FALSE,
  
  -- Crash/Technical Telemetry Fields
  recent_crashes INTEGER DEFAULT 0, -- count in last 7 days
  crash_frequency TEXT DEFAULT 'none', -- none, low, medium, high, critical
  last_crash_at TIMESTAMPTZ,
  device_type TEXT, -- ios, android, web
  app_version TEXT,
  os_version TEXT,
  connection_quality TEXT DEFAULT 'good', -- poor, fair, good, excellent
  
  -- Behavioral Flags
  support_tier TEXT DEFAULT 'standard', -- standard, priority, vip, premium
  churn_risk TEXT DEFAULT 'low', -- low, medium, high
  sentiment_history TEXT DEFAULT 'neutral', -- positive, neutral, negative, volatile
  previous_issues INTEGER DEFAULT 0, -- count of past support tickets
  
  -- Timestamps
  last_login TIMESTAMPTZ DEFAULT NOW(),
  account_created TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issue Categories (lookup table)
CREATE TABLE issue_categories (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- tech_crash, acct_lock, miss_reward, purch_fail, etc.
  name TEXT NOT NULL,
  severity_default TEXT DEFAULT 'medium', -- low, medium, high, critical
  auto_comp_eligible BOOLEAN DEFAULT FALSE,
  avg_resolution_mins INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resolution Methods (lookup table)  
CREATE TABLE resolution_methods (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL, -- auto_comp, manual_fix, escalate, no_action, etc.
  name TEXT NOT NULL,
  requires_agent BOOLEAN DEFAULT FALSE,
  avg_time_mins INTEGER DEFAULT 15,
  success_rate DECIMAL(3,2) DEFAULT 0.90,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agents (support staff)
CREATE TABLE agents (
  id SERIAL PRIMARY KEY,
  agent_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'agent', -- agent, supervisor, specialist, ai_bot
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issue Resolutions (automated solutions for different issue categories)
CREATE TABLE issue_resolutions (
  id SERIAL PRIMARY KEY,
  issue_category_code TEXT NOT NULL REFERENCES issue_categories(code),
  
  -- Player context conditions
  account_status TEXT[], -- e.g., ['locked', 'suspended'] - which account statuses this applies to
  player_tier TEXT[], -- e.g., ['vip_whale', 'whale'] - which player tiers this applies to
  vip_level_min INTEGER DEFAULT 0,
  vip_level_max INTEGER DEFAULT 20,
  
  -- Resolution steps (ordered JSON array)
  resolution_steps JSONB NOT NULL, -- [{"step": 1, "action": "send_verification_email", "params": {...}}, ...]
  
  -- Automation settings
  fully_automated BOOLEAN DEFAULT FALSE, -- true if no human intervention needed
  requires_verification BOOLEAN DEFAULT FALSE, -- true if identity verification needed
  verification_method TEXT, -- 'email', 'sms', 'security_questions', 'manual'
  
  -- Compensation rules (if applicable)
  auto_compensate BOOLEAN DEFAULT FALSE,
  compensation_tier TEXT, -- P0-P5
  compensation_reasoning TEXT,
  
  -- Success criteria
  success_conditions JSONB, -- Conditions that mark resolution as successful
  fallback_escalation BOOLEAN DEFAULT TRUE, -- Escalate to human if automated resolution fails
  
  -- Metadata
  name TEXT NOT NULL,
  description TEXT,
  priority INTEGER DEFAULT 10, -- Lower number = higher priority when multiple resolutions match
  active BOOLEAN DEFAULT TRUE,
  created_by TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compensation Rewards Lookup Table
-- Multi-dimensional lookup for consistent compensation awards
CREATE TABLE compensation_rewards (
  id SERIAL PRIMARY KEY,
  
  -- Player tier classification
  player_tier TEXT NOT NULL, -- f2p, light_spender, medium_spender, whale, vip_whale
  
  -- Level ranges 
  level_min INTEGER NOT NULL DEFAULT 1,
  level_max INTEGER NOT NULL DEFAULT 999,
  
  -- VIP level ranges
  vip_min INTEGER NOT NULL DEFAULT 0,
  vip_max INTEGER NOT NULL DEFAULT 20,
  
  -- Spend thresholds (USD)
  spend_min DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  spend_max DECIMAL(10,2) NOT NULL DEFAULT 999999.99,
  
  -- Churn risk multiplier
  churn_risk TEXT NOT NULL, -- low, medium, high
  churn_multiplier DECIMAL(3,2) DEFAULT 1.0,
  
  -- Issue impact level
  impact_level TEXT NOT NULL, -- low, medium, high, critical
  
  -- Base compensation amounts
  base_gold INTEGER DEFAULT 0,
  base_gems INTEGER DEFAULT 0,
  
  -- Resource rewards (stored as JSON for flexibility)
  base_resources JSONB DEFAULT '{}', -- {"energy": 50, "wood": 100, "stone": 100}
  
  -- Item rewards (stored as JSON array)
  base_items JSONB DEFAULT '[]', -- [{"item": "speed_up", "quantity": 2}]
  
  -- VIP point bonus
  vip_points INTEGER DEFAULT 0,
  
  -- Special offers for high-value players
  special_offers JSONB DEFAULT '{}', -- {"discount_percent": 10, "bundle_unlock": "premium"}
  
  -- Additional multipliers
  vip_bonus_multiplier DECIMAL(3,2) DEFAULT 1.0, -- Extra multiplier for VIP levels
  weekend_multiplier DECIMAL(3,2) DEFAULT 1.0,   -- Weekend bonus
  
  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,
  
  -- Admin fields
  active BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT FALSE,
  max_daily_usage INTEGER DEFAULT NULL, -- Prevent abuse
  notes TEXT,
  created_by TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints to prevent overlapping rules
  CONSTRAINT valid_level_range CHECK (level_min <= level_max),
  CONSTRAINT valid_vip_range CHECK (vip_min <= vip_max),
  CONSTRAINT valid_spend_range CHECK (spend_min <= spend_max),
  CONSTRAINT valid_multipliers CHECK (churn_multiplier >= 0 AND vip_bonus_multiplier >= 0)
);

-- Function to calculate total compensation based on lookup
CREATE OR REPLACE FUNCTION calculate_compensation(
  p_player_level INTEGER,
  p_vip_level INTEGER,
  p_total_spend DECIMAL,
  p_churn_risk TEXT,
  p_impact_level TEXT,
  p_is_weekend BOOLEAN DEFAULT FALSE
)
RETURNS JSONB AS $$
DECLARE
  reward_rule RECORD;
  final_gold INTEGER;
  final_gems INTEGER;
  final_resources JSONB;
  final_items JSONB;
  final_vip_points INTEGER;
  total_multiplier DECIMAL(3,2);
BEGIN
  -- Classify player tier based on spend
  DECLARE player_tier TEXT;
  BEGIN
    CASE 
      WHEN p_total_spend = 0 THEN player_tier := 'f2p';
      WHEN p_total_spend < 50 THEN player_tier := 'light_spender';
      WHEN p_total_spend < 500 THEN player_tier := 'medium_spender';
      WHEN p_total_spend < 2000 THEN player_tier := 'whale';
      ELSE player_tier := 'vip_whale';
    END CASE;
  END;
  
  -- Find matching reward rule
  SELECT * INTO reward_rule
  FROM compensation_rewards
  WHERE player_tier = player_tier
    AND p_player_level BETWEEN level_min AND level_max
    AND p_vip_level BETWEEN vip_min AND vip_max
    AND p_total_spend BETWEEN spend_min AND spend_max
    AND churn_risk = p_churn_risk
    AND impact_level = p_impact_level
    AND active = TRUE
  ORDER BY 
    (level_max - level_min) ASC,  -- Prefer more specific level ranges
    (vip_max - vip_min) ASC,      -- Prefer more specific VIP ranges
    (spend_max - spend_min) ASC   -- Prefer more specific spend ranges
  LIMIT 1;
  
  -- If no exact match found, try with fallback rules
  IF reward_rule IS NULL THEN
    SELECT * INTO reward_rule
    FROM compensation_rewards
    WHERE player_tier = 'f2p' -- Fallback to F2P rules
      AND impact_level = p_impact_level
      AND active = TRUE
    LIMIT 1;
  END IF;
  
  -- If still no match, return minimal compensation
  IF reward_rule IS NULL THEN
    RETURN jsonb_build_object(
      'gold', 100,
      'gems', 0,
      'resources', '{}',
      'items', '[]',
      'vip_points', 0,
      'rule_id', NULL,
      'error', 'No matching reward rule found'
    );
  END IF;
  
  -- Calculate total multiplier
  total_multiplier := reward_rule.churn_multiplier * reward_rule.vip_bonus_multiplier;
  IF p_is_weekend THEN
    total_multiplier := total_multiplier * reward_rule.weekend_multiplier;
  END IF;
  
  -- Apply multipliers to base amounts
  final_gold := ROUND(reward_rule.base_gold * total_multiplier);
  final_gems := ROUND(reward_rule.base_gems * total_multiplier);
  final_vip_points := ROUND(reward_rule.vip_points * total_multiplier);
  final_resources := reward_rule.base_resources;
  final_items := reward_rule.base_items;
  
  -- Update usage tracking
  UPDATE compensation_rewards 
  SET times_used = times_used + 1, 
      last_used = NOW()
  WHERE id = reward_rule.id;
  
  -- Return calculated compensation
  RETURN jsonb_build_object(
    'gold', final_gold,
    'gems', final_gems,
    'resources', final_resources,
    'items', final_items,
    'vip_points', final_vip_points,
    'special_offers', reward_rule.special_offers,
    'rule_id', reward_rule.id,
    'player_tier', player_tier,
    'multiplier_applied', total_multiplier,
    'requires_approval', reward_rule.requires_approval
  );
END;
$$ LANGUAGE plpgsql;

-- ========== FACT TABLE (STAR SCHEMA CENTER) ==========

-- Central fact table for all support interactions
CREATE TABLE support_interactions (
  id SERIAL PRIMARY KEY,
  
  -- Dimension keys
  player_id TEXT NOT NULL REFERENCES players(player_id),
  issue_category_id INTEGER REFERENCES issue_categories(id),
  resolution_method_id INTEGER REFERENCES resolution_methods(id),
  agent_id INTEGER REFERENCES agents(id),
  
  -- Interaction identifiers
  session_id TEXT NOT NULL, -- unique session identifier
  ticket_id TEXT, -- created post-resolution if needed
  
  -- Core facts/metrics
  duration_mins INTEGER DEFAULT 0,
  messages_exchanged INTEGER DEFAULT 0,
  escalations INTEGER DEFAULT 0,
  compensation_value_usd DECIMAL(8,2) DEFAULT 0.00,
  
  -- Status and outcome
  status TEXT DEFAULT 'open', -- open, resolved, escalated, closed
  outcome TEXT DEFAULT 'pending', -- resolved, partial, escalated, abandoned
  satisfaction_rating INTEGER, -- 1-5 if provided
  
  -- Timestamps (fact table dates)
  interaction_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ========== TRANSACTIONAL TABLES ==========

-- Compensation awards (separate from interactions for detailed tracking)
CREATE TABLE compensation_awards (
  id SERIAL PRIMARY KEY,
  interaction_id INTEGER NOT NULL REFERENCES support_interactions(id),
  
  -- Award details
  gold INTEGER DEFAULT 0,
  gems INTEGER DEFAULT 0,
  resources JSONB DEFAULT '{}',
  items JSONB DEFAULT '[]',
  
  -- Processing
  status TEXT DEFAULT 'pending', -- pending, approved, delivered, failed
  approved_by INTEGER REFERENCES agents(id),
  delivered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post-hoc AI Analysis (created AFTER interaction analysis)
CREATE TABLE ai_analysis (
  id SERIAL PRIMARY KEY,
  interaction_id INTEGER NOT NULL REFERENCES support_interactions(id),
  
  -- AI analysis results
  issue_detected BOOLEAN DEFAULT FALSE,
  confidence_score DECIMAL(3,2),
  sentiment TEXT, -- pos, neu, neg
  urgency TEXT, -- low, med, high
  compensation_tier TEXT, -- P0-P5, NONE
  
  -- Processing metadata
  model_version TEXT,
  analysis_duration_ms INTEGER,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Analysis details (kept short)
  key_phrases TEXT[], -- array of extracted key phrases
  issue_codes TEXT[], -- array of issue category codes detected
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legacy tables for backward compatibility (will be deprecated)
CREATE TABLE detected_issues (
  id SERIAL PRIMARY KEY,
  session_id INTEGER,
  message_id INTEGER,
  issue_type TEXT NOT NULL,
  description TEXT,
  player_impact TEXT,
  confidence_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE compensation_requests (
  id SERIAL PRIMARY KEY,
  session_id INTEGER,
  issue_id INTEGER REFERENCES detected_issues(id),
  player_id TEXT NOT NULL,
  tier TEXT DEFAULT 'P3',
  reasoning TEXT,
  status TEXT DEFAULT 'pending',
  requires_human_review BOOLEAN DEFAULT FALSE,
  gold INTEGER DEFAULT 0,
  resources JSONB DEFAULT '{}'::jsonb,
  items JSONB DEFAULT NULL,
  vip_points INTEGER DEFAULT 0,
  special_offers JSONB DEFAULT NULL,
  handling_time_metrics JSONB DEFAULT '{
    "estimatedMinutes": "10",
    "humanEstimatedMinutes": "30",
    "complexityScore": "5.0",
    "resolutionSteps": "8",
    "automationPotential": "6.0"
  }'::jsonb,
  reviewed_by TEXT,
  review_notes TEXT,
  actual_compensation JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ========== POPULATE LOOKUP TABLES ==========

-- Issue Categories
INSERT INTO issue_categories (code, name, severity_default, auto_comp_eligible, avg_resolution_mins) VALUES
('tech_crash', 'Game Crash', 'high', TRUE, 20),
('tech_freeze', 'Game Freeze', 'medium', TRUE, 15),
('tech_load', 'Loading Issues', 'medium', TRUE, 10),
('acct_lock', 'Account Locked', 'critical', FALSE, 45),
('acct_susp', 'Account Suspended', 'critical', FALSE, 60),
('acct_veri', 'Verification Required', 'high', FALSE, 30),
('miss_reward', 'Missing Rewards', 'medium', TRUE, 25),
('miss_purch', 'Missing Purchase', 'high', FALSE, 40),
('purch_fail', 'Purchase Failed', 'high', FALSE, 35),
('prog_block', 'Progression Blocked', 'medium', TRUE, 30),
('ui_bug', 'UI Bug', 'low', TRUE, 10),
('conn_issue', 'Connection Problem', 'medium', TRUE, 15);

-- Resolution Methods  
INSERT INTO resolution_methods (code, name, requires_agent, avg_time_mins, success_rate) VALUES
('auto_comp', 'Automated Compensation', FALSE, 5, 0.95),
('manual_fix', 'Manual Fix', TRUE, 30, 0.90),
('acct_unlock', 'Account Unlock', TRUE, 25, 0.98),
('redeliver', 'Redeliver Items', TRUE, 15, 0.99),
('escalate', 'Escalate to Specialist', TRUE, 60, 0.85),
('no_action', 'No Action Needed', FALSE, 2, 1.00),
('workaround', 'Provide Workaround', TRUE, 20, 0.80);

-- Agents
INSERT INTO agents (agent_id, name, role, active) VALUES
('ai_bot', 'AI Assistant', 'ai_bot', TRUE),
('agent_sarah', 'Sarah Wilson', 'agent', TRUE),
('agent_mike', 'Mike Chen', 'agent', TRUE),
('sup_alex', 'Alex Rodriguez', 'supervisor', TRUE);

-- Issue Resolutions
INSERT INTO issue_resolutions (
  issue_category_code, account_status, player_tier, vip_level_min, vip_level_max,
  resolution_steps, fully_automated, requires_verification, verification_method,
  auto_compensate, compensation_tier, compensation_reasoning,
  success_conditions, fallback_escalation, name, description, priority
) VALUES

-- Account Lock Resolution (requires email verification)
('acct_lock', ARRAY['locked'], ARRAY['f2p', 'light_spender', 'medium_spender', 'whale', 'vip_whale'], 0, 20,
 '[
   {"step": 1, "action": "verify_account_ownership", "params": {"method": "email"}},
   {"step": 2, "action": "send_verification_code", "params": {"delivery": "email", "expires_minutes": 30}},
   {"step": 3, "action": "await_verification_response", "params": {"timeout_minutes": 30}},
   {"step": 4, "action": "unlock_account", "params": {"update_status": "active", "clear_lock_reason": true}},
   {"step": 5, "action": "send_confirmation", "params": {"message": "Your account has been successfully unlocked. Welcome back!"}}
 ]'::jsonb,
 FALSE, TRUE, 'email',
 TRUE, 'P2', 'Account was locked for security reasons, compensation provided for inconvenience',
 '{"verification_completed": true, "account_unlocked": true}'::jsonb,
 TRUE, 'Account Unlock via Email Verification', 
 'Unlocks locked accounts through email verification process with security compensation', 1),

-- Account Lock for VIP players (priority handling)
('acct_lock', ARRAY['locked'], ARRAY['vip_whale'], 10, 20,
 '[
   {"step": 1, "action": "priority_flag", "params": {"priority": "high", "vip_alert": true}},
   {"step": 2, "action": "verify_account_ownership", "params": {"method": "email"}},
   {"step": 3, "action": "send_verification_code", "params": {"delivery": "email", "expires_minutes": 15}},
   {"step": 4, "action": "await_verification_response", "params": {"timeout_minutes": 15}},
   {"step": 5, "action": "unlock_account", "params": {"update_status": "active", "clear_lock_reason": true}},
   {"step": 6, "action": "send_vip_confirmation", "params": {"message": "Your VIP account has been restored. Thank you for your patience."}}
 ]'::jsonb,
 FALSE, TRUE, 'email',
 TRUE, 'P1', 'VIP account lock resolved with priority compensation for service disruption',
 '{"verification_completed": true, "account_unlocked": true, "vip_priority": true}'::jsonb,
 TRUE, 'VIP Account Unlock (Priority)', 
 'Priority unlock process for VIP players with enhanced compensation', 0),

-- Technical Crash Resolution
('tech_crash', ARRAY['active'], ARRAY['f2p', 'light_spender', 'medium_spender', 'whale', 'vip_whale'], 0, 20,
 '[
   {"step": 1, "action": "collect_crash_logs", "params": {"automatic": true}},
   {"step": 2, "action": "identify_crash_cause", "params": {"analyze_logs": true}},
   {"step": 3, "action": "provide_workaround", "params": {"restart_game": true, "clear_cache": true}},
   {"step": 4, "action": "auto_compensate", "params": {"reason": "crash_recovery"}}
 ]'::jsonb,
 TRUE, FALSE, NULL,
 TRUE, 'P3', 'Automated compensation for game crash and potential progress loss',
 '{"workaround_provided": true, "compensation_delivered": true}'::jsonb,
 TRUE, 'Automated Crash Recovery', 
 'Automatically resolves game crashes with workarounds and compensation', 5),

-- Missing Rewards Resolution
('miss_reward', ARRAY['active'], ARRAY['f2p', 'light_spender', 'medium_spender', 'whale', 'vip_whale'], 0, 20,
 '[
   {"step": 1, "action": "verify_reward_eligibility", "params": {"check_logs": true}},
   {"step": 2, "action": "calculate_missing_rewards", "params": {"include_bonuses": true}},
   {"step": 3, "action": "deliver_rewards", "params": {"method": "inbox", "notify": true}},
   {"step": 4, "action": "update_player_progress", "params": {"sync_achievements": true}}
 ]'::jsonb,
 TRUE, FALSE, NULL,
 TRUE, 'P4', 'Missing rewards automatically restored to player account',
 '{"rewards_delivered": true, "progress_updated": true}'::jsonb,
 FALSE, 'Automated Reward Recovery', 
 'Automatically identifies and delivers missing rewards to players', 3),

-- Purchase Issues Resolution (requires human verification for refunds)
('purch_fail', ARRAY['active'], ARRAY['light_spender', 'medium_spender', 'whale', 'vip_whale'], 1, 20,
 '[
   {"step": 1, "action": "verify_purchase_receipt", "params": {"validate_transaction": true}},
   {"step": 2, "action": "check_item_delivery", "params": {"scan_inventory": true}},
   {"step": 3, "action": "escalate_to_billing", "params": {"include_receipt": true, "priority": "high"}},
   {"step": 4, "action": "provide_interim_support", "params": {"courtesy_items": true}}
 ]'::jsonb,
 FALSE, FALSE, NULL,
 TRUE, 'P2', 'Purchase failure compensation while billing team investigates',
 '{"receipt_verified": true, "escalated_to_billing": true}'::jsonb,
 TRUE, 'Purchase Failure Investigation', 
 'Handles failed purchases with verification and billing team escalation', 2);

-- Add index for performance
CREATE INDEX idx_issue_resolutions_category ON issue_resolutions(issue_category_code);
CREATE INDEX idx_issue_resolutions_status ON issue_resolutions(account_status);
CREATE INDEX idx_issue_resolutions_priority ON issue_resolutions(priority, active);

-- Compensation Rewards Rules
-- F2P Players (Free-to-Play)
INSERT INTO compensation_rewards (
  player_tier, level_min, level_max, vip_min, vip_max, spend_min, spend_max, 
  churn_risk, churn_multiplier, impact_level, base_gold, base_gems, base_resources, base_items, 
  vip_points, vip_bonus_multiplier, requires_approval, notes, created_by
) VALUES

-- F2P - Low Impact Issues
('f2p', 1, 10, 0, 0, 0.00, 0.00, 'low', 1.0, 'low', 100, 0, '{"energy": 10}', '[]', 0, 1.0, FALSE, 'Basic F2P compensation for minor issues', 'system'),
('f2p', 11, 20, 0, 1, 0.00, 0.00, 'low', 1.0, 'low', 200, 0, '{"energy": 15, "wood": 50}', '[]', 0, 1.0, FALSE, 'Mid-game F2P compensation', 'system'),
('f2p', 21, 999, 0, 2, 0.00, 0.00, 'low', 1.0, 'low', 300, 0, '{"energy": 25, "wood": 100, "stone": 50}', '[]', 0, 1.0, FALSE, 'Late-game F2P compensation', 'system'),

-- F2P - Medium Impact Issues  
('f2p', 1, 10, 0, 0, 0.00, 0.00, 'low', 1.0, 'medium', 250, 0, '{"energy": 25}', '[{"item": "speed_up", "quantity": 1}]', 0, 1.0, FALSE, 'F2P medium impact - early game', 'system'),
('f2p', 11, 20, 0, 1, 0.00, 0.00, 'low', 1.0, 'medium', 400, 0, '{"energy": 35, "wood": 100}', '[{"item": "speed_up", "quantity": 2}]', 0, 1.0, FALSE, 'F2P medium impact - mid game', 'system'),
('f2p', 21, 999, 0, 2, 0.00, 0.00, 'low', 1.0, 'medium', 600, 0, '{"energy": 50, "wood": 200, "stone": 100}', '[{"item": "speed_up", "quantity": 3}]', 0, 1.0, FALSE, 'F2P medium impact - late game', 'system'),

-- F2P - High Impact Issues
('f2p', 1, 999, 0, 2, 0.00, 0.00, 'low', 1.0, 'high', 1000, 0, '{"energy": 100, "wood": 500, "stone": 300}', '[{"item": "speed_up", "quantity": 5}, {"item": "shield", "quantity": 1}]', 0, 1.0, TRUE, 'F2P high impact requires approval', 'system'),

-- F2P - Churn Risk Multipliers
('f2p', 1, 999, 0, 2, 0.00, 0.00, 'medium', 1.25, 'medium', 400, 0, '{"energy": 35, "wood": 100}', '[{"item": "speed_up", "quantity": 2}]', 0, 1.0, FALSE, 'F2P medium churn risk bonus', 'system'),
('f2p', 1, 999, 0, 2, 0.00, 0.00, 'high', 1.5, 'medium', 400, 0, '{"energy": 35, "wood": 100}', '[{"item": "speed_up", "quantity": 2}]', 0, 1.0, FALSE, 'F2P high churn risk bonus', 'system'),

-- Light Spenders ($0.01 - $49.99)
('light_spender', 1, 15, 0, 3, 0.01, 49.99, 'low', 1.0, 'low', 300, 10, '{"energy": 20, "wood": 100}', '[]', 5, 1.1, FALSE, 'Light spender basic compensation', 'system'),
('light_spender', 16, 25, 2, 5, 0.01, 49.99, 'low', 1.0, 'medium', 500, 25, '{"energy": 40, "wood": 200, "stone": 100}', '[{"item": "speed_up", "quantity": 3}]', 10, 1.2, FALSE, 'Light spender mid-tier compensation', 'system'),
('light_spender', 26, 999, 3, 7, 0.01, 49.99, 'low', 1.0, 'high', 800, 50, '{"energy": 75, "wood": 400, "stone": 200}', '[{"item": "speed_up", "quantity": 5}, {"item": "shield", "quantity": 2}]', 20, 1.3, FALSE, 'Light spender high impact', 'system'),

-- Medium Spenders ($50 - $499.99)
('medium_spender', 1, 20, 3, 7, 50.00, 499.99, 'low', 1.0, 'low', 500, 25, '{"energy": 30, "wood": 150, "stone": 100}', '[{"item": "speed_up", "quantity": 2}]', 15, 1.2, FALSE, 'Medium spender basic', 'system'),
('medium_spender', 21, 999, 5, 10, 50.00, 499.99, 'low', 1.0, 'medium', 1000, 75, '{"energy": 60, "wood": 300, "stone": 200, "iron": 100}', '[{"item": "speed_up", "quantity": 5}, {"item": "shield", "quantity": 2}]', 30, 1.4, FALSE, 'Medium spender standard', 'system'),
('medium_spender', 1, 999, 3, 10, 50.00, 499.99, 'low', 1.0, 'high', 1500, 150, '{"energy": 100, "wood": 500, "stone": 300, "iron": 200}', '[{"item": "speed_up", "quantity": 8}, {"item": "shield", "quantity": 3}, {"item": "premium_chest", "quantity": 1}]', 50, 1.5, TRUE, 'Medium spender high impact needs approval', 'system'),

-- Whales ($500 - $1999.99)  
('whale', 15, 999, 7, 15, 500.00, 1999.99, 'low', 1.0, 'low', 1000, 100, '{"energy": 50, "wood": 250, "stone": 150, "iron": 100}', '[{"item": "speed_up", "quantity": 5}, {"item": "shield", "quantity": 2}]', 50, 1.5, FALSE, 'Whale basic compensation', 'system'),
('whale', 15, 999, 7, 15, 500.00, 1999.99, 'low', 1.0, 'medium', 2000, 250, '{"energy": 100, "wood": 500, "stone": 300, "iron": 200, "gems": 25}', '[{"item": "speed_up", "quantity": 10}, {"item": "shield", "quantity": 5}, {"item": "premium_chest", "quantity": 2}]', 100, 1.7, FALSE, 'Whale standard compensation', 'system'),
('whale', 15, 999, 7, 15, 500.00, 1999.99, 'low', 1.0, 'high', 3500, 500, '{"energy": 200, "wood": 1000, "stone": 600, "iron": 400, "gems": 100}', '[{"item": "speed_up", "quantity": 20}, {"item": "shield", "quantity": 10}, {"item": "premium_chest", "quantity": 5}]', 200, 2.0, TRUE, 'Whale high impact - requires approval', 'system'),

-- VIP Whales ($2000+)
('vip_whale', 20, 999, 10, 20, 2000.00, 999999.99, 'low', 1.0, 'low', 2000, 200, '{"energy": 75, "wood": 400, "stone": 250, "iron": 150, "gems": 50}', '[{"item": "speed_up", "quantity": 10}, {"item": "shield", "quantity": 5}, {"item": "premium_chest", "quantity": 2}]', 100, 2.0, FALSE, 'VIP Whale basic compensation', 'system'),
('vip_whale', 20, 999, 10, 20, 2000.00, 999999.99, 'low', 1.0, 'medium', 4000, 500, '{"energy": 150, "wood": 800, "stone": 500, "iron": 300, "gems": 150}', '[{"item": "speed_up", "quantity": 20}, {"item": "shield", "quantity": 10}, {"item": "premium_chest", "quantity": 5}, {"item": "exclusive_bundle", "quantity": 1}]', 250, 2.5, TRUE, 'VIP Whale standard - needs approval', 'system'),
('vip_whale', 20, 999, 10, 20, 2000.00, 999999.99, 'low', 1.0, 'high', 7500, 1000, '{"energy": 300, "wood": 1500, "stone": 1000, "iron": 600, "gems": 300}', '[{"item": "speed_up", "quantity": 50}, {"item": "shield", "quantity": 25}, {"item": "premium_chest", "quantity": 15}, {"item": "exclusive_bundle", "quantity": 3}]', 500, 3.0, TRUE, 'VIP Whale critical impact - executive approval required', 'system'),

-- Special weekend multipliers and churn risk bonuses for high-value players
('whale', 15, 999, 7, 15, 500.00, 1999.99, 'medium', 1.3, 'medium', 2000, 250, '{"energy": 100, "wood": 500, "stone": 300}', '[{"item": "speed_up", "quantity": 10}]', 100, 1.7, FALSE, 'Whale medium churn risk bonus', 'system'),
('whale', 15, 999, 7, 15, 500.00, 1999.99, 'high', 1.6, 'medium', 2000, 250, '{"energy": 100, "wood": 500, "stone": 300}', '[{"item": "speed_up", "quantity": 10}]', 100, 1.7, FALSE, 'Whale high churn risk bonus', 'system'),

('vip_whale', 20, 999, 10, 20, 2000.00, 999999.99, 'medium', 1.4, 'medium', 4000, 500, '{"energy": 150, "wood": 800, "stone": 500}', '[{"item": "premium_chest", "quantity": 5}]', 250, 2.5, TRUE, 'VIP Whale medium churn risk', 'system'),
('vip_whale', 20, 999, 10, 20, 2000.00, 999999.99, 'high', 1.8, 'medium', 4000, 500, '{"energy": 150, "wood": 800, "stone": 500}', '[{"item": "premium_chest", "quantity": 5}]', 250, 2.5, TRUE, 'VIP Whale high churn risk - retention critical', 'system');

-- ========== SAMPLE PLAYERS WITH REALISTIC TELEMETRY ==========
INSERT INTO players (
  player_id, player_name, game_level, vip_level, is_spender, total_spend, session_days,
  kingdom_id, alliance_name, account_status, lock_reason, recent_crashes, crash_frequency, 
  device_type, app_version, support_tier, churn_risk, previous_issues
) VALUES
('lannister-gold', 'LannisterGold', 27, 12, TRUE, 2187.00, 89, 421, 'House Lannister', 
 'locked', 'automated_security', 0, 'none', 'ios', '2.1.4', 'vip', 'low', 2),
 
('stark_wolf', 'StarkWolf', 15, 3, TRUE, 120.50, 25, 101, 'Northern Alliance',
 'active', NULL, 2, 'low', 'android', '2.1.3', 'priority', 'medium', 1),
 
('night_king99', 'NightKing99', 8, 0, FALSE, 0.00, 12, 205, 'Free Folk',
 'active', NULL, 5, 'medium', 'android', '2.0.8', 'standard', 'high', 0),
 
('dragon_queen', 'DragonQueen', 30, 8, TRUE, 890.25, 67, 302, 'Dragon Lords',
 'locked', 'security', 0, 'none', 'ios', '2.1.4', 'vip', 'low', 3),
 
('tyrell_rose', 'TyrellRose', 22, 5, TRUE, 340.00, 45, 150, 'Golden Roses',
 'active', NULL, 1, 'low', 'web', '2.1.4', 'priority', 'low', 1);

-- ========== SAMPLE SUPPORT INTERACTIONS (FACT DATA) ==========
INSERT INTO support_interactions (
  player_id, issue_category_id, resolution_method_id, agent_id, session_id, 
  duration_mins, messages_exchanged, status, outcome, compensation_value_usd,
  interaction_date, resolved_at
) VALUES
-- Recent successful automated resolutions
('stark_wolf', 1, 1, 1, 'sess_001', 8, 3, 'resolved', 'resolved', 2.50, CURRENT_DATE - 1, NOW() - INTERVAL '1 day'),
('night_king99', 3, 1, 1, 'sess_002', 5, 2, 'resolved', 'resolved', 1.00, CURRENT_DATE - 1, NOW() - INTERVAL '1 day'),
('tyrell_rose', 7, 4, 2, 'sess_003', 20, 6, 'resolved', 'resolved', 5.00, CURRENT_DATE - 2, NOW() - INTERVAL '2 days'),

-- Agent-handled cases  
('dragon_queen', 4, 3, 3, 'sess_004', 35, 12, 'resolved', 'resolved', 0.00, CURRENT_DATE - 3, NOW() - INTERVAL '3 days'),
('lannister-gold', 8, 4, 2, 'sess_005', 25, 8, 'resolved', 'resolved', 15.00, CURRENT_DATE - 4, NOW() - INTERVAL '4 days'),

-- Pending cases
('stark_wolf', 2, NULL, NULL, 'sess_006', 0, 1, 'open', 'pending', 0.00, CURRENT_DATE, NULL),
('dragon_queen', 4, NULL, 4, 'sess_007', 15, 4, 'escalated', 'pending', 0.00, CURRENT_DATE, NULL);

-- ========== SAMPLE AI ANALYSIS (POST-HOC) ==========
INSERT INTO ai_analysis (
  interaction_id, issue_detected, confidence_score, sentiment, urgency, compensation_tier,
  model_version, analysis_duration_ms, key_phrases, issue_codes
) VALUES
(1, TRUE, 0.95, 'neg', 'med', 'P3', 'llama3.1-8b', 1200, 
 '{"game crashed", "lost progress", "frustrated"}', '{"tech_crash"}'),
 
(2, TRUE, 0.87, 'neu', 'low', 'P4', 'llama3.1-8b', 800,
 '{"slow loading", "minor issue"}', '{"tech_load"}'),
 
(3, TRUE, 0.92, 'pos', 'med', 'P2', 'llama3.1-8b', 1500,
 '{"missing rewards", "completed battle", "should have received"}', '{"miss_reward"}'),
 
(4, TRUE, 0.98, 'neg', 'high', 'P1', 'llama3.1-8b', 2100,
 '{"account locked", "cant login", "vip player", "urgent"}', '{"acct_lock"}'),
 
(5, TRUE, 0.89, 'pos', 'med', 'P2', 'llama3.1-8b', 1800,
 '{"purchase missing", "paid but no items", "receipt available"}', '{"miss_purch"});

-- ========== SAMPLE COMPENSATION AWARDS ==========
INSERT INTO compensation_awards (
  interaction_id, gold, gems, resources, items, status, approved_by, delivered_at
) VALUES
(1, 500, 0, '{"energy": 25}', '[]', 'delivered', 1, NOW() - INTERVAL '1 day'),
(2, 200, 0, '{}', '[]', 'delivered', 1, NOW() - INTERVAL '1 day'),  
(3, 1000, 100, '{"wood": 500, "stone": 300}', '[{"item": "speed_up", "qty": 2}]', 'delivered', 2, NOW() - INTERVAL '2 days'),
(5, 2500, 500, '{"premium_currency": 50}', '[{"item": "premium_chest", "qty": 1}]', 'delivered', 2, NOW() - INTERVAL '4 days');

-- ========== LEGACY DATA FOR BACKWARD COMPATIBILITY ==========
-- Populate legacy tables with sample data to keep existing functionality working
INSERT INTO detected_issues (session_id, issue_type, description, player_impact, confidence_score) VALUES
(1, 'technical', 'Game crashed during raid', 'severe', 0.95),
(1, 'technical', 'Unable to access inventory', 'moderate', 0.85),
(2, 'account', 'Missing purchased items', 'severe', 0.90),
(3, 'gameplay', 'Mission unable to complete', 'minor', 0.75),
(4, 'account', 'Login issues after update', 'severe', 0.92);

-- Legacy compensation requests
INSERT INTO compensation_requests (
  session_id, issue_id, player_id, tier, reasoning, status, requires_human_review,
  gold, resources, items, vip_points, handling_time_metrics, created_at, updated_at, resolved_at
) VALUES
(1, 1, 'stark_wolf', 'P2', 'Technical issue caused loss of raid rewards', 
  'approved', TRUE, 1000, '{"energy": 50, "tokens": 25}'::jsonb,
  '[{"name": "Raid Recovery Kit", "quantity": 1}]'::jsonb, 20,
  '{"estimatedMinutes": "45", "complexityScore": "7.5", "resolutionSteps": "12", "automationPotential": "4.0"}'::jsonb,
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '40 minutes', NOW() - INTERVAL '3 days' + INTERVAL '45 minutes'),
  
(2, 3, 'dragon_queen', 'P1', 'Account issue with missing purchased items', 
  'approved', TRUE, 2000, '{"premium_currency": 100}'::jsonb,
  '[{"name": "Premium Chest", "quantity": 2}]'::jsonb, 50,
  '{"estimatedMinutes": "60", "complexityScore": "8.0", "resolutionSteps": "15", "automationPotential": "3.5"}'::jsonb,
  NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '55 minutes', NOW() - INTERVAL '5 days' + INTERVAL '60 minutes'),
  
(3, 4, 'night_king99', 'P3', 'Gameplay issue affecting progression', 
  'denied', TRUE, 0, '{}'::jsonb,
  NULL, 0,
  '{"estimatedMinutes": "30", "complexityScore": "5.0", "resolutionSteps": "8", "automationPotential": "6.0"}'::jsonb,
  NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '25 minutes', NOW() - INTERVAL '7 days' + INTERVAL '30 minutes');

-- ========== ANALYTICS FUNCTIONS ==========

-- Updated analytics function for star schema
CREATE OR REPLACE FUNCTION get_handling_time_stats()
RETURNS TABLE (
  total_interactions BIGINT,
  avg_resolution_mins NUMERIC,
  automated_resolution_rate NUMERIC,
  total_compensation_usd NUMERIC,
  avg_satisfaction NUMERIC,
  resolution_rate NUMERIC,
  escalation_rate NUMERIC,
  -- Legacy compatibility fields
  average_handling_minutes NUMERIC,
  total_estimated_hours NUMERIC,
  average_complexity NUMERIC,
  average_steps NUMERIC,
  automation_score NUMERIC,
  human_resolution_minutes NUMERIC,
  bot_resolution_minutes NUMERIC,
  human_resolution_count BIGINT,
  automated_resolution_count BIGINT,
  time_saved_percentage NUMERIC,
  total_time_saved_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH interaction_stats AS (
    SELECT
      COUNT(*) AS total_interactions,
      ROUND(AVG(NULLIF(si.duration_mins, 0)), 2) AS avg_resolution_mins,
      ROUND(
        COUNT(CASE WHEN rm.requires_agent = FALSE THEN 1 END)::numeric / 
        NULLIF(COUNT(CASE WHEN si.status = 'resolved' THEN 1 END), 0) * 100, 2
      ) AS automated_resolution_rate,
      ROUND(SUM(si.compensation_value_usd), 2) AS total_compensation_usd,
      ROUND(AVG(NULLIF(si.satisfaction_rating, 0)), 2) AS avg_satisfaction,
      ROUND(
        COUNT(CASE WHEN si.outcome = 'resolved' THEN 1 END)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 2
      ) AS resolution_rate,
      ROUND(
        COUNT(CASE WHEN si.status = 'escalated' THEN 1 END)::numeric / 
        NULLIF(COUNT(*), 0) * 100, 2
      ) AS escalation_rate
    FROM support_interactions si
    LEFT JOIN resolution_methods rm ON si.resolution_method_id = rm.id
    WHERE si.interaction_date >= CURRENT_DATE - INTERVAL '30 days'
  ),
  legacy_stats AS (
    SELECT
      COALESCE(AVG(NULLIF((handling_time_metrics->>'estimatedMinutes')::numeric, 0)), 0) AS average_handling_minutes,
      COALESCE(SUM(NULLIF((handling_time_metrics->>'estimatedMinutes')::numeric, 0)) / 60.0, 0) AS total_estimated_hours,
      COALESCE(AVG(NULLIF((handling_time_metrics->>'complexityScore')::numeric, 0)), 0) AS average_complexity,
      COALESCE(AVG(NULLIF((handling_time_metrics->>'resolutionSteps')::numeric, 0)), 0) AS average_steps,
      COALESCE(AVG(NULLIF((handling_time_metrics->>'automationPotential')::numeric, 0)), 0) AS automation_score,
      COALESCE(AVG(CASE WHEN requires_human_review = true THEN NULLIF((handling_time_metrics->>'estimatedMinutes')::numeric, 0) ELSE NULL END), 0) AS human_resolution_minutes,
      COALESCE(AVG(CASE WHEN requires_human_review = false THEN NULLIF((handling_time_metrics->>'estimatedMinutes')::numeric, 0) ELSE NULL END), 0) AS bot_resolution_minutes,
      COUNT(CASE WHEN requires_human_review = true THEN 1 ELSE NULL END) AS human_resolution_count,
      COUNT(CASE WHEN requires_human_review = false THEN 1 ELSE NULL END) AS automated_resolution_count,
      CASE
        WHEN COALESCE(AVG(CASE WHEN requires_human_review = true THEN NULLIF((handling_time_metrics->>'estimatedMinutes')::numeric, 0) ELSE NULL END), 0) > 0 
          AND COALESCE(AVG(CASE WHEN requires_human_review = false THEN NULLIF((handling_time_metrics->>'estimatedMinutes')::numeric, 0) ELSE NULL END), 0) > 0
        THEN ROUND(
          (1 - (COALESCE(AVG(CASE WHEN requires_human_review = false THEN NULLIF((handling_time_metrics->>'estimatedMinutes')::numeric, 0) ELSE NULL END), 0) / 
            COALESCE(AVG(CASE WHEN requires_human_review = true THEN NULLIF((handling_time_metrics->>'estimatedMinutes')::numeric, 0) ELSE NULL END), 1))) * 100
        )
        ELSE 0
      END AS time_saved_percentage,
      CASE 
        WHEN COUNT(CASE WHEN requires_human_review = false THEN 1 ELSE NULL END) > 0
          AND COALESCE(AVG(CASE WHEN requires_human_review = true THEN NULLIF((handling_time_metrics->>'estimatedMinutes')::numeric, 0) ELSE NULL END), 0) > 
             COALESCE(AVG(CASE WHEN requires_human_review = false THEN NULLIF((handling_time_metrics->>'estimatedMinutes')::numeric, 0) ELSE NULL END), 0)
        THEN ROUND(
          (COUNT(CASE WHEN requires_human_review = false THEN 1 ELSE NULL END) * 
           (COALESCE(AVG(CASE WHEN requires_human_review = true THEN NULLIF((handling_time_metrics->>'estimatedMinutes')::numeric, 0) ELSE NULL END), 0) - 
            COALESCE(AVG(CASE WHEN requires_human_review = false THEN NULLIF((handling_time_metrics->>'estimatedMinutes')::numeric, 0) ELSE NULL END), 0)) / 60.0
          ) * 10
        ) / 10
        ELSE 0
      END AS total_time_saved_hours
    FROM compensation_requests
    WHERE handling_time_metrics IS NOT NULL 
      AND (handling_time_metrics->>'estimatedMinutes')::numeric > 0 
      AND status IN ('approved', 'denied', 'delivered')
  )
  SELECT
    i.total_interactions,
    i.avg_resolution_mins,
    i.automated_resolution_rate,
    i.total_compensation_usd,
    i.avg_satisfaction,
    i.resolution_rate,
    i.escalation_rate,
    -- Legacy compatibility
    l.average_handling_minutes,
    l.total_estimated_hours,
    l.average_complexity,
    l.average_steps,
    l.automation_score,
    l.human_resolution_minutes,
    l.bot_resolution_minutes,
    l.human_resolution_count,
    l.automated_resolution_count,
    l.time_saved_percentage,
    l.total_time_saved_hours
  FROM interaction_stats i, legacy_stats l;
END;
$$ LANGUAGE plpgsql;

-- ========== INDEXES FOR PERFORMANCE ==========
CREATE INDEX idx_support_interactions_date ON support_interactions(interaction_date);
CREATE INDEX idx_support_interactions_player ON support_interactions(player_id);
CREATE INDEX idx_support_interactions_category ON support_interactions(issue_category_id);
CREATE INDEX idx_support_interactions_status ON support_interactions(status);
CREATE INDEX idx_players_status ON players(account_status);
CREATE INDEX idx_players_crashes ON players(recent_crashes, crash_frequency);
CREATE INDEX idx_ai_analysis_interaction ON ai_analysis(interaction_id);
CREATE INDEX idx_compensation_interaction ON compensation_awards(interaction_id);