import { NextRequest, NextResponse } from 'next/server';
import { defaultAIProvider } from '@/lib/ai-provider-switch';

export async function POST(request: NextRequest) {
  try {
    const { problemDescription, playerContext, playerId } = await request.json();
    
    if (!problemDescription || problemDescription.trim().length < 10) {
      return NextResponse.json({
        error: 'Problem description must be at least 10 characters long'
      }, { status: 400 });
    }

    console.log('🔍 Analyzing problem description for category suggestions...');
    
    // Check for account lock issues first (for demo purposes, using mock data approach)
    if (playerId === 'lannister-gold') {
      const isAccountAccessIssue = problemDescription.toLowerCase().includes('login') || 
                                   problemDescription.toLowerCase().includes('access') ||
                                   problemDescription.toLowerCase().includes('locked') ||
                                   problemDescription.toLowerCase().includes('cannot') ||
                                   problemDescription.toLowerCase().includes('banned');
      
      if (isAccountAccessIssue) {
        console.log('🔐 Account lock detected for LannisterGold - routing to verification');
        // Analyze sentiment even for account locks
        const hasAngryWords = /damn|hell|shit|wtf|stupid|ridiculous|terrible|awful|hate|furious|pissed|angry/.test(problemDescription.toLowerCase());
        const hasCaps = /[A-Z]{3,}/.test(problemDescription);
        const hasExclamations = (problemDescription.match(/!/g) || []).length > 1;
        const hasFrustratedWords = /frustrated|annoying|disappointed|upset|mad|irritated/.test(problemDescription.toLowerCase());
        
        let lockSentiment: {
          tone: 'calm' | 'frustrated' | 'angry' | 'agitated' | 'urgent' | 'disappointed';
          intensity: number;
          requiresHuman: boolean;
        } = {
          tone: 'calm',
          intensity: 4, // Account locks are inherently frustrating
          requiresHuman: false
        };
        
        if (hasAngryWords || (hasCaps && hasExclamations)) {
          lockSentiment = { tone: 'angry', intensity: 9, requiresHuman: true };
        } else if (hasFrustratedWords || hasExclamations) {
          lockSentiment = { tone: 'frustrated', intensity: 7, requiresHuman: true };
        }
        
        const routeDecision = lockSentiment.requiresHuman ? 'human' : 'automated';
        
        return NextResponse.json({
          success: true,
          analysis: {
            suggestedCategories: [{
              id: 'account_access',
              confidence: 0.95,
              reasoning: lockSentiment.requiresHuman ? 
                'Account lock detected with negative sentiment - requires human agent' :
                'Account lock detected - requires identity verification'
            }],
            autoResolvable: !lockSentiment.requiresHuman, // Don't auto-resolve if user is agitated
            routeDecision,
            reasoning: lockSentiment.requiresHuman ?
              `Account locked with ${lockSentiment.tone} sentiment - routing to human agent for personalized assistance` :
              'Account is locked - automated verification process available',
            accountLocked: true,
            requiresEmailVerification: !lockSentiment.requiresHuman,
            suggestedUrgency: 'high', // Account access is high priority
            sentiment: lockSentiment
          },
          originalDescription: problemDescription
        });
      }
    }

    const analysisPrompt = `
You are an expert customer support system analyzing a player's problem description to suggest the most appropriate support categories.

Available Categories:
1. account_access - Login, password, or locked account issues
2. missing_rewards - Daily rewards, event items, or missing purchases  
3. purchase_issues - Payment issues, missing items, or refunds
4. technical - Crashes, performance, or connectivity problems
5. gameplay - Game mechanics, bugs, or balance concerns
6. account_recovery - Lost progress or account restoration
7. other - Complex problems requiring human review

Player's Problem: "${problemDescription}"

Player Context: ${playerContext ? `Level ${playerContext.gameLevel}, VIP ${playerContext.vipLevel}, ${playerContext.isSpender ? 'Premium' : 'Standard'} player` : 'Unknown player'}

Analyze this problem and respond with ONLY a clean JSON object containing:
{
  "suggestedCategories": [
    {
      "id": "category_id",
      "confidence": 0.95,
      "reasoning": "Why this category fits"
    }
  ],
  "autoResolvable": true/false,
  "routeDecision": "automated" | "human" | "suggest",
  "reasoning": "Overall analysis of the problem complexity",
  "suggestedUrgency": "low" | "medium" | "high",
  "sentiment": {
    "tone": "calm" | "frustrated" | "angry" | "agitated" | "urgent" | "disappointed",
    "intensity": 1-10,
    "requiresHuman": true/false
  }
}

IMPORTANT: Return ONLY the JSON object, no markdown, no explanations, no additional text.

Rules:
- Suggest 1-3 categories maximum, ranked by confidence (0.0-1.0)
- autoResolvable: false for complex issues needing human review
- routeDecision: 
  * "automated" = clear-cut issue, proceed directly to automation
  * "human" = complex issue, route directly to chat
  * "suggest" = borderline case, show category suggestions to user
- Only suggest categories with confidence > 0.6
- Account recovery and gameplay balance issues are typically not auto-resolvable
- suggestedUrgency guidelines:
  * "high" = Cannot access account, game crashes preventing play, missing purchases
  * "medium" = Missing rewards, technical issues affecting gameplay experience  
  * "low" = General inquiries, minor gameplay issues, enhancement requests
- sentiment analysis:
  * Detect emotional tone from language, word choice, and phrasing
  * "calm" = Professional, neutral, patient tone
  * "frustrated" = Some negative words, mild complaints
  * "angry"/"agitated" = Strong negative language, caps, exclamation marks, demanding tone
  * "urgent" = Time-sensitive language, immediate action needed
  * "disappointed" = Sad or let down tone
  * intensity: 1-3=mild, 4-6=moderate, 7-10=severe
  * requiresHuman: true if tone is frustrated/angry/agitated with intensity > 6
`;

    const analysisResult = await defaultAIProvider.generateChatText(analysisPrompt);
    
    console.log('🤖 AI Analysis Result:', analysisResult);

    // Parse the AI response
    let parsedResult;
    try {
      // Extract JSON from the response - try multiple approaches
      let jsonString = null;
      
      // Method 1: Look for JSON blocks in code blocks
      const codeBlockMatch = analysisResult.match(/```json\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        jsonString = codeBlockMatch[1];
      } else {
        // Method 2: Look for complete JSON objects (non-greedy)
        const matches = analysisResult.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
        if (matches && matches.length > 0) {
          // Try to find the one with the expected fields
          for (const match of matches) {
            if (match.includes('suggestedCategories') || match.includes('autoResolvable')) {
              jsonString = match;
              break;
            }
          }
          // If no match found, use the last one (likely the complete response)
          if (!jsonString) {
            jsonString = matches[matches.length - 1];
          }
        }
      }
      
      if (jsonString) {
        parsedResult = JSON.parse(jsonString);
      } else {
        throw new Error('No valid JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI analysis:', parseError);
      
      // Fallback: basic keyword analysis
      const description = problemDescription.toLowerCase();
      let fallbackCategory = 'other';
      let autoResolvable = false;
      let fallbackUrgency = 'medium';
      
      // Basic sentiment analysis for fallback
      const hasAngryWords = /damn|hell|shit|wtf|stupid|ridiculous|terrible|awful|hate|furious|pissed|angry/.test(description);
      const hasCaps = /[A-Z]{3,}/.test(problemDescription); // 3+ consecutive caps
      const hasExclamations = (problemDescription.match(/!/g) || []).length > 1;
      const hasFrustratedWords = /frustrated|annoying|disappointed|upset|mad|irritated/.test(description);
      
      let fallbackSentiment: {
        tone: 'calm' | 'frustrated' | 'angry' | 'agitated' | 'urgent' | 'disappointed';
        intensity: number;
        requiresHuman: boolean;
      } = {
        tone: 'calm',
        intensity: 3,
        requiresHuman: false
      };
      
      if (hasAngryWords || (hasCaps && hasExclamations)) {
        fallbackSentiment = { tone: 'angry', intensity: 8, requiresHuman: true };
      } else if (hasFrustratedWords || hasExclamations) {
        fallbackSentiment = { tone: 'frustrated', intensity: 6, requiresHuman: true };
      } else if (description.includes('urgent') || description.includes('immediately') || description.includes('asap')) {
        fallbackSentiment = { tone: 'urgent', intensity: 7, requiresHuman: false };
      }
      
      if (description.includes('login') || description.includes('password') || description.includes('locked')) {
        fallbackCategory = 'account_access';
        autoResolvable = true;
        fallbackUrgency = 'high'; // Account access is high priority
      } else if (description.includes('reward') || description.includes('missing') || description.includes('didn\'t receive')) {
        fallbackCategory = 'missing_rewards';
        autoResolvable = true;
        fallbackUrgency = 'medium';
      } else if (description.includes('purchase') || description.includes('payment') || description.includes('refund')) {
        fallbackCategory = 'purchase_issues';
        autoResolvable = true;
        fallbackUrgency = 'high'; // Money issues are high priority
      } else if (description.includes('crash') || description.includes('lag') || description.includes('connection')) {
        fallbackCategory = 'technical';
        autoResolvable = true;
        fallbackUrgency = description.includes('crash') ? 'high' : 'medium';
      } else if (description.includes('gameplay') || description.includes('bug') || description.includes('balance')) {
        fallbackCategory = 'gameplay';
        autoResolvable = false;
        fallbackUrgency = 'low';
      } else if (description.includes('lost') || description.includes('restore') || description.includes('recovery')) {
        fallbackCategory = 'account_recovery';
        autoResolvable = false;
        fallbackUrgency = 'high';
      }
      
      // If sentiment requires human, override route decision
      const routeDecision = fallbackSentiment.requiresHuman ? 'human' : (autoResolvable ? 'automated' : 'human');
      
      parsedResult = {
        suggestedCategories: [{
          id: fallbackCategory,
          confidence: 0.75,
          reasoning: 'Keyword-based fallback analysis'
        }],
        autoResolvable: autoResolvable && !fallbackSentiment.requiresHuman,
        routeDecision,
        reasoning: fallbackSentiment.requiresHuman ? 
          `Fallback analysis detected ${fallbackSentiment.tone} sentiment - routing to human agent` : 
          'Fallback analysis due to AI parsing error',
        suggestedUrgency: fallbackUrgency,
        sentiment: fallbackSentiment
      };
    }

    // Validate the structure
    if (!parsedResult.suggestedCategories || !Array.isArray(parsedResult.suggestedCategories)) {
      throw new Error('Invalid analysis result structure');
    }
    
    // Override route decision based on sentiment analysis
    if (parsedResult.sentiment && parsedResult.sentiment.requiresHuman) {
      console.log(`🔥 Sentiment override: ${parsedResult.sentiment.tone} (intensity: ${parsedResult.sentiment.intensity}) - routing to human agent`);
      parsedResult.routeDecision = 'human';
      parsedResult.autoResolvable = false;
      parsedResult.reasoning = `Detected ${parsedResult.sentiment.tone} sentiment requiring human attention`;
    }

    console.log('✅ Problem analysis complete:', {
      categories: parsedResult.suggestedCategories.length,
      decision: parsedResult.routeDecision,
      autoResolvable: parsedResult.autoResolvable
    });

    return NextResponse.json({
      success: true,
      analysis: parsedResult,
      originalDescription: problemDescription
    });

  } catch (error) {
    console.error('🚨 Problem analysis error:', error);
    
    return NextResponse.json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      fallback: {
        suggestedCategories: [{
          id: 'other',
          confidence: 0.5,
          reasoning: 'Analysis system error - defaulting to human review'
        }],
        autoResolvable: false,
        routeDecision: 'human',
        reasoning: 'System error - routing to human agent for safety'
      }
    }, { status: 500 });
  }
}