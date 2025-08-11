import { enhancePromptWithRAG } from '@/lib/rag';
import { getEnhancedSystemPrompt } from '@/lib/enhance-chat';
import { analyzePlayerMessage } from '@/lib/compensation-local';
import { generateChatText, checkOllamaHealth, OLLAMA_MODELS } from '@/lib/ollama';
import { Message } from 'ai';

export const maxDuration = 60;

// Debug flag - set to true to enable debug logging
const DEBUG_MODE = true;

/**
 * Logs debug information if debug mode is enabled
 */
function debugLog(label: string, data: any) {
  if (DEBUG_MODE) {
    console.log(`----- 🦙 LOCAL DEBUG: ${label} -----`);
    console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    console.log(`----- END 🦙 LOCAL DEBUG: ${label} -----\n`);
  }
}


export async function POST(req: Request) {
  try {
    debugLog('Request received', 'Starting Ollama local chat processing...');
    
    // Check if Ollama is available
    const ollamaHealthy = await checkOllamaHealth();
    if (!ollamaHealthy) {
      return new Response(
        JSON.stringify({ 
          error: 'Ollama service is not available. Please ensure Ollama is running on http://127.0.0.1:11434' 
        }), 
        { 
          status: 503, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    const { messages, system: userProvidedSystem, gameId, playerContext, message } = await req.json();
    
    // Handle warmup requests - quick model loading
    if (message === 'warmup' || (messages && messages.length === 1 && messages[0].content === 'warmup')) {
      debugLog('Warmup request', 'Performing model warmup...');
      try {
        await generateChatText('Ready', { 
          maxTokens: 10,
          temperature: 0.1 
        });
        return new Response(
          JSON.stringify({ 
            status: 'success', 
            message: 'Model warmed up successfully',
            model: OLLAMA_MODELS.MAIN_CHAT
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
            message: 'Warmup failed',
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
    const lastUserMessage = messages?.findLast((msg: any) => msg.role === 'user')?.content || message || '';
    debugLog('Last user message', lastUserMessage);
    
    // Enhance the prompt with RAG if it's a user message
    const { enhancedPrompt, resources } = await enhancePromptWithRAG(lastUserMessage, gameId);
    
    // Debug log the RAG resources
    debugLog('RAG Resources', resources);
    
    // Create a new messages array with the enhanced prompt
    const enhancedMessages = [...messages] as Message[];
    if (enhancedMessages.length > 0 && enhancedMessages[enhancedMessages.length - 1].role === 'user') {
      enhancedMessages[enhancedMessages.length - 1].content = enhancedPrompt;
    }

    // Get player level from context or default to level 1
    const gameLevel = playerContext?.gameLevel || 1;
    
    // Generate an enhanced system prompt based on the player's level and question
    let enhancedSystem = playerContext 
      ? getEnhancedSystemPrompt(lastUserMessage, gameLevel, {
          playerName: playerContext.playerName,
          vipLevel: playerContext.vipLevel,
          isSpender: playerContext.isSpender
        })
      : userProvidedSystem;
    
    // Analyze the player's message for potential issues requiring compensation using Ollama
    const analysisResult = playerContext 
      ? await analyzePlayerMessage(lastUserMessage, playerContext)
      : { issueDetected: false };
    
    // Debug log the compensation analysis
    debugLog('Ollama Compensation Analysis', analysisResult);
    
    // Add compensation information to system prompt if an issue was detected
    if (analysisResult.issueDetected) {
      const hasCompensation = (analysisResult.compensation?.suggestedCompensation?.gold || 0) > 0 || 
                             Object.keys(analysisResult.compensation?.suggestedCompensation?.resources || {}).length > 0;
      
      const compensationInfo = !hasCompensation
        ? `I've reviewed the player's claim but could not approve compensation because: ${analysisResult.compensation?.reasoning || 'the issue could not be verified'}. Please acknowledge this in your response by apologizing and explaining why compensation is not possible. Be empathetic but firm.`
        : `I've detected an issue and have prepared a compensation package for the player (${analysisResult.issue?.description || 'reported issue'}). Please acknowledge this in your response by mentioning that compensation is available. The player can claim: ${analysisResult.compensation?.suggestedCompensation?.gold ? analysisResult.compensation.suggestedCompensation.gold + ' gold' : ''} ${Object.keys(analysisResult.compensation?.suggestedCompensation?.resources || {}).length > 0 ? 'and resources' : ''}.`;
      
      enhancedSystem = `${enhancedSystem}\n\n${compensationInfo}`;
      debugLog('Enhanced System Prompt with Compensation', enhancedSystem);
    }
    
    // Use the enhanced system prompt or fall back to user-provided one
    const system = enhancedSystem || userProvidedSystem;
    
    // Debug log the system prompt being used
    debugLog('System Prompt', system);
    
    // Debug log the enhanced user message with RAG content
    debugLog('Enhanced User Message', enhancedPrompt);
    
    // Build the conversation context for Ollama
    let conversationContext = '';
    
    // Add system prompt if available
    if (system) {
      conversationContext += `System: ${system}\n\n`;
    }
    
    // Add conversation history
    enhancedMessages.forEach((msg, index) => {
      const role = msg.role === 'user' ? 'Human' : 'Assistant';
      conversationContext += `${role}: ${msg.content}\n\n`;
    });
    
    // Add a final prompt for the assistant to respond
    conversationContext += 'Assistant: ';
    
    debugLog('Full Conversation Context', conversationContext);
    
    debugLog('Generating response with Ollama', `Using model: ${OLLAMA_MODELS.MAIN_CHAT}`);
    
    // Generate response using Ollama
    const response = await generateChatText(conversationContext, {
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
    
    // Return simple JSON response instead of streaming since Ollama doesn't stream
    return new Response(
      JSON.stringify({ 
        content: cleanedResponse,
        role: 'assistant'
      }), 
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json'
        }
      }
    );
    
  } catch (error) {
    console.error('🦙 Error in Ollama chat route:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request with Ollama',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Try the regular /api/chat endpoint or ensure Ollama is running properly'
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}