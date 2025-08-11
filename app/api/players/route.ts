import { NextRequest, NextResponse } from 'next/server';

// Mock player data for demo mode - enhanced with new schema fields
const mockPlayers = {
  'lannister-gold': {
    player_id: 'lannister-gold',
    player_name: 'LannisterGold',
    game_level: 27,
    vip_level: 12,
    is_spender: true,
    total_spend: 2187.00,
    session_days: 89,
    kingdom_id: 421,
    alliance_name: 'House Lannister',
    
    // Account Status Fields
    account_status: 'locked',
    lock_reason: 'automated_security',
    suspension_expires: null,
    verification_pending: false,
    
    // Crash/Technical Telemetry Fields
    recent_crashes: 0,
    crash_frequency: 'none',
    last_crash_at: null,
    device_type: 'ios',
    app_version: '2.1.4',
    os_version: '16.4.1',
    connection_quality: 'excellent',
    
    // Behavioral Flags
    support_tier: 'vip',
    churn_risk: 'low',
    sentiment_history: 'positive',
    previous_issues: 2,
    
    last_login: new Date().toISOString(),
    account_created: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000).toISOString()
  },
  'player1': {
    player_id: 'player1',
    player_name: 'TestPlayer1',
    game_level: 15,
    vip_level: 3,
    is_spender: true,
    total_spend: 120.50,
    session_days: 25,
    kingdom_id: 101,
    alliance_name: 'Northern Alliance',
    
    // Account Status Fields
    account_status: 'active',
    lock_reason: null,
    suspension_expires: null,
    verification_pending: false,
    
    // Crash/Technical Telemetry Fields
    recent_crashes: 2,
    crash_frequency: 'low',
    last_crash_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    device_type: 'android',
    app_version: '2.1.3',
    os_version: '13.0',
    connection_quality: 'good',
    
    // Behavioral Flags
    support_tier: 'priority',
    churn_risk: 'medium',
    sentiment_history: 'neutral',
    previous_issues: 1,
    
    last_login: new Date().toISOString(),
    account_created: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    console.log('🎮 Fetching player profile (demo mode):', playerId);

    const player = mockPlayers[playerId as keyof typeof mockPlayers];

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    console.log('👑 Player profile found:', player.player_name);
    return NextResponse.json(player);
  } catch (error) {
    console.error('Error in players API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}