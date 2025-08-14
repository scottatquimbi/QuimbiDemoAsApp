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

    // Ollama models usually return cleaner JSON, try direct parsing first
    try {
      return JSON.parse(text.trim());
    } catch (directParseError) {
      console.log('🦙 Direct JSON parse failed, searching for JSON pattern...');
    }

    // Look for JSON pattern more aggressively
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.log('🦙 JSON pattern match failed, trying stricter match...');
        
        // Try to find a more specific JSON pattern
        const stricterMatch = text.match(/\{\s*"detected"[\s\S]*\}/);
        if (stricterMatch) {
          try {
            return JSON.parse(stricterMatch[0]);
          } catch (error) {
            console.log('🦙 Stricter JSON match also failed');
          }
        }
      }
    }
    
    // If no valid JSON pattern was found, return a default response
    console.log('🦙 No valid JSON found in Ollama response, using default');
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
export async function detectIssue(message: string): Promise<IssueDetectionResult> {
  try {
    console.log('🦙 Detecting issue with Ollama...');
    
    // Use Qwen2.5 Coder for detailed analysis - it's excellent at structured tasks
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

You MUST return ONLY a valid JSON response with these exact fields:
{
  "detected": true/false,
  "issueType": "technical"/"account"/"gameplay"/null,
  "description": "[brief description of the issue]",
  "playerImpact": "critical"/"severe"/"moderate"/"minor"/"minimal"/null,
  "confidenceScore": [number between 0 and 1]
}

Return only the JSON, no other text.`;

    const responseText = await generateAnalysisText(analysisPrompt, {
      temperature: 0.2,
      maxTokens: 512
    });
    
    console.log('🦙 RAW OLLAMA RESPONSE:', responseText);
    console.log('🦙 RESPONSE LENGTH:', responseText?.length || 0);
    console.log('🦙 RESPONSE TYPE:', typeof responseText);
    
    // Extract JSON from the response using our helper
    const analysisResult = extractJsonFromOllamaResponse(responseText);
    console.log('🦙 PARSED RESULT:', analysisResult);
    if (analysisResult) {
      return analysisResult as IssueDetectionResult;
    }
    
    // Fall back to basic detection if JSON parsing fails
    console.log('🦙 Falling back to basic keyword detection...');
    
    // For obvious issue keywords, force detection
    const messageLower = message.toLowerCase();
    const issueKeywords = ['broken', 'help', 'problem', 'issue', 'bug', 'crash', 'error', 'cant', "can't", 'wont', "won't", 'missing', 'lost', 'locked', 'access', 'login'];
    const hasIssueKeyword = issueKeywords.some(keyword => messageLower.includes(keyword));
    
    if (hasIssueKeyword) {
      console.log('🦙 Keyword detection found issue, forcing detected=true');
      return {
        detected: true,
        issueType: messageLower.includes('login') || messageLower.includes('access') || messageLower.includes('locked') ? 'account' : 'technical',
        description: 'Issue detected via keyword fallback',
        playerImpact: 'moderate',
        confidenceScore: 0.8
      };
    }
    
    return { detected: false, issueType: null, description: 'No issue detected', playerImpact: null, confidenceScore: 0.1 };
  } catch (error) {
    console.error('🦙 Error analyzing player message with Ollama:', error);
    // Fall back to the original keyword-based method if Ollama fails
    return { detected: false, issueType: null, description: 'Ollama parsing failed', playerImpact: 'minimal', confidenceScore: 0.1 };
  }
}

/**
 * Analyze the sentiment of a player's message using Ollama
 * @param message The player's message
 * @returns Sentiment analysis result
 */
export async function analyzeSentiment(message: string): Promise<SentimentAnalysisResult> {
  try {
    console.log('🦙 Analyzing sentiment with Ollama...');
    
    // Use the faster Llama model for sentiment analysis
    const analysisPrompt = `You are an AI analyzing the sentiment and tone of a player's support request in a mobile game.

Player message: "${message}"

Analyze this message to determine:
1. The emotional tone (neutral, frustrated, angry, confused, or appreciative)
2. The urgency level (low, medium, high)
3. Whether this seems like a repeat issue based on language patterns
4. How common this type of issue typically is in mobile gaming

You MUST return ONLY a valid JSON response with these exact fields:
{
  "tone": "neutral"/"frustrated"/"angry"/"confused"/"appreciative",
  "urgency": "low"/"medium"/"high",
  "repeatIssue": true/false,
  "issueFrequency": "unique"/"uncommon"/"common"/"very common"
}

Return only the JSON, no other text.`;

    const responseText = await generateFastText(analysisPrompt, {
      temperature: 0.2,
      maxTokens: 256
    });
    
    console.log('🦙 Ollama sentiment analysis response:', responseText);
    
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
    // Fall back to the original keyword-based method if Ollama fails
    return { tone: 'neutral', urgency: 'medium', repeatIssue: false, issueFrequency: 'unique' };
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
  
  // For account lock issues, provide standard compensation
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
  console.log('🦙 Starting Ollama-powered player message analysis...');
  
  // Check for account lock issues first - this takes priority over AI analysis
  if ((playerContext as any).accountStatus === 'locked') {
    console.log('🔐 Account lock detected - overriding AI analysis with account access issue');
    
    // Check if the message indicates account access issues
    const messageLower = message.toLowerCase();
    const isAccountAccessIssue = messageLower.includes('login') || 
                                messageLower.includes('access') ||
                                messageLower.includes('locked') ||
                                messageLower.includes('cannot') ||
                                messageLower.includes('log in') ||
                                messageLower.includes('sign in');
    
    if (isAccountAccessIssue) {
      const lockReason = (playerContext as any).lockReason || 'security';
      
      // Force account access issue detection
      const accountLockIssue = {
        detected: true,
        issueType: 'account' as const,
        description: `Account access issue - account is locked due to ${lockReason}`,
        playerImpact: 'critical' as const,
        confidenceScore: 1.0
      };
      
      console.log('🔐 Account lock issue detected:', accountLockIssue);
      
      // Continue with analysis but use the account lock detection
      return await processAccountLockIssue(message, playerContext, accountLockIssue);
    }
  }
  
  // Detect issues in the message using Ollama
  const issueDetection = await detectIssue(message);
  
  // If no issue detected, return minimal result
  if (!issueDetection.detected) {
    console.log('🦙 No issue detected, returning early');
    return {
      issueDetected: false
    };
  }
  
  console.log('🦙 Issue detected, continuing with full analysis...');
  
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
      issue: issueDetection,
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
  
  console.log('🦙 Ollama analysis complete!');
  
  return {
    issueDetected: true,
    issue: issueDetection,
    sentiment,
    compensation
  };
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