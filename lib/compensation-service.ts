// Minimal compensation service stub for CompensationPanel compatibility

export interface CompensationRequest {
  id: string;
  playerId: string;
  player_id: string; // DB compatibility 
  issueType: string;
  tier: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  created_at: string; // DB compatibility
  updated_at: string;
  requires_human_review: boolean;
  resolved_at?: string;
  reviewed_by?: string;
  review_notes?: string;
}

// Stub functions - using local compensation system instead
export async function submitCompensationRequest(data: any): Promise<string> {
  console.log('💰 Compensation request submitted (demo mode):', data);
  return `comp_${Date.now()}`;
}

export async function updateCompensationStatus(requestId: string, status: string): Promise<void> {
  console.log('📝 Compensation status updated (demo mode):', { requestId, status });
}

export async function getCompensationStats() {
  return {
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    stats: {
      completed_requests: 0,
      avg_response_time_minutes: 0,
      pending_requests: 0,
      rejection_rate_percent: 0
    },
    issueTypes: {
      technical: 0,
      account: 0,
      gameplay: 0,
      payment: 0,
      other: 0
    },
    compensationByTier: {
      P0: 0, P1: 0, P2: 0, P3: 0, P4: 0, P5: 0
    },
    handlingTime: {
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
  };
}

// CompensationService class for compatibility
export class CompensationService {
  static async getRequests(filters?: any): Promise<CompensationRequest[]> {
    console.log('💰 Get compensation requests (demo mode):', filters);
    return [];
  }

  static async updateRequest(requestId: string, status: string): Promise<void> {
    console.log('📝 Update compensation request (demo mode):', { requestId, status });
  }

  static async getStats() {
    return getCompensationStats();
  }

  static async getCompensationHistory(): Promise<CompensationRequest[]> {
    console.log('📊 Get compensation history (demo mode)');
    return [];
  }

  static async getCompensationRequest(requestId: string): Promise<CompensationRequest | null> {
    console.log('📋 Get compensation request (demo mode):', requestId);
    return null;
  }

  static async submitCompensationRequest(...args: any[]): Promise<{ requestId: string; status: string }> {
    console.log('📤 Submit compensation request (demo mode):', args);
    return { requestId: `demo_${Date.now()}`, status: 'pending' };
  }

  static async updateCompensationRequestStatus(requestId: string, status: string, reviewedBy?: string, reviewNotes?: string): Promise<void> {
    console.log('📝 Update compensation request status (demo mode):', { requestId, status, reviewedBy, reviewNotes });
  }
}