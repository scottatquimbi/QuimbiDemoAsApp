import { PlayerContext, CompensationTier } from './models';
import { generateAnalysisText, generateFastText, OLLAMA_MODELS } from './ollama';

// Types disabled to avoid conflicts
// export type {
//   IssueDetectionResult,
//   SentimentAnalysisResult,
//   CompensationRecommendation,
//   CompensationStatus,
//   CompensationRequest
// } from './compensation';

// Import fallback functions and utilities from original module
import {
  calculateHandlingTimeMetrics
} from './compensation';

/**
 * Helper function to extract JSON from Ollama LLM responses
 * Ollama models are generally better at following JSON format instructions
 * @param text The raw text response from the LLM
 * @returns Parsed JSON object or null if parsing fails
 */
function extractJsonFromOllamaResponse(text: string): any | null {
  try {
    // Skip empty responses
    if (!text || text.trim() === '') {
      console.log('🦙 Empty response from Ollama');
      return { 
        "detected": false,
        "issueType": null,
        "description": "Unable to analyze due to empty response",
        "playerImpact": null,
        "confidenceScore": 0
      };
    }


    // Method 1: Try direct parsing first
    try {
      const parsed = JSON.parse(text.trim());
      return parsed;
    } catch (directParseError) {
      // Continue to extraction methods
    }

    // Method 2: Extract JSON from markdown code blocks (common Ollama response format)
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      try {
        const extracted = JSON.parse(codeBlockMatch[1]);
        return extracted;
      } catch (parseError) {
        // Continue to next method
      }
    }

    // Method 3: Look for JSON pattern without code blocks
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const extracted = JSON.parse(jsonMatch[0]);
        return extracted;
      } catch (parseError) {
        // Method 4: Try to find a more specific JSON pattern
        const stricterMatch = text.match(/\{\s*"detected"[\s\S]*\}/);
        if (stricterMatch) {
          try {
            const extracted = JSON.parse(stricterMatch[0]);
            return extracted;
          } catch (error) {
            // Continue to fallback
          }
        }
      }
    }
    
    // If no valid JSON pattern was found, return a default response
    return { 
      "detected": false,
      "issueType": null,
      "description": "Analysis incomplete - formatting error",
      "playerImpact": null,
      "confidenceScore": 0
    };
  } catch (error) {
    console.error('🦙 Error extracting JSON from Ollama response:', error);
    return { 
      "detected": false,
      "issueType": null,
      "description": "Analysis failed",
      "playerImpact": null,
      "confidenceScore": 0
    };
  }
}

/**
 * Issue detection result from analyzing player messages
 */
export interface IssueDetectionResult {
  detected: boolean;
  issueType: 'technical' | 'account' | 'gameplay' | null;
  description: string;
  playerImpact: 'minimal' | 'minor' | 'moderate' | 'severe' | 'critical' | null;
  confidenceScore: number; // 0-1 confidence score
}

/**
 * Sentiment analysis result from analyzing player messages
 */
export interface SentimentAnalysisResult {
  tone: 'neutral' | 'frustrated' | 'angry' | 'confused' | 'appreciative';
  urgency: 'low' | 'medium' | 'high';
  repeatIssue: boolean;
  issueFrequency: 'unique' | 'uncommon' | 'common' | 'very common';
}

/**
 * Detect if a message indicates an issue that might require compensation using Ollama
 * @param message The player's message
 * @returns Issue detection result
 */
