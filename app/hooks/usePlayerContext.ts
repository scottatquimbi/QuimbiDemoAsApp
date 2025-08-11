import { useState, useCallback } from 'react';
import { PlayerContext, PlayerContextProps } from '../types/player';
import { getGameStage } from '@/lib/gameStageUtils';

/**
 * Hook to manage player context state and handlers
 * 
 * @param initialValues - Initial values for player context
 * @returns Player context state and handlers
 */
export function usePlayerContext(initialValues: Partial<PlayerContextProps & { playerId?: string }> = {}) {
  // Extract initial values with defaults
  const {
    initialGameLevel = 24,
    initialPlayerName = 'DragonSlayer582',
    initialPreferredName = 'Sandy',
    initialSessionDays = 37,
    initialVipLevel = 6,
    initialTotalSpend = 489.99,
    initialLikelinessToChurn = 15,
    initialFreeformContext = 'CS Agent Notes: Player reported Guild Shop access issue via in-game ticket #GT-45892. Verified account has Season Pass active.',
    playerId,
  } = initialValues;
  
  // Set up player context state
  const [playerContext, setPlayerContext] = useState<PlayerContext>({
    gameLevel: initialGameLevel,
    playerName: initialPlayerName,
    preferredName: initialPreferredName,
    sessionDays: initialPlayerName === "JonSnow123" ? 1 : 
                 initialPlayerName === "DanyStormborn" ? 27 :
                 initialVipLevel > 0 ? 122 : initialSessionDays,
    vipLevel: initialVipLevel,
    totalSpend: initialTotalSpend,
    likelinessToChurn: initialLikelinessToChurn,
    freeformContext: initialFreeformContext,
    playerId,
  });

  // Get game stage based on player level
  const gameStage = getGameStage(playerContext.gameLevel);

  // Handlers for updating player context
  const handleLevelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newLevel = parseInt(e.target.value, 10);
    setPlayerContext(prev => ({ ...prev, gameLevel: newLevel }));
  }, []);

  const handleVipChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVip = parseInt(e.target.value, 10);
    setPlayerContext(prev => ({ ...prev, vipLevel: newVip }));
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerContext(prev => ({ ...prev, playerName: e.target.value }));
  }, []);

  const handlePreferredNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerContext(prev => ({ ...prev, preferredName: e.target.value }));
  }, []);

  const handleSessionDaysChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newDays = parseInt(e.target.value, 10);
    setPlayerContext(prev => ({ ...prev, sessionDays: newDays }));
  }, []);

  const handleTotalSpendChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpend = parseFloat(e.target.value);
    setPlayerContext(prev => ({ ...prev, totalSpend: newSpend }));
  }, []);

  const handleFreeformContextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPlayerContext(prev => ({ ...prev, freeformContext: e.target.value }));
  }, []);

  const handleLikelinessToChurnChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newChurnRate = parseInt(e.target.value, 10);
    setPlayerContext(prev => ({ ...prev, likelinessToChurn: newChurnRate }));
  }, []);

  // Direct update methods for use in the component
  const updateGameLevel = useCallback((level: number) => {
    setPlayerContext(prev => ({ ...prev, gameLevel: level }));
  }, []);

  const updateVipLevel = useCallback((level: number) => {
    setPlayerContext(prev => ({ ...prev, vipLevel: level }));
  }, []);

  const updatePlayerName = useCallback((name: string) => {
    setPlayerContext(prev => ({ ...prev, playerName: name }));
  }, []);

  const updatePreferredName = useCallback((name: string) => {
    setPlayerContext(prev => ({ ...prev, preferredName: name }));
  }, []);

  const updateSessionDays = useCallback((days: number) => {
    setPlayerContext(prev => ({ ...prev, sessionDays: days }));
  }, []);

  const updateTotalSpend = useCallback((amount: number) => {
    setPlayerContext(prev => ({ ...prev, totalSpend: amount }));
  }, []);

  const updateFreeformContext = useCallback((context: string) => {
    setPlayerContext(prev => ({ ...prev, freeformContext: context }));
  }, []);

  const updateLikelinessToChurn = useCallback((rate: number) => {
    setPlayerContext(prev => ({ ...prev, likelinessToChurn: rate }));
  }, []);

  // Add method to update playerId
  const updatePlayerId = useCallback((id: string) => {
    setPlayerContext(prev => ({ ...prev, playerId: id }));
  }, []);

  return {
    playerContext,
    setPlayerContext,
    gameStage,
    handleLevelChange,
    handleVipChange,
    handleNameChange,
    handlePreferredNameChange,
    handleSessionDaysChange,
    handleTotalSpendChange,
    handleFreeformContextChange,
    handleLikelinessToChurnChange,
    // Include direct update methods
    updateGameLevel,
    updateVipLevel,
    updatePlayerName,
    updatePreferredName,
    updateSessionDays,
    updateTotalSpend,
    updateFreeformContext,
    updateLikelinessToChurn,
    updatePlayerId
  };
} 