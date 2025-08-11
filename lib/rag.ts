/**
 * DEPRECATED: RAG system disabled for Ollama-only setup.
 * This file uses Google Cloud services which have been removed.
 * This file is kept for reference only.
 */

import { GameResource } from './models';

// All RAG functions are deprecated and disabled
export async function generateEmbeddings(query: string): Promise<number[]> {
  throw new Error('DEPRECATED: RAG system disabled for Ollama-only setup');
}

export async function searchGameResources(
  query: string, 
  gameId: string = 'got',
  threshold: number = 0.8,
  limit: number = 5
): Promise<GameResource[]> {
  console.warn('RAG search disabled - returning empty results');
  return [];
}

export async function enhancePromptWithRAG(
  originalPrompt: string,
  gameId: string = 'got'
): Promise<{ enhancedPrompt: string; resources: GameResource[] }> {
  console.warn('RAG enhancement disabled - returning original prompt');
  return {
    enhancedPrompt: originalPrompt,
    resources: []
  };
}

export function formatResourcesForContext(resources: GameResource[]): string {
  return '';
}