export async function detectIssue(message: string, playerContext?: any): Promise<IssueDetectionResult> {
  try {
    console.log('🦙 Detecting issue with Ollama...');
    
    // Check Ollama health before attempting analysis
    try {
      const healthResponse = await fetch('http://127.0.0.1:11434/api/tags');
      if (!healthResponse.ok) {
        throw new Error(`Ollama health check failed: ${healthResponse.status}`);
      }
      const healthData = await healthResponse.json();
      
      // Check if llama3.1:8b is available
      const requiredModel = 'llama3.1:8b';
      const hasRequiredModel = healthData.models?.some((m: any) => m.name === requiredModel);
      
      if (!hasRequiredModel) {
        throw new Error(`Required model ${requiredModel} not found`);
      }
    } catch (healthError) {
      console.error('🦙 Ollama health check failed:', healthError);
      throw new Error(`Ollama not available: ${healthError instanceof Error ? healthError.message : 'Unknown error'}`);
    }
    
    // SECOND: Try AI analysis with Ollama
    
    // Use llama3.1 for detailed analysis
    const analysisPrompt = `You are an AI analyzing a player's support request in a mobile game (Game of Thrones).

Player message: "${message}"

Analyze this message to determine if it describes an issue that might require compensation.
Categories of issues include:
- Technical: bugs, crashes, performance issues, errors, connectivity problems
- Account: missing items, payment issues, account access problems, login issues
- Gameplay: balance issues, game mechanics not working as expected, unfair gameplay elements

Also determine the severity/impact:
- Critical: Major loss of progress, significant monetary impact, complete inability to play
- Severe: Substantial setback, moderate monetary impact, significant gameplay disruption  
- Moderate: Noticeable inconvenience, minor monetary impact, partial feature unavailability
- Minor: Small inconvenience, very minor impact on gameplay
- Minimal: Trivial issue with negligible impact

CRITICAL: You must respond with ONLY the JSON object below. Do not include any markdown formatting, code blocks, backticks, or additional text.

{
  "detected": true/false,
  "issueType": "technical"/"account"/"gameplay"/null,
  "description": "[brief description of the issue]",
  "playerImpact": "critical"/"severe"/"moderate"/"minor"/"minimal"/null,
  "confidenceScore": [number between 0 and 1]
}

Return only the JSON, no other text.`;

    console.log('🦙 Sending analysis to Ollama...');
    
    const startTime = Date.now();
    
    // Add timeout to prevent hanging
    const ollamaPromise = generateAnalysisText(analysisPrompt, {
      temperature: 0.2,
      maxTokens: 512
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Ollama request timeout after 15 seconds')), 15000);
    });
    
    const responseText = await Promise.race([ollamaPromise, timeoutPromise]);
    const duration = Date.now() - startTime;
    
    console.log('🦙 Analysis completed in', duration + 'ms');
    console.log('🦙 Raw Ollama response:', responseText);
    
    // Extract JSON from the response using our helper
    const analysisResult = extractJsonFromOllamaResponse(responseText);
    console.log('🦙 Parsed analysis result:', analysisResult);
    
    if (analysisResult && analysisResult.detected) {
      console.log('🦙 Issue detected via AI analysis');
      return analysisResult as IssueDetectionResult;
    } else {
      console.log('🦙 Issue NOT detected via AI analysis - analysisResult:', analysisResult);
      console.log('🦙 analysisResult.detected:', analysisResult?.detected);
    }
    
    // FALLBACK: If AI analysis fails, try keyword detection
    console.log('🦙 AI analysis negative - trying keyword fallback...');
    
    const messageLower = message.toLowerCase();
    const issueKeywords = [
      'broken', 'help', 'problem', 'issue', 'bug', 'crash', 'error', 
      'cant', "can't", 'wont', "won't", 'missing', 'lost', 'locked', 
      'access', 'login', 'fail', 'failed', 'not work', 'doesnt work', 
      "doesn't work", 'get in', 'log in', 'stuck', 'freeze', 'frozen'
    ];
    const hasIssueKeyword = issueKeywords.some(keyword => messageLower.includes(keyword));
    
    if (hasIssueKeyword) {
      console.log('🛡️ Keyword override - Issue detected');
      return {
        detected: true,
        issueType: messageLower.includes('login') || messageLower.includes('access') || messageLower.includes('locked') || messageLower.includes('get in') ? 'account' : 'technical',
        description: `Issue keywords detected`,
        playerImpact: 'moderate',
        confidenceScore: 0.8
      };
    }
    
    // Both AI and keywords failed - but this is customer support, so help anyway
    console.log('🛡️ Treating as general inquiry');
    
    return { 
      detected: true, 
      issueType: 'technical', 
      description: 'General customer inquiry requiring assistance', 
      playerImpact: 'minor', 
      confidenceScore: 0.5 
    };
  } catch (error) {
    console.error('🦙 Ollama error:', error instanceof Error ? error.message : 'Unknown');
    console.log('🛡️ Checking for automated resolution fallback...');
    
    // Check if there's an automated resolution available in the context
    const freeformContext = (playerContext as any)?.freeformContext || '';
    const hasAutomatedResolution = freeformContext.includes('ESCALATED FROM AUTOMATED SUPPORT') || 
                                    freeformContext.includes('AUTOMATED RESOLUTION AVAILABLE');
    
    if (hasAutomatedResolution) {
      console.log('🤖 Using automated resolution fallback');
      
      // Extract resolution category from context
      let issueType: 'technical' | 'account' | 'gameplay' = 'technical';
      let playerImpact: 'minimal' | 'minor' | 'moderate' | 'severe' | 'critical' = 'moderate';
      let description = 'Automated resolution available';
      
      if (freeformContext.includes('Account Access')) {
        issueType = 'account';
        playerImpact = 'severe';
        description = 'Account access issue with automated resolution available';
      } else if (freeformContext.includes('Technical') || freeformContext.includes('Performance')) {
        issueType = 'technical';
        playerImpact = 'moderate';
        description = 'Technical issue with automated resolution available';
      } else if (freeformContext.includes('Gameplay') || freeformContext.includes('Game')) {
        issueType = 'gameplay';
        playerImpact = 'moderate';
        description = 'Gameplay issue with automated resolution available';
      }
      
      return { 
        detected: true, 
        issueType, 
        description,
        playerImpact, 
        confidenceScore: 0.8 // Higher confidence since there's a concrete resolution
      };
    }
    
    // Standard fallback when no automated resolution is available
    console.log('🛡️ Standard fallback - general inquiry');
    return { 
      detected: true, 
      issueType: 'technical', 
      description: 'Technical analysis failed - treating as general customer inquiry', 
      playerImpact: 'minor', 
      confidenceScore: 0.3 
    };
  }
}

