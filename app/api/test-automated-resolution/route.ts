import { NextRequest, NextResponse } from 'next/server';
import { AutomatedResolutionEngine } from '@/lib/automated-resolution';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing automated resolution engine...');
    
    // Test data
    const testFormData = {
      identityConfirmed: true,
      problemCategory: 'account_access',
      problemDescription: 'I can\'t log into my account after changing my password',
      urgencyLevel: 'high',
      affectedFeatures: []
    };
    
    const testPlayerProfile = {
      player_id: 'lannister-gold',
      player_name: 'LannisterGold',
      game_level: 27,
      vip_level: 12,
      is_spender: true,
      total_spend: 2187.00,
      session_days: 89,
      kingdom_id: 421,
      alliance_name: 'House Lannister'
    };
    
    console.log('📝 Test form data:', testFormData);
    console.log('👤 Test player profile:', testPlayerProfile);
    
    // Test automated resolution
    const resolution = await AutomatedResolutionEngine.resolveIssue(testFormData, testPlayerProfile);
    
    console.log('✅ Resolution result:', resolution);
    
    return NextResponse.json({
      success: true,
      testData: {
        formData: testFormData,
        playerProfile: testPlayerProfile
      },
      resolution: resolution
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}