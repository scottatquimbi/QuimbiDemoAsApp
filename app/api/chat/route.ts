/**
 * DEPRECATED: This chat route uses Gemini models which have been removed.
 * Use /api/chat-smart or /api/chat-local instead for Ollama-based chat.
 * This file is kept for reference only.
 */

import { getEnhancedSystemPrompt } from '@/lib/enhance-chat';
import { Message, createDataStreamResponse } from 'ai';

export const maxDuration = 60;

// Debug flag - set to true to enable debug logging
const DEBUG_MODE = true;

/**
 * Logs debug information if debug mode is enabled
 */
function debugLog(label: string, data: any) {
  console.log(`----- DEPRECATED DEBUG: ${label} -----`);
  console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  console.log(`----- END DEPRECATED DEBUG: ${label} -----\n`);
}

export async function POST(req: Request) {
  return new Response(
    JSON.stringify({ 
      error: 'DEPRECATED: This chat endpoint is no longer supported',
      message: 'Gemini dependencies have been removed. Use /api/chat-smart or /api/chat-local instead.',
      alternatives: [
        '/api/chat-smart - Ollama with health checking',
        '/api/chat-local - Direct Ollama endpoint'
      ]
    }), 
    { 
      status: 410, // Gone
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}