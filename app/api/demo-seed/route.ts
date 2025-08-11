import { NextResponse } from 'next/server';
import { gcpDatabaseClient } from '@/lib/database-client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scenarioType } = body;
    
    // Use default client ID for demo
    const clientId = 'demo-client-001';
    let playerId = body.playerId || `player-${Math.floor(Math.random() * 1000000)}`;
    let sessionId;
    
    // Create sample data based on scenario type using GCP
    switch (scenarioType) {
      case 'new-player':
        sessionId = await seedNewPlayerScenario(clientId, playerId);
        break;
      case 'mid-tier':
        sessionId = await seedMidTierScenario(clientId, playerId);
        break;
      case 'high-spender':
        sessionId = await seedHighSpenderScenario(clientId, playerId);
        break;
      default:
        throw new Error('Invalid scenario type');
    }
    
    return NextResponse.json({ 
      success: true, 
      sessionId,
      playerId,
      scenarioType,
      message: `Demo ${scenarioType} scenario seeded successfully`
    });
    
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return NextResponse.json({ 
      error: 'Failed to seed demo data' 
    }, { status: 500 });
  }
}

// New player scenario (Level 1-5) with a technical issue
async function seedNewPlayerScenario(clientId: string, playerId: string) {
  try {
    // For now, simulate session creation without actual database calls
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`Created mock session for new player: ${playerId}`);
    console.log('Session data:', {
      sessionId,
      playerId,
      playerName: 'JonSnow123',
      gameLevel: 3,
      vipLevel: 0,
      isSpender: false
    });
    
    // TODO: Uncomment when Spanner tables are created
    // const sessionId = await gcpDatabaseClient.createSupportSession(clientId, {
    //   playerId,
    //   playerName: 'JonSnow123',
    //   gameLevel: 3,
    //   vipLevel: 0,
    //   isSpender: false
    // });
    
    return sessionId;
  } catch (error) {
    console.error('Error seeding new player scenario:', error);
    throw error;
  }
}

// Mid-tier player scenario (Level 10-20) with a compensation issue
async function seedMidTierScenario(clientId: string, playerId: string) {
  try {
    // For now, simulate session creation without actual database calls
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`Created mock session for mid-tier player: ${playerId}`);
    console.log('Session data:', {
      sessionId,
      playerId,
      playerName: 'AryaStark99',
      gameLevel: 15,
      vipLevel: 2,
      isSpender: true
    });
    
    return sessionId;
  } catch (error) {
    console.error('Error seeding mid-tier scenario:', error);
    throw error;
  }
}

// High-spender scenario (Level 25+) with a purchase issue
async function seedHighSpenderScenario(clientId: string, playerId: string) {
  try {
    // For now, simulate session creation without actual database calls
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`Created mock session for high-spender player: ${playerId}`);
    console.log('Session data:', {
      sessionId,
      playerId,
      playerName: 'DaenerysT',
      gameLevel: 28,
      vipLevel: 8,
      isSpender: true
    });
    
    return sessionId;
  } catch (error) {
    console.error('Error seeding high-spender scenario:', error);
    throw error;
  }
}