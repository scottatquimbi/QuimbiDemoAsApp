import { useState, useEffect } from 'react';
import { ExternalSources } from '../types/externalSources';
import { PlayerContext } from '../types/player';
import { getExternalSourcesContent } from '../utils/externalSources';

/**
 * Hook to manage external sources content (Discord, Reddit, etc.)
 */
export function useExternalSources(
  playerContext: PlayerContext,
  gameId?: string
) {
  // State for external sources content
  const [externalSourcesContent, setExternalSourcesContent] = useState<ExternalSources | null>(null);
  const [isLoadingExternalContent, setIsLoadingExternalContent] = useState<boolean>(false);
  const [externalContentError, setExternalContentError] = useState<string | null>(null);

  /**
   * Fetch external sources content
   */
  const fetchExternalSourcesContent = async () => {
    if (!gameId) {
      console.log('No gameId provided, skipping external sources content fetch');
      return;
    }

    try {
      setIsLoadingExternalContent(true);
      setExternalContentError(null);
      
      console.log('Fetching external sources content for gameId:', gameId);
      const content = await getExternalSourcesContent(gameId);
      
      console.log('External sources content received:', content);
      setExternalSourcesContent(content);
    } catch (error) {
      console.error('Error fetching external sources content:', error);
      setExternalContentError(error instanceof Error ? error.message : 'Unknown error fetching external content');
    } finally {
      setIsLoadingExternalContent(false);
    }
  };

  /**
   * Fetch external content on mount or when gameId changes
   */
  useEffect(() => {
    if (gameId) {
      fetchExternalSourcesContent();
    }
  }, [gameId]);

  return {
    externalSourcesContent,
    isLoadingExternalContent,
    externalContentError,
    fetchExternalSourcesContent,
    setExternalSourcesContent
  };
} 