/**
 * Analyze the sentiment of a player's message using Ollama
 * @param message The player's message
 * @returns Sentiment analysis result
 */
export async function analyzeSentiment(message: string): Promise<SentimentAnalysisResult> {
  try {
    console.log('🦙 Analyzing sentiment...');
    
    // Use the faster Llama model for sentiment analysis
    const analysisPrompt = `You are an AI analyzing the sentiment and tone of a player's support request in a mobile game.

Player message: "${message}"

Analyze this message to determine:
1. The emotional tone (neutral, frustrated, angry, confused, or appreciative)
2. The urgency level (low, medium, high)
3. Whether this seems like a repeat issue based on language patterns
4. How common this type of issue typically is in mobile gaming

CRITICAL: You must respond with ONLY the JSON object below. Do not include any markdown formatting, code blocks, backticks, or additional text.

{
  "tone": "neutral"/"frustrated"/"angry"/"confused"/"appreciative",
  "urgency": "low"/"medium"/"high",
  "repeatIssue": true/false,
  "issueFrequency": "unique"/"uncommon"/"common"/"very common"
}`;

    
    const startTime = Date.now();
    
    // Add timeout to prevent hanging
    const ollamaPromise = generateFastText(analysisPrompt, {
      temperature: 0.2,
      maxTokens: 256
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Sentiment analysis timeout after 10 seconds')), 10000);
    });
    
    const responseText = await Promise.race([ollamaPromise, timeoutPromise]);
    const duration = Date.now() - startTime;
    
    console.log('🦙 Sentiment completed in', duration + 'ms');
    
    // Extract JSON from the response using our helper
    const analysisResult = extractJsonFromOllamaResponse(responseText);
    if (analysisResult) {
      return analysisResult as SentimentAnalysisResult;
    }
    
    // Fall back to basic analysis if JSON parsing fails
    console.log('🦙 Falling back to basic sentiment analysis...');
    return { tone: 'neutral', urgency: 'medium', repeatIssue: false, issueFrequency: 'unique' };
  } catch (error) {
    console.error('🦙 Error analyzing sentiment with Ollama:', error);
    console.log('🛡️ Sentiment analysis fallback - checking for escalated context');
    
    // Check message for obvious sentiment indicators as fallback
    const messageLower = message.toLowerCase();
    let tone: 'neutral' | 'frustrated' | 'angry' | 'confused' | 'appreciative' = 'neutral';
    let urgency: 'low' | 'medium' | 'high' = 'medium';
    
    // Check for anger/frustration indicators
    if (messageLower.includes('broken') && (messageLower.includes('!!!!') || messageLower.includes('FIX IT'))) {
      tone = 'angry';
      urgency = 'high';
    } else if (messageLower.includes('help') || messageLower.includes('please')) {
      tone = 'neutral';
      urgency = 'medium';
    } else if (messageLower.includes('frustrated') || messageLower.includes('annoying')) {
      tone = 'frustrated';
      urgency = 'high';
    }
    
    console.log('🛡️ Keyword-based sentiment fallback:', { tone, urgency });
    return { tone, urgency, repeatIssue: false, issueFrequency: 'common' };
  }
}

