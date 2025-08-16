import { getSystemPrompt } from './system-prompts';

interface ChatEnhancementOptions {
  gameLevel: number;
  supportType?: 'gameplay' | 'technical' | 'account';
  includeCompensation?: boolean;
  playerName?: string;
  vipLevel?: number;
  isSpender?: boolean;
}

/**
 * Enhances the system prompt for the chat based on player context
 * @param options Configuration options for enhancing the chat
 * @returns Enhanced system prompt tailored to the player's situation
 */
export function enhanceChatWithPlayerContext(options: ChatEnhancementOptions): string {
  const {
    gameLevel, vipLevel,
    supportType = 'gameplay',
    includeCompensation = false,
    playerName,
    isSpender
  } = options;
  
  // Get the base system prompt based on game level and support type
  let systemPrompt = getSystemPrompt(gameLevel, supportType, includeCompensation);
  
  // Add personalization if player name is available
  if (playerName) {
    systemPrompt = `PLAYER NAME: ${playerName}\n\n${systemPrompt}`;
  }
  
  // Add VIP context if available
  if (vipLevel !== undefined) {
    systemPrompt += `\n\nADDITIONAL CONTEXT: This player has VIP level ${vipLevel}.`;
    
    // Add spending context if available
    if (isSpender !== undefined) {
      systemPrompt += ` They are ${isSpender ? 'a paying player' : 'currently a non-paying player'}.`;
      
      // Add spending advice based on VIP level and spending status
      if (isSpender) {
        systemPrompt += ` As a paying player, they may be interested in optimizing their purchases for maximum value.`;
      } else if (vipLevel > 0) {
        systemPrompt += ` They have some VIP benefits but haven't made recent purchases. They may be receptive to special offers that demonstrate clear value.`;
      }
    }
  }
  
  return systemPrompt;
}

/**
 * Analyzes a player question to determine the likely support type
 * @param question The player's question text
 * @returns The detected support type
 */
export function detectSupportType(question: string): 'gameplay' | 'technical' | 'account' {
  question = question.toLowerCase();
  
  // Technical support keywords
  const technicalKeywords = [
    'crash', 'lag', 'freeze', 'loading', 'connection', 'network', 'wifi', 
    'device', 'phone', 'tablet', 'error', 'bug', 'glitch', 'performance'
  ];
  
  // Account management keywords
  const accountKeywords = [
    'purchase', 'buy', 'payment', 'charge', 'receipt', 'refund', 'subscription',
    'account', 'login', 'password', 'email', 'missing', 'vip', 'pack', 'transaction'
  ];
  
  // Check for technical issues
  if (technicalKeywords.some(keyword => question.includes(keyword))) {
    return 'technical';
  }
  
  // Check for account issues
  if (accountKeywords.some(keyword => question.includes(keyword))) {
    return 'account';
  }
  
  // Default to gameplay
  return 'gameplay';
}

/**
 * Determines if a question might warrant compensation based on keywords
 * @param question The player's question
 * @returns Whether compensation guidance should be included
 */
export function mightNeedCompensation(question: string): boolean {
  const compensationKeywords = [
    'lost', 'missing', 'disappeared', 'didn\'t receive', 'not credited',
    'charged twice', 'mistake', 'error', 'bug', 'compensation', 'refund',
    'crashed during', 'lost progress', 'deleted', 'stolen'
  ];
  
  return compensationKeywords.some(keyword => 
    question.toLowerCase().includes(keyword)
  );
}

/**
 * Complete utility function to enhance a chat with appropriate system prompt
 * @param question Player's question
 * @param gameLevel Player's current game level
 * @param playerContext Additional player context
 * @param externalSources External sources data (Discord, Reddit, system logs)
 * @returns Enhanced system prompt
 */
