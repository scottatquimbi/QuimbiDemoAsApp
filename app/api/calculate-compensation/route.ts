import { NextRequest, NextResponse } from 'next/server';
import { 
  CompensationCalculationParams, 
  CompensationCalculationResponse,
  CalculatedCompensation,
  PlayerTier,
  ImpactLevel 
} from '@/app/types/schema';

export const dynamic = 'force-dynamic';

/**
 * Calculate compensation using the rewards lookup table
 * This would connect to the database calculate_compensation function in production
 */
async function calculateCompensationFromLookup(
  params: CompensationCalculationParams
): Promise<CalculatedCompensation> {
  // Mock implementation that simulates the database function logic
  // In production, this would call the PostgreSQL calculate_compensation function
  
  // Classify player tier based on spend
  let playerTier: PlayerTier;
  if (params.total_spend === 0) {
    playerTier = 'f2p';
  } else if (params.total_spend < 50) {
    playerTier = 'light_spender';
  } else if (params.total_spend < 500) {
    playerTier = 'medium_spender';
  } else if (params.total_spend < 2000) {
    playerTier = 'whale';
  } else {
    playerTier = 'vip_whale';
  }
  
  // Base compensation rules (simplified version of database lookup)
  const baseCompensationRules: Record<string, Record<string, any>> = {
    // F2P compensation
    'f2p_low': { gold: 100, gems: 0, resources: { energy: 10 }, items: [], vip_points: 0, multiplier: 1.0, approval: false },
    'f2p_medium': { gold: 400, gems: 0, resources: { energy: 35, wood: 100 }, items: [{ item: 'speed_up', quantity: 2 }], vip_points: 0, multiplier: 1.0, approval: false },
    'f2p_high': { gold: 1000, gems: 0, resources: { energy: 100, wood: 500, stone: 300 }, items: [{ item: 'speed_up', quantity: 5 }, { item: 'shield', quantity: 1 }], vip_points: 0, multiplier: 1.0, approval: true },
    
    // Light spender compensation
    'light_spender_low': { gold: 300, gems: 10, resources: { energy: 20, wood: 100 }, items: [], vip_points: 5, multiplier: 1.1, approval: false },
    'light_spender_medium': { gold: 500, gems: 25, resources: { energy: 40, wood: 200, stone: 100 }, items: [{ item: 'speed_up', quantity: 3 }], vip_points: 10, multiplier: 1.2, approval: false },
    'light_spender_high': { gold: 800, gems: 50, resources: { energy: 75, wood: 400, stone: 200 }, items: [{ item: 'speed_up', quantity: 5 }, { item: 'shield', quantity: 2 }], vip_points: 20, multiplier: 1.3, approval: false },
    
    // Medium spender compensation
    'medium_spender_low': { gold: 500, gems: 25, resources: { energy: 30, wood: 150, stone: 100 }, items: [{ item: 'speed_up', quantity: 2 }], vip_points: 15, multiplier: 1.2, approval: false },
    'medium_spender_medium': { gold: 1000, gems: 75, resources: { energy: 60, wood: 300, stone: 200, iron: 100 }, items: [{ item: 'speed_up', quantity: 5 }, { item: 'shield', quantity: 2 }], vip_points: 30, multiplier: 1.4, approval: false },
    'medium_spender_high': { gold: 1500, gems: 150, resources: { energy: 100, wood: 500, stone: 300, iron: 200 }, items: [{ item: 'speed_up', quantity: 8 }, { item: 'shield', quantity: 3 }, { item: 'premium_chest', quantity: 1 }], vip_points: 50, multiplier: 1.5, approval: true },
    
    // Whale compensation
    'whale_low': { gold: 1000, gems: 100, resources: { energy: 50, wood: 250, stone: 150, iron: 100 }, items: [{ item: 'speed_up', quantity: 5 }, { item: 'shield', quantity: 2 }], vip_points: 50, multiplier: 1.5, approval: false },
    'whale_medium': { gold: 2000, gems: 250, resources: { energy: 100, wood: 500, stone: 300, iron: 200, gems: 25 }, items: [{ item: 'speed_up', quantity: 10 }, { item: 'shield', quantity: 5 }, { item: 'premium_chest', quantity: 2 }], vip_points: 100, multiplier: 1.7, approval: false },
    'whale_high': { gold: 3500, gems: 500, resources: { energy: 200, wood: 1000, stone: 600, iron: 400, gems: 100 }, items: [{ item: 'speed_up', quantity: 20 }, { item: 'shield', quantity: 10 }, { item: 'premium_chest', quantity: 5 }], vip_points: 200, multiplier: 2.0, approval: true },
    
    // VIP Whale compensation
    'vip_whale_low': { gold: 2000, gems: 200, resources: { energy: 75, wood: 400, stone: 250, iron: 150, gems: 50 }, items: [{ item: 'speed_up', quantity: 10 }, { item: 'shield', quantity: 5 }, { item: 'premium_chest', quantity: 2 }], vip_points: 100, multiplier: 2.0, approval: false },
    'vip_whale_medium': { gold: 4000, gems: 500, resources: { energy: 150, wood: 800, stone: 500, iron: 300, gems: 150 }, items: [{ item: 'speed_up', quantity: 20 }, { item: 'shield', quantity: 10 }, { item: 'premium_chest', quantity: 5 }, { item: 'exclusive_bundle', quantity: 1 }], vip_points: 250, multiplier: 2.5, approval: true },
    'vip_whale_high': { gold: 7500, gems: 1000, resources: { energy: 300, wood: 1500, stone: 1000, iron: 600, gems: 300 }, items: [{ item: 'speed_up', quantity: 50 }, { item: 'shield', quantity: 25 }, { item: 'premium_chest', quantity: 15 }, { item: 'exclusive_bundle', quantity: 3 }], vip_points: 500, multiplier: 3.0, approval: true }
  };
  
  // Find the appropriate rule
  const ruleKey = `${playerTier}_${params.impact_level}`;
  const rule = baseCompensationRules[ruleKey];
  
  if (!rule) {
    // Fallback to basic F2P rule
    const fallbackRule = baseCompensationRules['f2p_low'];
    return {
      gold: fallbackRule.gold,
      gems: fallbackRule.gems,
      resources: fallbackRule.resources,
      items: fallbackRule.items,
      vip_points: fallbackRule.vip_points,
      special_offers: {},
      rule_id: 0,
      player_tier: playerTier,
      multiplier_applied: 1.0,
      requires_approval: false,
      error: 'No matching rule found, using fallback'
    };
  }
  
  // Apply churn risk multiplier
  let churnMultiplier = 1.0;
  if (params.churn_risk === 'medium') churnMultiplier = 1.25;
  if (params.churn_risk === 'high') churnMultiplier = 1.5;
  
  // Apply weekend bonus if specified
  let weekendMultiplier = params.is_weekend ? 1.1 : 1.0;
  
  // Calculate total multiplier
  const totalMultiplier = rule.multiplier * churnMultiplier * weekendMultiplier;
  
  // Apply multipliers to gold and gems
  const finalGold = Math.round(rule.gold * totalMultiplier);
  const finalGems = Math.round(rule.gems * totalMultiplier);
  const finalVipPoints = Math.round(rule.vip_points * totalMultiplier);
  
  // Special offers for high-tier players
  const specialOffers: Record<string, any> = {};
  if (playerTier === 'whale' || playerTier === 'vip_whale') {
    specialOffers.discount_percent = 10;
    if (playerTier === 'vip_whale') {
      specialOffers.exclusive_bundle_unlock = true;
      specialOffers.vip_support_priority = true;
    }
  }
  
  return {
    gold: finalGold,
    gems: finalGems,
    resources: rule.resources,
    items: rule.items,
    vip_points: finalVipPoints,
    special_offers: specialOffers,
    rule_id: 1, // Mock rule ID
    player_tier: playerTier,
    multiplier_applied: totalMultiplier,
    requires_approval: rule.approval
  };
}