/**
 * Generate reasoning for compensation recommendation using Ollama
 * @param issue Detected issue
 * @param tier Compensation tier
 * @returns Reasoning string
 */
export async function generateCompensationReasoning(
  issue: IssueDetectionResult, 
  tier: CompensationTier
): Promise<string> {
  try {
    console.log('🦙 Generating compensation reasoning with Ollama...');
    
    // Use Qwen2.5 for detailed reasoning generation
    const tierNames = {
      [CompensationTier.P0]: "Critical (P0)",
      [CompensationTier.P1]: "Severe (P1)",
      [CompensationTier.P2]: "Moderate (P2)",
      [CompensationTier.P3]: "Minor (P3)",
      [CompensationTier.P4]: "Minimal (P4)",
      [CompensationTier.P5]: "None (P5)"
    };
    
    const reasoningPrompt = `You are crafting a personalized explanation for why a player in Game of Thrones mobile game is receiving compensation.

Issue details:
- Type: ${issue.issueType || "general issue"}
- Description: ${issue.description}
- Impact level: ${issue.playerImpact || "moderate"}
- Compensation tier: ${tierNames[tier]}

Write a brief, empathetic explanation (1-2 sentences) for why this compensation is being offered. 
The explanation should:
- Acknowledge the specific issue mentioned by the player
- Be appropriate for the severity level
- Be conversational but professional
- Avoid promising future fixes or admitting fault
- Focus on making the player feel heard and valued
- Use Game of Thrones themed language where appropriate (e.g., "your journey in Westeros")

Return only the explanation text, no additional formatting or quotes.`;

    const reasoning = await generateAnalysisText(reasoningPrompt, {
      temperature: 0.4,
      maxTokens: 256
    });
    
    console.log('🦙 Generated reasoning:', reasoning);
    
    // Return the generated reasoning if it's valid
    if (reasoning && reasoning.trim().length > 10) {
      return reasoning.trim();
    }
    
    // Fall back to template reasoning if the generated text is too short
    console.log('🦙 Generated reasoning too short, using fallback...');
    return `We've reviewed your issue and determined compensation is appropriate. (Ollama reasoning failed, using fallback)`;
  } catch (error) {
    console.error('🦙 Error generating compensation reasoning with Ollama:', error);
    // Fall back to the original template-based method if Ollama fails
    return `We've reviewed your issue and determined compensation is appropriate. (Ollama reasoning failed, using fallback)`;
  }
}

/**
 * Analyze player claim for potential deception using Ollama
 * @param message Player's message
 * @param freeformContext System context
 * @param issue Detected issue
 * @returns Analysis result with contradiction detection
 */
export async function analyzePlayerClaim(
  message: string,
  freeformContext: string,
  issue: IssueDetectionResult
): Promise<{
  contradictionDetected: boolean;
  confidenceScore: number;
  reasoning: string;
  evidenceExists: boolean;
}> {
  try {
    console.log('🦙 Analyzing player claim for contradictions with Ollama...');
    
    const analysisPrompt = `You are an AI analyzing a player's support request and system log data for a Game of Thrones mobile game.

Player claim: "${message}"
System context: "${freeformContext}"

Detected issue type: ${issue.issueType || "unspecified"}
Detected issue description: ${issue.description}

Does the system context contradict or provide evidence against the player's claim?
Analyze specifically if there is evidence that:
1. The player's report of an error is contradicted by system logs
2. The player has already received compensation or rewards they're claiming
3. The system data shows no evidence of the claimed issue
4. There are factual inconsistencies between the claim and system data

Be careful to distinguish between:
- Clear contradictions (system shows opposite of what player claims)
- Lack of evidence (system simply doesn't show the claimed issue)
- Ambiguous situations (unclear or conflicting information)

You MUST return ONLY a valid JSON response with these exact fields:
{
  "contradictionDetected": true/false,
  "confidenceScore": [number between 0 and 1],
  "reasoning": "[explanation of contradiction or lack thereof]",
  "evidenceExists": true/false
}

Return only the JSON, no other text.`;

    const responseText = await generateAnalysisText(analysisPrompt, {
      temperature: 0.2,
      maxTokens: 512
    });
    
    console.log('🦙 Ollama claim analysis response:', responseText);
    
    // Extract JSON from the response using our helper
    const analysisResult = extractJsonFromOllamaResponse(responseText);
    if (analysisResult) {
      return analysisResult;
    }
    
    // Fall back to basic keyword detection
    console.log('🦙 Falling back to basic deception detection...');
    return fallbackAnalyzePlayerClaim(freeformContext);
  } catch (error) {
    console.error('🦙 Error analyzing player claim with Ollama:', error);
    return fallbackAnalyzePlayerClaim(freeformContext);
  }
}

