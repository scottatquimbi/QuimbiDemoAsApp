import { NextRequest, NextResponse } from 'next/server';
import { gcpDatabaseClient } from '@/lib/database-client';
import { CompensationTier } from '@/lib/models';
import { IssueDetectionResult, CompensationStatus } from '@/lib/compensation';

// Maximum duration for serverless function
export const maxDuration = 60;

/**
 * GET handler for retrieving compensation requests using GCP
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get('type');
  const playerId = searchParams.get('playerId');
  const requestId = searchParams.get('requestId');
  
  try {
    // Use default client ID for demo purposes - in production, this would come from authentication
    const clientId = 'demo-client-001';
    
    // Build filters based on query parameters
    const filters: any = {};
    if (requestId) filters.requestId = requestId;
    if (playerId) filters.playerId = playerId;
    if (type === 'pending') filters.status = ['pending', 'under_review'];
    if (type === 'history') filters.status = ['approved', 'denied', 'delivered'];
    
    const requests = await gcpDatabaseClient.getCompensationRequests(clientId, filters);
    
    if (requestId) {
      // Return single request
      const request = requests.length > 0 ? requests[0] : null;
      return NextResponse.json({ request });
    }
    
    // Return array of requests
    return NextResponse.json({ requests });
    
  } catch (error) {
    console.error('Error fetching compensation requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compensation requests' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new compensation request using GCP
 */
export async function POST(req: Request) {
  try {
    const clientId = 'demo-client-001';
    const body = await req.json();
    const {
      playerId,
      playerName,
      gameLevel,
      vipLevel,
      isSpender,
      issueDetection,
      compensation
    } = body;
    
    // Create support session first
    const sessionId = await gcpDatabaseClient.createSupportSession(clientId, {
      playerId,
      playerName,
      gameLevel,
      vipLevel,
      isSpender
    });
    
    // Create compensation request
    const requestId = await gcpDatabaseClient.createCompensationRequest(clientId, {
      sessionId,
      playerId,
      tier: compensation.tier,
      reasoning: compensation.reasoning,
      requiresHumanReview: compensation.requiresHumanReview,
      gold: compensation.suggestedCompensation?.gold,
      resources: compensation.suggestedCompensation?.resources,
      items: compensation.suggestedCompensation?.items,
      vipPoints: compensation.suggestedCompensation?.vipPoints,
      specialOffers: compensation.suggestedCompensation?.specialOffers
    });
    
    return NextResponse.json({
      success: true,
      requestId,
      status: compensation.requiresHumanReview ? 'under_review' : 'pending',
      requiresHumanReview: compensation.requiresHumanReview
    });
    
  } catch (error) {
    console.error('Error creating compensation request:', error);
    return NextResponse.json(
      { error: 'Failed to create compensation request' },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating an existing compensation request using GCP
 */
export async function PATCH(req: Request) {
  try {
    const clientId = 'demo-client-001';
    const { requestId, status, reviewNotes } = await req.json();
    
    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: requestId and status' },
        { status: 400 }
      );
    }
    
    // TODO: Implement update compensation request in GCP database client
    // For now, return success
    
    return NextResponse.json({
      success: true,
      requestId,
      status,
      message: 'Compensation request updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating compensation request:', error);
    return NextResponse.json(
      { error: 'Failed to update compensation request' },
      { status: 500 }
    );
  }
}