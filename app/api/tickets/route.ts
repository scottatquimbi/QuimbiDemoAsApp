import { NextRequest, NextResponse } from 'next/server';

// Mock ticket data for demo mode - providing AI context for repeat interactions
const mockTickets = {
  'lannister-gold': [
    {
      ticket_id: 'TK-20241201-001',
      player_id: 'lannister-gold',
      session_id: 1,
      title: 'Account recovery after device change',
      description: 'VIP player lost access after getting new phone, urgent help needed for kingdom event',
      category: 'account',
      priority: 'high',
      status: 'resolved',
      resolution_summary: 'Successfully verified identity via email and recent purchase. Account unlocked and linked to new device.',
      compensation_awarded: {
        gold: 5000,
        gems: 500,
        speedups: 3
      },
      chat_summary: 'Player urgently needed account recovery for upcoming Seat of Power battle. Provided email and purchase details for verification. Quick resolution with VIP compensation.',
      key_issues: ['account_recovery', 'device_change', 'identity_verification'],
      player_sentiment: 'initially_stressed_then_satisfied',
      outcome_rating: 'successful',
      resolution_time_minutes: 15,
      tags: ['vip', 'urgent', 'account_recovery', 'compensation_awarded'],
      created_at: '2024-12-01T14:30:00Z',
      resolved_at: '2024-12-01T14:45:00Z'
    },
    {
      ticket_id: 'TK-20241128-001',
      player_id: 'lannister-gold',
      session_id: 2,
      title: 'Missing alliance war rewards',
      description: 'Did not receive rewards after alliance victory in major war event',
      category: 'gameplay',
      priority: 'medium',
      status: 'resolved',
      resolution_summary: 'Confirmed rewards were delivered but player missed notification. Provided additional courtesy compensation.',
      compensation_awarded: {
        gold: 1000,
        resources: {
          wood: 500,
          stone: 500
        }
      },
      chat_summary: 'Player concerned about missing alliance war rewards. System showed rewards were delivered but player missed them. Provided extra compensation for inconvenience.',
      key_issues: ['alliance_rewards', 'missed_notification', 'war_event'],
      player_sentiment: 'confused_then_grateful',
      outcome_rating: 'successful',
      resolution_time_minutes: 20,
      tags: ['alliance', 'rewards', 'courtesy_compensation'],
      created_at: '2024-11-28T16:20:00Z',
      resolved_at: '2024-11-28T16:40:00Z'
    }
  ],
  'player1': [
    {
      ticket_id: 'TK-20241125-001',
      player_id: 'player1',
      session_id: 3,
      title: 'Game crashes during tutorial',
      description: 'New player unable to complete tutorial due to crashes on keep upgrade',
      category: 'technical',
      priority: 'high',
      status: 'resolved',
      resolution_summary: 'Known bug affecting 3% of new players. Provided workaround and compensation while fix is deployed.',
      compensation_awarded: {
        gold: 200,
        speedup: 1
      },
      chat_summary: 'New player experiencing tutorial crashes. Confirmed as known issue with keep upgrade animation. Provided temporary workaround.',
      key_issues: ['tutorial_crash', 'keep_upgrade', 'known_bug'],
      player_sentiment: 'frustrated_then_understanding',
      outcome_rating: 'successful',
      resolution_time_minutes: 25,
      tags: ['new_player', 'technical', 'known_issue'],
      created_at: '2024-11-25T10:15:00Z',
      resolved_at: '2024-11-25T10:40:00Z'
    }
  ]
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    console.log('🎫 Fetching ticket history (demo mode):', playerId);

    const tickets = mockTickets[playerId as keyof typeof mockTickets] || [];

    console.log(`📋 Found ${tickets.length} historical tickets for context`);
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error in tickets API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ticketData = await request.json();
    
    console.log('🎫 Creating new ticket (demo mode):', ticketData.title);
    
    // Generate ticket ID
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const ticketId = `TK-${dateStr}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    const newTicket = {
      ticket_id: ticketId,
      ...ticketData,
      created_at: now.toISOString(),
      resolved_at: now.toISOString()
    };
    
    // In demo mode, just log the creation
    console.log('✅ Ticket created:', newTicket.ticket_id);
    console.log('📝 Ticket summary for future AI context:', ticketData.chat_summary);
    
    return NextResponse.json({ 
      success: true, 
      ticket_id: ticketId,
      message: 'Ticket created successfully' 
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}