// Local compensation recommendation function using Ollama
async function recommendCompensationLocal(
  issueResult: IssueDetectionResult,
  sentimentResult: any,
  playerContext: PlayerContext
): Promise<any> {
  console.log('🦙 Generating local compensation recommendation...');
  
  // Check if there's automated resolution context available
  const freeformContext = (playerContext as any).freeformContext || '';
  const hasAutomatedResolution = freeformContext.includes('ESCALATED FROM AUTOMATED SUPPORT') || 
                                  freeformContext.includes('AUTOMATED RESOLUTION AVAILABLE');
  
  if (hasAutomatedResolution) {
    console.log('🤖 ✅ AUTOMATED RESOLUTION CONTEXT DETECTED - Using resolution-based compensation');
    
    // Extract compensation info from automated resolution context
    let tier = 'P3';
    let reasoning = 'Automated resolution available with AI analysis fallback';
    let requiresHumanReview = true; // Always require review for escalated cases
    let baseCompensation = { gold: 2000, gems: 50 };
    
    // Check if compensation was already determined in the resolution
    if (freeformContext.includes('Compensation: None')) {
      tier = 'P5'; // No compensation needed, just service recovery
      baseCompensation = { gold: 0, gems: 0 };
      reasoning = 'Automated resolution provided - no additional compensation needed';
    } else if (freeformContext.includes('Account Access')) {
      tier = 'P2';
      baseCompensation = { gold: 5000, gems: 100 };
      reasoning = 'Account access issue with automated resolution - compensation for inconvenience';
    } else if (freeformContext.includes('angry sentiment') || freeformContext.includes('intensity: 9')) {
      tier = 'P1'; // Escalate compensation for angry customers
      baseCompensation = { gold: 7500, gems: 150 };
      reasoning = 'Automated resolution with high sentiment intensity - enhanced compensation for experience recovery';
    }
    
    // Apply VIP multipliers
    if (playerContext.vipLevel && playerContext.vipLevel >= 10) {
      baseCompensation.gold *= 1.5;
      baseCompensation.gems *= 1.5;
      if (tier === 'P2') tier = 'P1';
      reasoning += ' (VIP premium adjustment applied)';
    }
    
    console.log('🤖 Resolution-based compensation:', { tier, reasoning, baseCompensation });
    
    return {
      tier,
      reasoning,
      suggestedCompensation: {
        gold: Math.round(baseCompensation.gold),
        gems: Math.round(baseCompensation.gems),
        resources: baseCompensation.gold > 0 ? { food: 500, wood: 500 } : {}
      },
      requiresHumanReview,
      estimatedReviewTime: '15-30 minutes',
      alternativeActions: ['Deliver automated resolution personally'],
      preventionSuggestions: ['Automated system improvements']
    };
  }
  
  // Standard logic for cases without automated resolution
  if (issueResult.issueType === 'account') {
    let tier = 'P2';
    let gold = 5000;
    let gems = 100;
    let requiresHumanReview = false;

    // Adjust for VIP players
    if (playerContext.vipLevel && playerContext.vipLevel >= 5) {
      gold *= 2;
      gems *= 2;
      tier = 'P1';
    }

    // Adjust for high urgency
    if (sentimentResult.urgency === 'high' || sentimentResult.tone === 'angry') {
      gold *= 1.5;
      requiresHumanReview = true;
    }

    return {
      tier,
      reasoning: 'Account access issue causing immediate gameplay disruption',
      suggestedCompensation: {
        gold: Math.round(gold),
        gems: Math.round(gems),
        resources: { food: 1000, wood: 1000, stone: 500 }
      },
      requiresHumanReview,
      estimatedReviewTime: '2-4 hours',
      alternativeActions: ['Reset password', 'Account verification'],
      preventionSuggestions: ['Enable two-factor authentication', 'Regular password updates']
    };
  }

  // Default compensation for other issues
  return {
    tier: 'P3' as const,
    reasoning: 'Standard issue compensation',
    suggestedCompensation: {
      gold: 2000,
      gems: 50
    },
    requiresHumanReview: false
  };
}

/**
 * Fallback method for analyzing player claims using keywords
 */
