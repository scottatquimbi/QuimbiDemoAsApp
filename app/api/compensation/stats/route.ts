import { NextResponse } from 'next/server';
import { gcpDatabaseClient } from '@/lib/database-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Return mock stats for demo purposes
    // In production, these would come from GCP BigQuery/Spanner
    
    const result = {
      stats: {
        pending_requests: 12,
        completed_requests: 87,
        avg_response_time_minutes: 15.3,
        rejection_rate_percent: 8
      },
      issueTypes: {
        'tech_crash': 23,
        'miss_reward': 18,
        'conn_issue': 15,
        'acct_lock': 12,
        'purch_fail': 8,
        'ui_bug': 11
      },
      compensationByTier: {
        P0: 2, P1: 5, P2: 15, P3: 35, P4: 25, P5: 5
      },
      // New star schema metrics
      handlingTime: {
        // Star schema metrics
        totalInteractions: 87,
        avgResolutionMins: 12.5,
        automatedResolutionRate: 64.2,
        totalCompensationUsd: 1247.50,
        avgSatisfaction: 4.2,
        resolutionRate: 92.0,
        escalationRate: 8.0,
        
        // Legacy compatibility metrics
        averageHandlingMinutes: 12,
        totalEstimatedHours: 24.5,
        averageComplexity: 3.2,
        averageSteps: 4,
        automationScore: 7.8,
        humanResolutionMinutes: 18,
        botResolutionMinutes: 8,
        humanResolutionCount: 35,
        automatedResolutionCount: 52,
        timeSavedPercentage: 56,
        totalTimeSavedHours: 8.7
      }
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching compensation stats:', error);
    // Return a safe error response with empty data
    return NextResponse.json({ 
      error: 'Failed to fetch compensation stats',
      stats: {
        pending_requests: 0,
        completed_requests: 0,
        avg_response_time_minutes: 0,
        rejection_rate_percent: 0
      },
      issueTypes: {},
      compensationByTier: {
        P0: 0, P1: 0, P2: 0, P3: 0, P4: 0, P5: 0
      },
      handlingTime: {
        // Star schema metrics
        totalInteractions: 0,
        avgResolutionMins: 0,
        automatedResolutionRate: 0,
        totalCompensationUsd: 0,
        avgSatisfaction: 0,
        resolutionRate: 0,
        escalationRate: 0,
        
        // Legacy compatibility metrics
        averageHandlingMinutes: 0,
        totalEstimatedHours: 0,
        averageComplexity: 0,
        averageSteps: 0,
        automationScore: 0,
        humanResolutionMinutes: 0,
        botResolutionMinutes: 0,
        humanResolutionCount: 0,
        automatedResolutionCount: 0,
        timeSavedPercentage: 0,
        totalTimeSavedHours: 0
      }
    }, { status: 200 }); // Return 200 with empty data instead of 500
  }
} 