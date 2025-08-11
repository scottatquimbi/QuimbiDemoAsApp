import { NextRequest, NextResponse } from 'next/server';
import { analyzePlayerMessage } from '@/lib/compensation-local';

export async function POST(request: NextRequest) {
  try {
    const { message, playerContext } = await request.json();
    
    if (!message || !message.trim()) {
      return NextResponse.json({
        error: 'Message is required'
      }, { status: 400 });
    }

    if (!playerContext) {
      return NextResponse.json({
        error: 'Player context is required'
      }, { status: 400 });
    }

    console.log('🔍 Analyzing player message for escalation:', message.substring(0, 100) + '...');
    
    // Run the full analysis using the compensation-local module
    const analysisResult = await analyzePlayerMessage(message, playerContext);
    
    console.log('🔍 Analysis completed:', {
      issueDetected: analysisResult.issueDetected,
      issueType: analysisResult.issue?.issueType,
      sentiment: analysisResult.sentiment?.tone,
      compensationTier: analysisResult.compensation?.tier
    });

    return NextResponse.json({
      success: true,
      ...analysisResult
    });

  } catch (error) {
    console.error('🚨 Player message analysis error:', error);
    
    return NextResponse.json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}