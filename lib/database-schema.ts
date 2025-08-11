/**
 * Database schema for compensation system
 * 
 * This file defines the database schema used for storing support sessions,
 * issues, and compensation requests.
 */

// The following schema can be used to create tables in Supabase

export const SUPPORT_SESSIONS_TABLE = `
CREATE TABLE support_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id TEXT NOT NULL,
  player_name TEXT,
  game_level INTEGER NOT NULL,
  vip_level INTEGER DEFAULT 0,
  is_spender BOOLEAN DEFAULT FALSE,
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

export const SUPPORT_MESSAGES_TABLE = `
CREATE TABLE support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES support_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

export const DETECTED_ISSUES_TABLE = `
CREATE TABLE detected_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES support_sessions(id) ON DELETE CASCADE,
  message_id UUID REFERENCES support_messages(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL CHECK (issue_type IN ('technical', 'account', 'gameplay')),
  description TEXT NOT NULL,
  player_impact TEXT NOT NULL CHECK (player_impact IN ('minimal', 'minor', 'moderate', 'severe', 'critical')),
  confidence_score DECIMAL(3, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

export const COMPENSATION_REQUESTS_TABLE = `
CREATE TABLE compensation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID REFERENCES detected_issues(id) ON DELETE CASCADE,
  session_id UUID REFERENCES support_sessions(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('P0', 'P1', 'P2', 'P3', 'P4', 'P5')),
  reasoning TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'under_review', 'approved', 'denied', 'delivered')),
  requires_human_review BOOLEAN DEFAULT FALSE,
  gold NUMERIC,
  resources JSONB,
  items JSONB,
  vip_points INTEGER,
  special_offers JSONB,
  handling_time_metrics JSONB,
  reviewed_by TEXT,
  review_notes TEXT,
  actual_compensation JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);
`;

// SQL functions for convenience

export const GET_ACTIVE_COMPENSATION_REQUESTS = `
SELECT 
  cr.id,
  cr.player_id,
  cr.tier,
  cr.status,
  cr.requires_human_review,
  cr.created_at,
  cr.updated_at,
  di.issue_type,
  di.description as issue_description,
  di.player_impact,
  ss.game_level,
  ss.vip_level,
  ss.is_spender
FROM 
  compensation_requests cr
JOIN 
  detected_issues di ON cr.issue_id = di.id
JOIN 
  support_sessions ss ON cr.session_id = ss.id
WHERE 
  cr.status IN ('pending', 'under_review')
ORDER BY 
  cr.created_at DESC;
`;

export const GET_COMPENSATION_HISTORY = `
SELECT 
  cr.id,
  cr.player_id,
  cr.tier,
  cr.status,
  cr.requires_human_review,
  cr.created_at,
  cr.updated_at,
  cr.resolved_at,
  cr.reviewed_by,
  cr.review_notes,
  cr.actual_compensation,
  di.issue_type,
  di.description as issue_description,
  di.player_impact,
  ss.game_level,
  ss.vip_level,
  ss.is_spender
FROM 
  compensation_requests cr
JOIN 
  detected_issues di ON cr.issue_id = di.id
JOIN 
  support_sessions ss ON cr.session_id = ss.id
WHERE 
  cr.status IN ('approved', 'denied', 'delivered')
ORDER BY 
  cr.updated_at DESC;
`;

export const GET_PLAYER_COMPENSATION_REQUESTS = `
SELECT 
  cr.id,
  cr.status,
  cr.tier,
  cr.created_at,
  cr.updated_at,
  cr.resolved_at,
  cr.reviewed_by,
  cr.gold,
  cr.resources,
  cr.items,
  cr.vip_points,
  cr.special_offers,
  cr.actual_compensation,
  di.issue_type,
  di.description as issue_description
FROM 
  compensation_requests cr
JOIN 
  detected_issues di ON cr.issue_id = di.id
WHERE 
  cr.player_id = $1
ORDER BY 
  cr.created_at DESC;