/**
 * POST endpoint to calculate compensation based on player attributes and issue impact
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      player_level,
      vip_level,
      total_spend,
      churn_risk = 'low',
      impact_level,
      is_weekend = false
    }: CompensationCalculationParams = body;

    // Validate required parameters
    if (typeof player_level !== 'number' || player_level < 1) {
      return NextResponse.json({
        success: false,
        error: 'Invalid player_level: must be a positive number'
      } as CompensationCalculationResponse, { status: 400 });
    }

    if (typeof vip_level !== 'number' || vip_level < 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid vip_level: must be a non-negative number'
      } as CompensationCalculationResponse, { status: 400 });
    }

    if (typeof total_spend !== 'number' || total_spend < 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid total_spend: must be a non-negative number'
      } as CompensationCalculationResponse, { status: 400 });
    }

    if (!['low', 'medium', 'high', 'critical'].includes(impact_level)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid impact_level: must be low, medium, high, or critical'
      } as CompensationCalculationResponse, { status: 400 });
    }

    if (!['low', 'medium', 'high'].includes(churn_risk)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid churn_risk: must be low, medium, or high'
      } as CompensationCalculationResponse, { status: 400 });
    }

    // Calculate compensation using lookup table logic
    const compensation = await calculateCompensationFromLookup({
      player_level,
      vip_level,
      total_spend,
      churn_risk,
      impact_level,
      is_weekend
    });

    console.log(`💰 Compensation calculated for ${compensation.player_tier} player:`, {
      level: player_level,
      vip: vip_level,
      spend: total_spend,
      impact: impact_level,
      churn_risk,
      result: {
        gold: compensation.gold,
        gems: compensation.gems,
        multiplier: compensation.multiplier_applied,
        requires_approval: compensation.requires_approval
      }
    });

    const response: CompensationCalculationResponse = {
      success: true,
      compensation,
      debug_info: {
        matched_rule_id: compensation.rule_id,
        player_tier_classified: compensation.player_tier,
        multipliers_applied: compensation.multiplier_applied,
        fallback_used: !!compensation.error
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 Error calculating compensation:', error);
    
    const response: CompensationCalculationResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * GET endpoint to retrieve compensation reward rules (for admin panel)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerTier = searchParams.get('player_tier') as PlayerTier | null;
    const impactLevel = searchParams.get('impact_level') as ImpactLevel | null;
    const activeOnly = searchParams.get('active_only') === 'true';

    // Mock reward rules data (in production, this would query the database)
    const mockRules = [
      {
        id: 1,
        player_tier: 'f2p',
        level_min: 1,
        level_max: 10,
        vip_min: 0,
        vip_max: 0,
        spend_min: 0,
        spend_max: 0,
        churn_risk: 'low',
        churn_multiplier: 1.0,
        impact_level: 'low',
        base_gold: 100,
        base_gems: 0,
        base_resources: { energy: 10 },
        base_items: [],
        vip_points: 0,
        special_offers: {},
        vip_bonus_multiplier: 1.0,
        weekend_multiplier: 1.0,
        times_used: 45,
        active: true,
        requires_approval: false,
        notes: 'Basic F2P compensation for minor issues',
        created_by: 'system',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      // Add more mock rules as needed
    ];

    // Filter rules based on query parameters
    let filteredRules = mockRules;
    
    if (playerTier) {
      filteredRules = filteredRules.filter(rule => rule.player_tier === playerTier);
    }
    
    if (impactLevel) {
      filteredRules = filteredRules.filter(rule => rule.impact_level === impactLevel);
    }
    
    if (activeOnly) {
      filteredRules = filteredRules.filter(rule => rule.active);
    }

    return NextResponse.json({
      success: true,
      rules: filteredRules,
      total: filteredRules.length
    });

  } catch (error) {
    console.error('💥 Error fetching compensation rules:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}