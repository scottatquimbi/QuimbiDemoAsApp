import { ScenarioType } from '../types/chat';

export interface CompensationTier {
  itemName: string;
  amount: number;
  description: string;
}

export interface CompensationData {
  requestId: string;
  status: string;
  playerTier: number;
  scenario: string;
  items: CompensationTier[];
}

// Add tier information based on VIP level
export function addFallbackTierInfo(compensationData: any): any {
  if (!compensationData) return null;
  
  if (!compensationData.items || compensationData.items.length === 0) {
    const tierInfo = getDefaultCompensation(
      compensationData.playerTier || 6, 
      compensationData.scenario || 'guild_shop'
    );
    
    return {
      ...compensationData,
      items: tierInfo
    };
  }
  
  return compensationData;
}

// Get default compensation based on VIP level and scenario
export function getDefaultCompensation(vipLevel: number, scenario: ScenarioType): CompensationTier[] {
  const baseGold = 250;
  const vipMultiplier = Math.min(vipLevel, 10); // cap at VIP 10
  
  // Base compensation adjusted by VIP level
  let goldAmount = baseGold * vipMultiplier;
  
  // Scenario-specific compensation adjustments
  switch (scenario) {
    case 'guild_shop':
      return [
        { 
          itemName: 'Gold', 
          amount: 1500, 
          description: 'Compensation for Guild Shop access issue' 
        },
        { 
          itemName: 'Legendary Guild Shop Token', 
          amount: 3, 
          description: 'Special tokens for Guild Shop purchases' 
        }
      ];
      
    case 'account_access':
      return [
        { 
          itemName: 'Gold', 
          amount: 1000, 
          description: 'Compensation for account access issue' 
        },
        { 
          itemName: 'VIP Time Boost', 
          amount: 24, 
          description: '24-hour VIP status boost' 
        }
      ];
      
    case 'tutorial_crash':
      return [
        { 
          itemName: 'Gold', 
          amount: 500, 
          description: 'Compensation for tutorial crash issue' 
        },
        { 
          itemName: 'Beginner\'s Resource Bundle', 
          amount: 1, 
          description: 'Bundle of starting resources' 
        }
      ];
      
    default:
      return [
        { 
          itemName: 'Gold', 
          amount: goldAmount, 
          description: 'Basic compensation' 
        }
      ];
  }
}

// Find compensation data in a message or response
export function findCompensationData(data: any): any {
  if (!data) return null;
  
  // If the data itself has the expected structure, return it
  if (data.requestId && data.status) {
    return addFallbackTierInfo(data);
  }
  
  // Otherwise, try to find it in the response structure
  if (data.metadata && data.metadata.compensation) {
    return addFallbackTierInfo(data.metadata.compensation);
  }
  
  // Or in a more nested structure
  if (data.choices && data.choices.length > 0) {
    const choice = data.choices[0];
    if (choice.message && choice.message.metadata && choice.message.metadata.compensation) {
      return addFallbackTierInfo(choice.message.metadata.compensation);
    }
  }
  
  return null;
} 