`;

// Statistics queries

export const GET_COMPENSATION_STATS = `
SELECT
  (SELECT COUNT(*) FROM compensation_requests WHERE status IN ('pending', 'under_review')) as pending_requests,
  (SELECT COUNT(*) FROM compensation_requests WHERE status IN ('approved', 'denied', 'delivered')) as completed_requests,
  (SELECT 
    EXTRACT(EPOCH FROM AVG(resolved_at - created_at)) / 3600
   FROM compensation_requests 
   WHERE resolved_at IS NOT NULL) as avg_response_time_hours,
  (SELECT 
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'denied') * 100.0) / 
      NULLIF(COUNT(*) FILTER (WHERE status IN ('approved', 'denied')), 0)
    )
   FROM compensation_requests) as rejection_rate_percent
`;

export const GET_ISSUE_TYPE_STATS = `
SELECT
  issue_type,
  COUNT(*) as count
FROM
  detected_issues
GROUP BY
  issue_type
ORDER BY
  count DESC;
`;

export const GET_COMPENSATION_TIER_STATS = `
SELECT
  tier,
  COUNT(*) as count
FROM
  compensation_requests
GROUP BY
  tier
ORDER BY
  CASE 
    WHEN tier = 'P0' THEN 0
    WHEN tier = 'P1' THEN 1
    WHEN tier = 'P2' THEN 2
    WHEN tier = 'P3' THEN 3
    WHEN tier = 'P4' THEN 4
    WHEN tier = 'P5' THEN 5
  END;
`;

export const GET_HANDLING_TIME_STATS = `
SELECT
  AVG((handling_time_metrics->>'estimatedMinutes')::numeric) AS average_handling_minutes,
  SUM((handling_time_metrics->>'estimatedMinutes')::numeric) / 60.0 AS total_estimated_hours,
  AVG((handling_time_metrics->>'complexityScore')::numeric) AS average_complexity,
  AVG((handling_time_metrics->>'resolutionSteps')::numeric) AS average_steps,
  AVG((handling_time_metrics->>'automationPotential')::numeric) AS automation_score,
  
  -- Human vs Bot metrics
  AVG(CASE 
    WHEN requires_human_review = true THEN 
      CASE 
        WHEN (handling_time_metrics->>'humanEstimatedMinutes')::numeric > 0 
        THEN (handling_time_metrics->>'humanEstimatedMinutes')::numeric
        ELSE (handling_time_metrics->>'estimatedMinutes')::numeric * 1.7
      END
    ELSE NULL 
  END) AS human_resolution_minutes,
  AVG(CASE WHEN requires_human_review = false THEN (handling_time_metrics->>'estimatedMinutes')::numeric ELSE NULL END) AS bot_resolution_minutes,
  COUNT(CASE WHEN requires_human_review = true THEN 1 ELSE NULL END) AS human_resolution_count,
  COUNT(CASE WHEN requires_human_review = false THEN 1 ELSE NULL END) AS automated_resolution_count,
  
  -- Calculate time saved percentage and total hours saved
  CASE
    WHEN AVG(CASE 
      WHEN requires_human_review = true THEN 
        CASE 
          WHEN (handling_time_metrics->>'humanEstimatedMinutes')::numeric > 0 
          THEN (handling_time_metrics->>'humanEstimatedMinutes')::numeric
          ELSE (handling_time_metrics->>'estimatedMinutes')::numeric * 1.7
        END
      ELSE NULL 
    END) > 0 
    THEN ROUND(
      (1 - (AVG(CASE WHEN requires_human_review = false THEN (handling_time_metrics->>'estimatedMinutes')::numeric ELSE NULL END) / 
       AVG(CASE 
        WHEN requires_human_review = true THEN 
          CASE 
            WHEN (handling_time_metrics->>'humanEstimatedMinutes')::numeric > 0 
            THEN (handling_time_metrics->>'humanEstimatedMinutes')::numeric
            ELSE (handling_time_metrics->>'estimatedMinutes')::numeric * 1.7
          END
        ELSE NULL 
      END))) * 100
    )
    ELSE 0
  END AS time_saved_percentage,
  
  -- Total time saved in hours (if all bot-resolved issues had been handled by humans)
  ROUND(
    (COUNT(CASE WHEN requires_human_review = false THEN 1 ELSE NULL END) * 
     (AVG(CASE 
        WHEN requires_human_review = true THEN 
          CASE 
            WHEN (handling_time_metrics->>'humanEstimatedMinutes')::numeric > 0 
            THEN (handling_time_metrics->>'humanEstimatedMinutes')::numeric
            ELSE (handling_time_metrics->>'estimatedMinutes')::numeric * 1.7
          END
        ELSE NULL 
      END) - 
      AVG(CASE WHEN requires_human_review = false THEN (handling_time_metrics->>'estimatedMinutes')::numeric ELSE NULL END)) / 60.0
    ) * 10
  ) / 10 AS total_time_saved_hours
