import { NextRequest, NextResponse } from 'next/server';
import { analyzePlayerMessage } from '@/lib/compensation-local';

export async function POST(request: NextRequest) {
  try {
    const { message, playerContext } = await request.json();
    
    console.log('🔍 API CALLED - analyze-player-message');
    console.log('🔍 MESSAGE:', message);
    console.log('🔍 PLAYER CONTEXT:', playerContext);
    
    if (!message || !message.trim()) {
      console.log('🔍 ERROR: Message is required');
      return NextResponse.json({
        error: 'Message is required'
      }, { status: 400 });
    }

    if (!playerContext) {
      console.log('🔍 ERROR: Player context is required');
      return NextResponse.json({
        error: 'Player context is required'
      }, { status: 400 });
    }

    console.log('🔍 Analyzing player message for escalation:', message.substring(0, 100) + '...');
    
    // Run the full analysis using the compensation-local module
    console.log('🔍 CALLING analyzePlayerMessage...');
    const analysisResult = await analyzePlayerMessage(message, playerContext);
    console.log('🔍 ANALYSIS RESULT RECEIVED:', analysisResult);
    
    console.log('🔍 Analysis completed:', {
      issueDetected: analysisResult.issueDetected,
      issueType: analysisResult.issue?.issueType,
      sentiment: analysisResult.sentiment?.tone,
      compensationTier: analysisResult.compensation?.tier
    });

    const responsePayload = {
      success: true,
      ...analysisResult,
      // Debug info to see in browser console
      __debug: {
        messageLength: message.length,
        hasPlayerContext: !!playerContext,
        issueDetectedResult: analysisResult.issueDetected,
        rawAnalysisKeys: Object.keys(analysisResult)
      }
    };
    
    console.log('🔍 RETURNING RESPONSE:', responsePayload);
    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('🚨 Player message analysis error:', error);
    
    return NextResponse.json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}