function fallbackAnalyzePlayerClaim(freeformContext: string) {
  const freeformLower = freeformContext.toLowerCase();
  const deceptionKeywords = [
    "player has made", "false claim", "already received", "already claimed", 
    "rewards were delivered", "transaction logs show", "verification failed",
    "no evidence of", "contradicts player claim", "system check:", "flag",
    "0 errors", "zero errors", "no errors", "logs show no errors"
  ];
  
  const possibleDeception = deceptionKeywords.some(keyword => 
    freeformLower.includes(keyword.toLowerCase())
  );
  
  return {
    contradictionDetected: possibleDeception,
    confidenceScore: possibleDeception ? 0.7 : 0.3,
    reasoning: possibleDeception 
      ? "System context suggests the player's claim may be invalid based on keyword matching."
      : "No clear contradiction detected in system context.",
    evidenceExists: possibleDeception
  };
}

/**
 * Process a player's message to detect issues and recommend compensation using Ollama
 * This is the main entry point that replaces the original analyzePlayerMessage
 * @param message Player's message
 * @param playerContext Player's context
 * @returns Complete analysis including issue detection, sentiment, and compensation
 */
/**
 * Map tone to emotional intensity for compensation compatibility
 */
function mapToneToIntensity(tone: string): number {
  switch (tone) {
    case 'angry': return 8;
    case 'frustrated': return 6;
    case 'confused': return 4;
    case 'neutral': return 3;
    case 'appreciative': return 2;
    default: return 5;
  }
}

/**
 * Map tone to frustration level for compensation compatibility
 */
function mapToneToFrustration(tone: string): number {
  switch (tone) {
    case 'angry': return 8;
    case 'frustrated': return 7;
    case 'confused': return 5;
    case 'neutral': return 3;
    case 'appreciative': return 1;
    default: return 4;
  }
}

/**
 * Process account lock issues with specific handling
 */
async function processAccountLockIssue(message: string, playerContext: PlayerContext, issueDetection: IssueDetectionResult) {
  console.log('🔐 Processing account lock issue...');
  
  // Analyze sentiment for account lock cases
  const localSentimentResult = await analyzeSentiment(message);
  
  // Convert to the format expected by recommendCompensation
  const sentimentForCompensation = {
    tone: localSentimentResult.tone,
    urgency: localSentimentResult.urgency,
    isRepeatIssue: localSentimentResult.repeatIssue,
    emotionalIntensity: mapToneToIntensity(localSentimentResult.tone),
    keyPhrases: ['account', 'locked', 'access'],
    confidenceScore: 0.9,
    frustrationLevel: mapToneToFrustration(localSentimentResult.tone),
    keywords: ['account', 'locked']
  };
  
  // Generate compensation recommendation for account lock
  const compensationResult = await recommendCompensationLocal(
    issueDetection,
    sentimentForCompensation,
    playerContext
  );
  
  return {
    issueDetected: true,
    issue: {
      issueType: issueDetection.issueType,
      description: issueDetection.description,
      playerImpact: issueDetection.playerImpact,
      confidenceScore: issueDetection.confidenceScore
    },
    sentiment: {
      tone: localSentimentResult.tone,
      urgency: localSentimentResult.urgency,
      frustrationLevel: mapToneToFrustration(localSentimentResult.tone),
      keywords: ['account', 'locked']
    },
    compensation: {
      tier: compensationResult.tier,
      reasoning: compensationResult.reasoning,
      requiresHumanReview: compensationResult.requiresHumanReview || false,
      suggestedCompensation: compensationResult.suggestedCompensation || {
        gold: 0,
        resources: {},
        items: {}
      },
      description: `Account unlock assistance with ${compensationResult.tier} compensation for inconvenience`
    }
  };
}