export function getEnhancedSystemPrompt(
  question: string,
  gameLevel: number,
  playerContext: {
    playerName?: string;
    vipLevel?: number;
    isSpender?: boolean;
    freeformContext?: string;
    likelinessToChurn?: number;
    sessionDays?: number;
    totalSpend?: number;
  } = {},
  externalSources?: any,
  escalatedAnalysis?: any,
  automatedResolution?: any
): string {
  // Detect support type from question
  const supportType = detectSupportType(question);
  
  // Check if compensation guidance should be included
  const includeCompensation = mightNeedCompensation(question);
  
  // Build enhancement options
  const enhancementOptions: ChatEnhancementOptions = {
    gameLevel,
    supportType,
    includeCompensation,
    ...playerContext
  };
  
  // Get base enhanced system prompt
  let enhancedPrompt = enhanceChatWithPlayerContext(enhancementOptions);
  
  // Add rich contextual information
  if (playerContext.freeformContext) {
    enhancedPrompt += `\n\n### SYSTEM CONTEXT AND LOGS:\n${playerContext.freeformContext}`;
  }
  
  // Add player behavior insights
  if (playerContext.likelinessToChurn !== undefined || playerContext.sessionDays !== undefined || playerContext.totalSpend !== undefined) {
    enhancedPrompt += `\n\n### PLAYER BEHAVIOR ANALYSIS:`;
    
    if (playerContext.likelinessToChurn !== undefined) {
      const churnRisk = playerContext.likelinessToChurn > 0.7 ? 'HIGH' : 
                       playerContext.likelinessToChurn > 0.4 ? 'MEDIUM' : 'LOW';
      enhancedPrompt += `\n- **Churn Risk**: ${churnRisk} (${Math.round(playerContext.likelinessToChurn * 100)}% likelihood)`;
      
      if (churnRisk === 'HIGH') {
        enhancedPrompt += `\n  *Priority: This player is at high risk of leaving. Provide exceptional service and consider generous compensation.*`;
      }
    }
    
    if (playerContext.sessionDays !== undefined) {
      enhancedPrompt += `\n- **Engagement**: ${playerContext.sessionDays} days active`;
    }
    
    if (playerContext.totalSpend !== undefined) {
      const spendTier = playerContext.totalSpend > 1000 ? 'Whale' :
                       playerContext.totalSpend > 100 ? 'Dolphin' :
                       playerContext.totalSpend > 10 ? 'Minnow' : 'F2P';
      enhancedPrompt += `\n- **Monetization Tier**: ${spendTier} ($${playerContext.totalSpend} lifetime value)`;
    }
  }
  
  // Add external sources context
  if (externalSources) {
    enhancedPrompt += `\n\n### ADDITIONAL CONTEXT:`;
    
    // Add Discord context
    if (externalSources.discordMessages && externalSources.discordMessages.length > 0) {
      enhancedPrompt += `\n\n**Recent Discord Activity:**`;
      externalSources.discordMessages.slice(0, 3).forEach((msg: any) => {
        enhancedPrompt += `\n- ${msg.user}: "${msg.message}"`;
      });
    }
    
    // Add Reddit context
    if (externalSources.redditComments && externalSources.redditComments.length > 0) {
      enhancedPrompt += `\n\n**Recent Reddit Activity:**`;
      externalSources.redditComments.slice(0, 3).forEach((comment: any) => {
        enhancedPrompt += `\n- ${comment.user}: "${comment.comment}"`;
      });
    }
    
    // Add known issue context
    if (externalSources.knownIssue) {
      enhancedPrompt += `\n\n**Known Issue Alert:**`;
      enhancedPrompt += `\n- **${externalSources.knownIssue.title}**`;
      if (typeof externalSources.knownIssue.content === 'string') {
        enhancedPrompt += `\n- Details: ${externalSources.knownIssue.content}`;
      }
    }
  }
  
  // Add escalated analysis data if provided
  if (escalatedAnalysis || automatedResolution) {
    enhancedPrompt += `\n\n### ESCALATED SUPPORT SESSION DATA:`;
    
    if (escalatedAnalysis) {
      enhancedPrompt += `\n\n**AI Analysis Results:**`;
      
      if (escalatedAnalysis.issueDetected) {
        enhancedPrompt += `\n- Issue Detected: YES`;
        
        if (escalatedAnalysis.issue) {
          const issue = escalatedAnalysis.issue;
          if (issue.issueType) enhancedPrompt += `\n- Issue Type: ${issue.issueType}`;
          if (issue.description) enhancedPrompt += `\n- Issue Description: ${issue.description}`;
          if (issue.confidenceScore) enhancedPrompt += `\n- AI Confidence: ${Math.round(issue.confidenceScore * 100)}%`;
        }
        
        if (escalatedAnalysis.sentiment) {
          const sentiment = escalatedAnalysis.sentiment;
          enhancedPrompt += `\n- Player Sentiment: ${sentiment.tone || 'neutral'}`;
          if (sentiment.urgency) enhancedPrompt += ` (urgency: ${sentiment.urgency})`;
          if (sentiment.intensity) enhancedPrompt += ` (intensity: ${sentiment.intensity})`;
        }
        
        if (escalatedAnalysis.compensation) {
          const compensation = escalatedAnalysis.compensation;
          enhancedPrompt += `\n- Compensation Recommended: ${compensation.tier || 'unknown tier'}`;
          if (compensation.reasoning) enhancedPrompt += `\n  Reasoning: ${compensation.reasoning}`;
        }
      } else {
        enhancedPrompt += `\n- Issue Detected: NO - AI analysis did not detect compensatable issues`;
      }
    }
    
    if (automatedResolution) {
      enhancedPrompt += `\n\n**Automated Resolution Results:**`;
      enhancedPrompt += `\n- Resolution Status: ${automatedResolution.success ? 'SUCCESSFUL' : 'FAILED/ESCALATED'}`;
      
      if (automatedResolution.resolution) {
        const resolution = automatedResolution.resolution;
        if (resolution.category) enhancedPrompt += `\n- Category: ${resolution.category}`;
        if (resolution.actions && resolution.actions.length > 0) {
          enhancedPrompt += `\n- Actions Taken:`;
          resolution.actions.forEach((action: string) => {
            enhancedPrompt += `\n  • ${action}`;
          });
        }
        if (resolution.compensation) {
          enhancedPrompt += `\n- Compensation Already Provided:`;
          const comp = resolution.compensation;
          if (comp.gold) enhancedPrompt += ` ${comp.gold} gold`;
          if (comp.resources) enhancedPrompt += ` + resources`;
          if (comp.description) enhancedPrompt += ` (${comp.description})`;
        }
        if (resolution.timeline) enhancedPrompt += `\n- Expected Timeline: ${resolution.timeline}`;
      }
      
      if (automatedResolution.escalationReason) {
        enhancedPrompt += `\n- Escalation Reason: ${automatedResolution.escalationReason}`;
      }
    }
    
    enhancedPrompt += `\n\n**IMPORTANT**: Use this escalated session data to provide contextually aware support. If automated resolution was successful, acknowledge the prior actions taken. If AI analysis detected issues, use those insights to provide targeted assistance.`;
  }
  
  // Add contextual instructions based on scenario
  enhancedPrompt += `\n\n### RESPONSE INSTRUCTIONS:`;
  enhancedPrompt += `\n- **NEVER use generic phrases** like "I understand you're having a problem" or "I see you're experiencing an issue"`;
  enhancedPrompt += `\n- **ALWAYS reference specific context**: player level (${gameLevel}), VIP status, spending history, and system logs`;
  enhancedPrompt += `\n- **Use concrete details** from the freeform context provided rather than generic acknowledgments`;
  enhancedPrompt += `\n- **Show understanding** by mentioning specific details from their situation (e.g., "as a Level ${gameLevel} player" or "given your VIP ${playerContext.vipLevel || 0} status")`;
  enhancedPrompt += `\n- **Reference system data** when available to show you've investigated their specific case`;
  enhancedPrompt += `\n- Adjust your tone and compensation offers based on the player's value and churn risk`;
  enhancedPrompt += `\n- If system logs contradict player claims, handle diplomatically but factually`;
  
  return enhancedPrompt;
} 