FROM
  compensation_requests
WHERE
  handling_time_metrics IS NOT NULL;
`;

// SQL function to create get_handling_time_stats

export const GET_HANDLING_TIME_STATS_FUNCTION = `
CREATE OR REPLACE FUNCTION get_handling_time_stats()
RETURNS TABLE (
  average_handling_minutes numeric,
  total_estimated_hours numeric,
  average_complexity numeric,
  average_steps numeric,
  automation_score numeric,
  human_resolution_minutes numeric,
  bot_resolution_minutes numeric,
  human_resolution_count bigint,
  automated_resolution_count bigint,
  time_saved_percentage numeric,
  total_time_saved_hours numeric
) 
LANGUAGE SQL
AS $$
SELECT
  AVG((handling_time_metrics->>'estimatedMinutes')::numeric) AS average_handling_minutes,
  SUM((handling_time_metrics->>'estimatedMinutes')::numeric) / 60.0 AS total_estimated_hours,
  AVG((handling_time_metrics->>'complexityScore')::numeric) AS average_complexity,
  AVG((handling_time_metrics->>'resolutionSteps')::numeric) AS average_steps,
  AVG((handling_time_metrics->>'automationPotential')::numeric) AS automation_score,
  
  -- Human vs Bot metrics
  AVG(CASE 
    WHEN requires_human_review = true THEN 
      CASE 
        WHEN (handling_time_metrics->>'humanEstimatedMinutes')::numeric > 0 
        THEN (handling_time_metrics->>'humanEstimatedMinutes')::numeric
        ELSE (handling_time_metrics->>'estimatedMinutes')::numeric * 1.7
      END
    ELSE NULL 
  END) AS human_resolution_minutes,
  AVG(CASE WHEN requires_human_review = false THEN (handling_time_metrics->>'estimatedMinutes')::numeric ELSE NULL END) AS bot_resolution_minutes,
  COUNT(CASE WHEN requires_human_review = true THEN 1 ELSE NULL END) AS human_resolution_count,
  COUNT(CASE WHEN requires_human_review = false THEN 1 ELSE NULL END) AS automated_resolution_count,
  
  -- Calculate time saved percentage
  CASE
    WHEN AVG(CASE 
      WHEN requires_human_review = true THEN 
        CASE 
          WHEN (handling_time_metrics->>'humanEstimatedMinutes')::numeric > 0 
          THEN (handling_time_metrics->>'humanEstimatedMinutes')::numeric
          ELSE (handling_time_metrics->>'estimatedMinutes')::numeric * 1.7
        END
      ELSE NULL 
    END) > 0 
    THEN ROUND(
      (1 - (AVG(CASE WHEN requires_human_review = false THEN (handling_time_metrics->>'estimatedMinutes')::numeric ELSE NULL END) / 
       AVG(CASE 
        WHEN requires_human_review = true THEN 
          CASE 
            WHEN (handling_time_metrics->>'humanEstimatedMinutes')::numeric > 0 
            THEN (handling_time_metrics->>'humanEstimatedMinutes')::numeric
            ELSE (handling_time_metrics->>'estimatedMinutes')::numeric * 1.7
          END
        ELSE NULL 
      END))) * 100
    )
    ELSE 0
  END AS time_saved_percentage,
  
  -- Total time saved in hours
  ROUND(
    (COUNT(CASE WHEN requires_human_review = false THEN 1 ELSE NULL END) * 
     (AVG(CASE 
        WHEN requires_human_review = true THEN 
          CASE 
            WHEN (handling_time_metrics->>'humanEstimatedMinutes')::numeric > 0 
            THEN (handling_time_metrics->>'humanEstimatedMinutes')::numeric
            ELSE (handling_time_metrics->>'estimatedMinutes')::numeric * 1.7
          END
        ELSE NULL 
      END) - 
      AVG(CASE WHEN requires_human_review = false THEN (handling_time_metrics->>'estimatedMinutes')::numeric ELSE NULL END)) / 60.0
    ) * 10
  ) / 10 AS total_time_saved_hours
FROM
  compensation_requests
WHERE
  handling_time_metrics IS NOT NULL;
$$;
`; 