export async function analyzePlayerMessage(message: string, playerContext: PlayerContext) {
  console.log('🦙 Starting analysis:', { messageLength: message.length, contextKeys: Object.keys(playerContext) });
  
  // Check for account lock issues first - this takes priority over AI analysis
  if ((playerContext as any).accountStatus === 'locked') {
    console.log('🔐 Account lock detected - account is locked, treating any player message as account access issue');
    
    const lockReason = (playerContext as any).lockReason || 'security';
    
    // Force account access issue detection regardless of message content
    // If their account is locked, any complaint is fundamentally about account access
    const accountLockIssue = {
      detected: true,
      issueType: 'account' as const,
      description: `Account access issue - account is locked due to ${lockReason}. Player cannot access game properly.`,
      playerImpact: 'critical' as const,
      confidenceScore: 1.0
    };
    
    console.log('🔐 Account lock issue detected:', accountLockIssue);
    
    // Return the account lock analysis immediately
    return await processAccountLockIssue(message, playerContext, accountLockIssue);
  }
  
  // Detect issues in the message using Ollama
  let issueDetection = await detectIssue(message, playerContext);
  
  // CUSTOMER SUPPORT RULE: Never return "no issue" - always try to help
  // If AI says no issue, check keywords and context to override bad AI assessment
  if (!issueDetection.detected) {
    console.log('🦙 AI said no issue - checking keywords and context to override bad assessment');
    
    // Check for obvious issue keywords that AI missed
    const messageLower = message.toLowerCase();
    const issueKeywords = [
      'broken', 'help', 'problem', 'issue', 'bug', 'crash', 'error', 
      'cant', "can't", 'wont', "won't", 'missing', 'lost', 'locked', 
      'access', 'login', 'fail', 'failed', 'not work', 'doesnt work', 
      "doesn't work", 'get in', 'log in', 'stuck', 'freeze', 'frozen'
    ];
    const hasIssueKeyword = issueKeywords.some(keyword => messageLower.includes(keyword));
    
    // Check for account lock status in player context
    const isAccountLocked = (playerContext as any).accountStatus === 'locked';
    
    if (hasIssueKeyword || isAccountLocked) {
      console.log('🛡️ Customer support override detected');
      
      // Override AI with keyword-based detection
      issueDetection = {
        detected: true,
        issueType: (messageLower.includes('login') || messageLower.includes('access') || messageLower.includes('locked') || isAccountLocked) ? 'account' : 'technical',
        description: `Customer support override: ${hasIssueKeyword ? 'Issue keywords detected' : 'Account status requires attention'}`,
        playerImpact: 'moderate',
        confidenceScore: 0.8
      };
    } else {
      // Even with no clear indicators, treat as a general inquiry in customer support context
      issueDetection = {
        detected: true,
        issueType: 'technical',
        description: 'General customer inquiry requiring assistance',
        playerImpact: 'minor',
        confidenceScore: 0.5
      };
    }
  }
  
  
  // Use Ollama to analyze if the freeform context contradicts the player's claim
  let possibleDeception = false;
  let deceptionReasoning = "";
  
  if (playerContext.freeformContext) {
    const claimAnalysis = await analyzePlayerClaim(
      message,
      playerContext.freeformContext,
      issueDetection
    );
    
    possibleDeception = claimAnalysis.contradictionDetected;
    deceptionReasoning = claimAnalysis.reasoning;
    
    // Update issue detection confidence based on Ollama analysis
    if (claimAnalysis.contradictionDetected) {
      issueDetection.confidenceScore = Math.min(
        issueDetection.confidenceScore, 
        1 - claimAnalysis.confidenceScore
      );
    } else {
      // If no contradiction, slightly increase confidence in the issue
      issueDetection.confidenceScore = Math.min(1, issueDetection.confidenceScore + 0.1);
    }
  }
  
  // Handle cases where system evidence contradicts player's claim
  if (possibleDeception) {
    console.log('🦙 Possible deception detected, handling accordingly...');
    
    // Override issue detection and set to a special deception case
    issueDetection.description = "Claim contradicted by system evidence";
    issueDetection.playerImpact = "minimal";
    issueDetection.confidenceScore = 0.95; // High confidence based on system evidence
    
    // Analyze sentiment using Ollama
    const sentiment = await analyzeSentiment(message);
    
    // Check if this is a VIP player (VIP level 10+ is considered high-tier VIP)
    const isHighTierVIP = (playerContext.vipLevel && playerContext.vipLevel >= 10) || false;
    
    // For VIP players, we'll trigger human review instead of automatic rejection
    if (isHighTierVIP) {
      console.log('🦙 High-tier VIP detected, escalating to human review...');
      return {
        issueDetected: true,
        issue: issueDetection,
        sentiment,
        compensation: {
          tier: CompensationTier.P3, // Set to a moderate tier to ensure proper handling
          reasoning: `Based on our system records, we found conflicting information about this claim. As a valued VIP player, we're escalating this to our specialist team for review.`,
          suggestedCompensation: {
            gold: 0,
            resources: {},
            items: [],
            vipPoints: 0
          },
          playerContext: {
            gameLevel: playerContext.gameLevel, 
            vipStatus: playerContext.vipLevel || 0,
            isSpender: playerContext.isSpender || false
          },
          requiresHumanReview: true, // Force human review for VIP players
          estimatedReviewTime: "1-2 hours", // Priority review time for VIPs
          handlingTimeMetrics: calculateHandlingTimeMetrics(
            new Date().toISOString(),
            new Date().toISOString(),
            new Date().toISOString()
          ),
          denied: false, // Not denied, just needs review
          evidenceExists: true // Still indicate system has evidence
        }
      };
    }
    
    // For non-VIP players, continue with the original automatic rejection logic
    console.log('🦙 Non-VIP player with contradicted claim, auto-rejecting...');
    return {
      issueDetected: true,
      issue: {
        issueType: issueDetection.issueType,
        description: issueDetection.description,
        playerImpact: issueDetection.playerImpact,
        confidenceScore: issueDetection.confidenceScore
      },
      sentiment: await analyzeSentiment(message),
      compensation: {
        tier: CompensationTier.P5, // No compensation tier
        reasoning: `Based on our system records, your claim could not be verified. ${deceptionReasoning}`,
        suggestedCompensation: {
          gold: 0,
          resources: {},
          items: [],
          vipPoints: 0
        },
        playerContext: {
          gameLevel: playerContext.gameLevel, 
          vipStatus: playerContext.vipLevel || 0,
          isSpender: playerContext.isSpender || false
        },
        requiresHumanReview: false, // No human review necessary
        handlingTimeMetrics: calculateHandlingTimeMetrics(
          new Date().toISOString(),
          new Date().toISOString(),
          new Date().toISOString()
        ),
        denied: true, // Add a specific flag indicating this is a denied claim
        evidenceExists: true // Indicate system has evidence
      }
    };
  }
  
  // If not deception, proceed with normal analysis using Ollama
  console.log('🦙 No deception detected, proceeding with normal compensation analysis...');
  
  // Analyze sentiment using Ollama
  const sentiment = await analyzeSentiment(message);
  
  // Generate compensation recommendation - simplified for Ollama-only setup
  const compensation = {
    tier: CompensationTier.P4,
    reasoning: `Based on the analysis: ${issueDetection.description}`,
    suggestedCompensation: {
      gold: issueDetection.playerImpact === 'critical' ? 1000 : 
            issueDetection.playerImpact === 'severe' ? 500 : 
            issueDetection.playerImpact === 'moderate' ? 250 : 100,
      resources: {},
      items: [],
      vipPoints: 0
    },
    requiresHumanReview: issueDetection.playerImpact === 'critical' || (playerContext.vipLevel || 0) >= 10,
    estimatedReviewTime: '30 minutes'
  };
  
  // Override the reasoning with Ollama-generated reasoning
  try {
    compensation.reasoning = await generateCompensationReasoning(issueDetection, compensation.tier);
  } catch (error) {
    console.error('🦙 Failed to generate Ollama reasoning, keeping original:', error);
    // Keep the original reasoning if Ollama fails
  }
  
  console.log('🦙 ========== ANALYSIS COMPLETE ==========');
  console.log('🦙 Ollama analysis complete!');
  
  const finalResult = {
    issueDetected: true,
    issue: {
      issueType: issueDetection.issueType,
      description: issueDetection.description,
      playerImpact: issueDetection.playerImpact,
      confidenceScore: issueDetection.confidenceScore
    },
    sentiment,
    compensation
  };
  
  console.log('🦙 FINAL RESULT STRUCTURE:', Object.keys(finalResult));
  console.log('🦙 FINAL RESULT ISSUE DETECTED:', finalResult.issueDetected);
  console.log('🦙 FINAL RESULT ISSUE TYPE:', finalResult.issue?.issueType);
  console.log('🦙 FINAL RESULT HAS COMPENSATION:', !!finalResult.compensation);
  console.log('🦙 FINAL RESULT COMPENSATION TIER:', finalResult.compensation?.tier);
  console.log('🦙 =======================================');
  
  return finalResult;
}

// Re-export shared utilities that don't need to be changed
export { calculateHandlingTimeMetrics };

// Disabled re-exports due to missing functions in ./compensation
// export { createCompensationPackage }; // Not exported from ./compensation
// export { 
//   fallbackDetectIssue, 
//   fallbackAnalyzeSentiment, 
//   fallbackGenerateCompensationReasoning 
// }; // These functions don't exist in ./compensation