import { getEnhancedSystemPrompt } from '@/lib/enhance-chat';
import { defaultAIProvider, getProviderStatus } from '@/lib/ai-provider-switch';
import { Message } from 'ai';

export const maxDuration = 60;

// Debug flag - set to true to enable debug logging
const DEBUG_MODE = true;

/**
 * Logs debug information if debug mode is enabled
 */
function debugLog(label: string, data: any) {
  if (DEBUG_MODE) {
    console.log(`----- 🧠 SMART DEBUG: ${label} -----`);
    console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    console.log(`----- END 🧠 SMART DEBUG: ${label} -----\n`);
  }
}

export async function POST(req: Request) {
  try {
    debugLog('Request received', 'Starting smart AI provider chat processing...');
    
    
    // Get provider status
    const providerStatus = await getProviderStatus();
    debugLog('AI Provider Status', providerStatus);

    const { messages, system: userProvidedSystem, gameId, playerContext, externalSources } = await req.json();
    
    // Handle warmup requests - quick model loading for qwen2.5-coder
    if (messages && messages.length === 1 && messages[0].content === 'warmup') {
      debugLog('Warmup request', 'Performing smart chat model warmup...');
      try {
        const simpleTest = await defaultAIProvider.generateChatText('Ready');
        return new Response(
          JSON.stringify({ 
            status: 'success', 
            message: 'Smart chat model warmed up successfully',
            model: 'qwen2.5-coder:7b'
          }), 
          { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ 
            status: 'error', 
            message: 'Smart chat warmup failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }), 
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
    }
    
    // Get the last user message
    const lastUserMessage = messages.findLast((msg: any) => msg.role === 'user')?.content || '';
    debugLog('Last user message', lastUserMessage);
    debugLog('External Sources', externalSources);
    
    // RAG system disabled for Ollama-only setup
    let enhancedPrompt = lastUserMessage;
    let resources: any[] = [];
    console.log('🦙 RAG system disabled for Ollama-only setup');
    
    // Debug log the RAG resources
    debugLog('RAG Resources', resources);
    
    // Create a new messages array with the enhanced prompt
    const enhancedMessages = [...messages] as Message[];
    if (enhancedMessages.length > 0 && enhancedMessages[enhancedMessages.length - 1].role === 'user') {
      enhancedMessages[enhancedMessages.length - 1].content = enhancedPrompt;
    }

    // Format messages for AI processing
    const formattedMessages = enhancedMessages.map(message => ({
      role: message.role,
      content: message.content
    }));

    // Get player level from context or default to level 1
    const gameLevel = playerContext?.gameLevel || 1;
    
    // Generate an enhanced system prompt based on the player's level and question
    let enhancedSystem = playerContext 
      ? getEnhancedSystemPrompt(lastUserMessage, gameLevel, {
          playerName: playerContext.playerName,
          vipLevel: playerContext.vipLevel,
          isSpender: playerContext.isSpender,
          freeformContext: playerContext.freeformContext,
          likelinessToChurn: playerContext.likelinessToChurn,
          sessionDays: playerContext.sessionDays,
          totalSpend: playerContext.totalSpend
        }, externalSources)
      : userProvidedSystem;
    
    // Analyze the player's message for potential issues requiring compensation using Ollama
    const analysisResult = playerContext 
      ? await defaultAIProvider.analyzePlayerMessage(lastUserMessage, playerContext)
      : { issueDetected: false };
    
    // Debug log the compensation analysis
    debugLog('AI Provider Compensation Analysis', analysisResult);
    
    // Add structured response format to system prompt
    const structuredFormat = `

CRITICAL FORMAT REQUIREMENT: You MUST structure your response in exactly 3 parts separated by triple dashes (---). 

ABSOLUTELY FORBIDDEN:
- Do NOT use section headers like "PROBLEM_SUMMARY:", "SOLUTION:", or "COMPENSATION:"
- Do NOT repeat any content between sections
- Do NOT include any labels, headers, or section names
- Do NOT duplicate any sentences or phrases

REQUIRED FORMAT (NO HEADERS, just content separated by ---):

[First part: Problem acknowledgment with specific context - ONE TIME ONLY]

---

[Second part: Step-by-step solution - ONE TIME ONLY]

---

[Third part: Compensation text - ONLY include this section if you have been specifically told that compensation is approved. If no compensation is mentioned in the system instructions, DO NOT include this section at all.]

PROBLEM_SUMMARY Requirements:
- Reference specific details from the player's context (freeform context, game level, VIP status)
- Use concrete information rather than generic acknowledgments
- Show you understand their specific situation by mentioning relevant details
- If system logs are provided, reference what actually happened vs what they reported
- NEVER use generic phrases like "I understand you're having a problem"

EXAMPLES - Match the format and specificity:

FOR ACCOUNT ACCESS ISSUES:
Based on your report, I can see that you're a Level 27 VIP 12 player with significant account value who is currently locked out after a device change. Your account shows a successful login attempt that triggered our security protocols.

---

I'll immediately verify your identity and unlock your account. Please provide your registered email address so I can send a verification code. Once verified, I'll restore full access and ensure all your progress and purchases are intact.

---

As a valued VIP 12 player, I've added 1000 gold to compensate for this inconvenience.

FOR MISSING REWARDS:
Based on your report and system logs, I can see that you're a Level 15 VIP 3 player who should have received battle rewards after completing the Northern Campaign yesterday. The system shows the battle was completed successfully but the reward distribution process encountered an error.

---

I'll manually trigger the reward distribution for your completed Northern Campaign battle. Please restart your game and check your in-game mailbox within the next 5 minutes. If you don't see the rewards, please clear your cache by going to Settings > General > Clear Cache.

---

I've added 500 gold to compensate for the delay in receiving your rewards.

CRITICAL: Each section appears EXACTLY ONCE. NO repetition, NO duplication, NO section headers.`;

    enhancedSystem = `${enhancedSystem}\n\n${structuredFormat}`;

    // Add compensation information to system prompt if an issue was detected
    if (analysisResult.issueDetected) {
      const hasCompensation = (analysisResult.compensation?.suggestedCompensation?.gold || 0) > 0 || 
                             Object.keys(analysisResult.compensation?.suggestedCompensation?.resources || {}).length > 0;
      
      // Add specific guidance based on issue type
      let issueSpecificGuidance = '';
      if (analysisResult.issue?.issueType === 'account') {
        if (analysisResult.issue.description?.toLowerCase().includes('locked') || 
            analysisResult.issue.description?.toLowerCase().includes('access')) {
          issueSpecificGuidance = `
          
CRITICAL: This is an ACCOUNT ACCESS issue. You MUST:
1. Address the account lockout/access problem directly
2. Provide specific steps to regain access (verification, password reset, etc.)
3. Do NOT give generic gameplay advice
4. Focus entirely on resolving the access issue
5. Reference their VIP status and account value to show priority support`;
        }
      }
      
      const compensationInfo = !hasCompensation
        ? `CRITICAL: No compensation is warranted for this issue. Do NOT include a COMPENSATION section in your response. End your response after the SOLUTION section only.`
        : `I've detected an issue and have prepared a compensation package for the player (${analysisResult.issue?.description || 'reported issue'}). Include a COMPENSATION section mentioning exactly: ${analysisResult.compensation?.suggestedCompensation?.gold ? analysisResult.compensation.suggestedCompensation.gold + ' gold' : ''} ${Object.keys(analysisResult.compensation?.suggestedCompensation?.resources || {}).length > 0 ? 'and additional resources' : ''} for this inconvenience.`;
      
      enhancedSystem = `${enhancedSystem}\n\n${compensationInfo}${issueSpecificGuidance}`;
      debugLog('Enhanced System Prompt with Compensation', enhancedSystem);
    }
    
    // Use the enhanced system prompt or fall back to user-provided one
    const system = enhancedSystem || userProvidedSystem;
    
    // Debug log the system prompt being used
    debugLog('System Prompt', system);
    debugLog('System Prompt Length', system?.length || 0);
    debugLog('Enhanced System Sample', enhancedSystem?.substring(0, 500) + '...');
    
    // Debug log the enhanced user message with RAG content
    debugLog('Enhanced User Message', enhancedPrompt);

    debugLog('Generating response with Ollama', `Effective provider: ${providerStatus.effectiveProvider}`);
    
    // Generate response using Ollama (only supported provider)
    if (providerStatus.effectiveProvider === 'ollama') {
      // For Ollama, we need to handle the response differently since it doesn't support AI SDK streaming
      debugLog('Using Ollama path', 'Generating with Ollama models');
      
      // Build conversation context for Ollama
      let conversationContext = '';
      
      if (system) {
        conversationContext += `System: ${system}\n\n`;
      }
      
      formattedMessages.forEach((msg) => {
        const role = msg.role === 'user' ? 'Human' : 'Assistant';
        conversationContext += `${role}: ${msg.content}\n\n`;
      });
      
      conversationContext += 'Assistant: ';
      
      // Generate response using Ollama
      const response = await defaultAIProvider.generateChatText(conversationContext, {
        temperature: 0.7,
        maxTokens: 2048
      });
      
      debugLog('Ollama Response Generated', response);
      
      // Clean the response - remove any system/human/assistant prefixes that might leak through
      let cleanedResponse = response;
      
      // Remove common prefixes that might appear from the conversation context
      const prefixesToRemove = [
        /^System:\s*/i,
        /^Human:\s*/i,
        /^Assistant:\s*/i,
        /^AI:\s*/i,
        /^Bot:\s*/i
      ];
      
      for (const prefix of prefixesToRemove) {
        cleanedResponse = cleanedResponse.replace(prefix, '');
      }
      
      // Also remove any quoted system prompts that might leak through
      cleanedResponse = cleanedResponse.replace(/^["'].*?["']\s*/, '');
      
      // Trim any remaining whitespace
      cleanedResponse = cleanedResponse.trim();
      
      debugLog('Cleaned Response', cleanedResponse);
      
      // Parse the structured response with enhanced duplication detection
      let problemSummary = '';
      let solution = '';
      let compensationText = '';
      
      // Define patterns for detection
      const headerPattern = /^(### ?)?(?:PROBLEM_SUMMARY|SOLUTION|COMPENSATION):?\s*$/im;
      const sectionHeaderInline = /(?:PROBLEM_SUMMARY|SOLUTION|COMPENSATION):?\s*/gi;
      
      // Check for obvious duplication patterns first
      const duplicatePatterns = [
        /PROBLEM_SUMMARY[\s\S]*?PROBLEM_SUMMARY/i,
        /SOLUTION[\s\S]*?SOLUTION/i,
        /COMPENSATION[\s\S]*?COMPENSATION/i
      ];
      
      let hasDuplication = duplicatePatterns.some(pattern => pattern.test(cleanedResponse));
      
      if (hasDuplication) {
        debugLog('Duplication pattern detected in AI response', 'Attempting advanced parsing');
        
        // For duplicated responses, try to extract the first occurrence of each section
        const firstProblemMatch = cleanedResponse.match(/PROBLEM_SUMMARY:?\s*([\s\S]*?)(?=SOLUTION:|---)/i);
        const firstSolutionMatch = cleanedResponse.match(/SOLUTION:?\s*([\s\S]*?)(?=COMPENSATION:|---)/i);
        const firstCompensationMatch = cleanedResponse.match(/COMPENSATION:?\s*([\s\S]*?)(?=PROBLEM_SUMMARY|SOLUTION|$)/i);
        
        problemSummary = firstProblemMatch ? firstProblemMatch[1].trim() : '';
        solution = firstSolutionMatch ? firstSolutionMatch[1].trim() : '';
        compensationText = firstCompensationMatch ? firstCompensationMatch[1].trim() : '';
        
        debugLog('Duplication parsing results', { problemSummary: problemSummary.substring(0, 100), solution: solution.substring(0, 100), compensationText: compensationText.substring(0, 100) });
      } else {
        // Standard parsing logic for well-formed responses
        const dashParts = cleanedResponse.split('---').map(part => part.trim());
        
        if (dashParts.length >= 3) {
          // Standard dash-separated format
          problemSummary = dashParts[0];
          solution = dashParts[1];
          compensationText = dashParts[2];
          
          // Clean up any headers that might still be present
          problemSummary = problemSummary.replace(/^(### ?)?PROBLEM_SUMMARY:?\n?/i, '').trim();
          solution = solution.replace(/^(### ?)?SOLUTION:?\n?/i, '').trim();
          compensationText = compensationText.replace(/^(### ?)?COMPENSATION:?\n?/i, '').trim();
        } else if (dashParts.length === 2) {
          // Two parts only - problem and solution, no compensation
          problemSummary = dashParts[0].replace(/^(### ?)?PROBLEM_SUMMARY:?\n?/i, '').trim();
          solution = dashParts[1].replace(/^(### ?)?SOLUTION:?\n?/i, '').trim();
          compensationText = '';
        } else {
          // Try to parse by section headers (fallback for when AI doesn't use dashes)
          if (headerPattern.test(cleanedResponse)) {
            // Split by section headers
            const sections = cleanedResponse.split(/^(### ?)?(?:PROBLEM_SUMMARY|SOLUTION|COMPENSATION):?\s*$/im)
              .filter(section => section && section.trim() && !headerPattern.test(section.trim()))
              .map(section => section.trim());
            
            problemSummary = sections[0] || '';
            solution = sections[1] || '';
            compensationText = sections[2] || '';
          } else {
            // No clear structure found - treat entire response as problem summary
            problemSummary = cleanedResponse;
            solution = '';
            compensationText = '';
          }
        }
      }
      
      // Additional cleanup: Remove any remaining section headers that leaked through
      problemSummary = problemSummary.replace(sectionHeaderInline, '').trim();
      solution = solution.replace(sectionHeaderInline, '').trim();
      compensationText = compensationText.replace(sectionHeaderInline, '').trim();
      
      // Final validation: Check if any section is suspiciously long (might contain multiple sections)
      if (problemSummary.length > 800 || (problemSummary.includes('---') && problemSummary.length > 300)) {
        debugLog('Suspicious section length detected - final cleanup attempt', null);
        
        // Try to split overly long problem summary
        const emergencyParts = problemSummary.split(/---/);
        if (emergencyParts.length >= 2) {
          problemSummary = emergencyParts[0].trim();
          if (!solution && emergencyParts[1]) {
            solution = emergencyParts[1].trim();
          }
          if (!compensationText && emergencyParts[2]) {
            compensationText = emergencyParts[2].trim();
          }
        }
      }
      
      // Determine if compensation should be shown - if AI generated compensation text, show it
      const hasCompensation = !!compensationText && compensationText.length > 0;
      
      // Calculate dash parts for debug logging
      const dashPartsCount = cleanedResponse.split('---').length;
      
      debugLog('Response Parsing Analysis', {
        originalLength: cleanedResponse.length,
        dashSeparatedParts: dashPartsCount,
        foundHeaders: headerPattern.test(cleanedResponse),
        parsingMethod: dashPartsCount >= 3 ? 'dash-separated' : 'header-based',
        hasDuplication: hasDuplication,
        problemSummaryLength: problemSummary.length,
        solutionLength: solution.length,
        compensationTextLength: compensationText.length,
        hasCompensation,
        analysisResultIssueDetected: analysisResult.issueDetected
      });
      
      debugLog('Parsed Response Parts', { 
        problemSummary: problemSummary.substring(0, 200) + (problemSummary.length > 200 ? '...' : ''), 
        solution: solution.substring(0, 200) + (solution.length > 200 ? '...' : ''),
        compensationText: compensationText.substring(0, 200) + (compensationText.length > 200 ? '...' : ''),
        hasCompensation
      });
      
      // Return simple JSON response instead of streaming since Ollama doesn't stream
      const responseData: any = { 
        content: cleanedResponse, // Keep full response for backward compatibility
        problemSummary,
        solution,
        compensationText,
        hasCompensation,
        role: 'assistant'
      };
      
      // Include compensation data if an issue was detected
      if (analysisResult.issueDetected) {
        responseData.compensationData = analysisResult;
        debugLog('Including compensation data in response', analysisResult);
      }
      
      return new Response(
        JSON.stringify(responseData), 
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json'
          }
        }
      );
      
    } else {
      throw new Error('Only Ollama is supported in current configuration.');
    }
    
  } catch (error) {
    console.error('🧠 Error in smart AI provider chat route:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request with Ollama AI provider',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}