'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PlayerContext } from '../types/player';
import ChatInput from './ChatInput';
import PlayerContextForm from './PlayerContextForm';
import CompensationPanel from './CompensationPanel';
import RAGChatHandler from './RAGChatHandler';
import { useChatMessages } from '../hooks/useChatMessages';
import { useCompensation } from '../hooks/useCompensation';

/**
 * Production-only ChatWithContext Component
 * Clean version without any demo dependencies for production use
 */

interface ChatWithContextProductionProps {
  initialGameLevel?: number;
  initialPlayerName?: string;
  initialPreferredName?: string;
  initialSessionDays?: number;
  initialVipLevel?: number;
  initialTotalSpend?: number;
  initialLikelinessToChurn?: number;
  initialFreeformContext?: string;
  gameId?: string;
  showDebugPanel?: boolean;
  forceLiveChat?: boolean;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
  demoInitialMessage?: string;
}

export default function ChatWithContextProduction({
  initialGameLevel = 1,
  initialPlayerName = '',
  initialPreferredName,
  initialSessionDays = 1,
  initialVipLevel = 0,
  initialTotalSpend = 0,
  initialLikelinessToChurn = 0.3,
  initialFreeformContext = '',
  gameId = 'got',
  showDebugPanel = false,
  forceLiveChat = true, // Production always uses live chat
  showSidebar = true,
  onToggleSidebar = () => {},
  demoInitialMessage
}: ChatWithContextProductionProps) {
  
  console.log('🔥 ChatWithContextProduction: Component instantiated with props:', {
    initialPlayerName,
    gameId,
    showSidebar,
    forceLiveChat
  });
  
  // Player context state
  const [playerContext, updatePlayerContext] = useState<PlayerContext>({
    gameLevel: initialGameLevel,
    playerName: initialPlayerName,
    preferredName: initialPreferredName,
    sessionDays: initialSessionDays,
    vipLevel: initialVipLevel,
    totalSpend: initialTotalSpend,
    likelinessToChurn: initialLikelinessToChurn,
    isSpender: initialTotalSpend > 0,
    freeformContext: initialFreeformContext,
    gameId
  });

  // Update player context when props change - but preserve escalated data
  useEffect(() => {
    updatePlayerContext(prev => {
      // If we have escalated data (non-default player context), preserve it
      const hasEscalatedData = prev.playerName && prev.playerName !== '' && prev.gameLevel > 1;
      
      if (hasEscalatedData) {
        console.log('👤 ChatWithContextProduction: Preserving escalated player context, not resetting to initial values');
        return prev; // Keep existing escalated context
      }
      
      // Only update with initial values if we don't have escalated data
      console.log('👤 ChatWithContextProduction: Updating player context with initial values');
      return {
        ...prev,
        gameLevel: initialGameLevel,
        playerName: initialPlayerName,
        preferredName: initialPreferredName,
        sessionDays: initialSessionDays,
        vipLevel: initialVipLevel,
        totalSpend: initialTotalSpend,
        likelinessToChurn: initialLikelinessToChurn,
        isSpender: initialTotalSpend > 0,
        freeformContext: initialFreeformContext,
        gameId
      };
    });
  }, [initialGameLevel, initialPlayerName, initialPreferredName, initialSessionDays, 
      initialVipLevel, initialTotalSpend, initialLikelinessToChurn, initialFreeformContext, gameId]);

  // Compensation hook for legacy compatibility
  const compensationHook = useCompensation(
    playerContext,
    null,
    null,
    false,
    0,
    0,
    []
  );

  console.log('🔍 Raw compensation data sources:', {
    processedCompensationData: !!compensationHook.processedCompensationData,
    rawCompensationData: !!compensationHook.rawCompensationData
  });

  if (!compensationHook.processedCompensationData) {
    console.log('❌ No AI compensation decision made yet - panel will not appear');
    console.log('❌ Reason: rawData exists?', !!compensationHook.rawCompensationData, 'issueDetected?', compensationHook.rawCompensationData?.issueDetected);
  }

  console.log('🔥 ChatWithContextProduction: About to render, playerContext:', {
    playerName: playerContext.playerName,
    gameLevel: playerContext.gameLevel,
    vipLevel: playerContext.vipLevel
  });

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar */}
      {showSidebar && (
        <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
          {/* Player Context Form */}
          <div className="flex-1 overflow-y-auto p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Player Context</h2>
            <PlayerContextForm
              playerContext={playerContext}
              onUpdatePlayerName={(name) => updatePlayerContext({...playerContext, playerName: name})}
              onUpdateGameLevel={(level) => updatePlayerContext({...playerContext, gameLevel: level})}
              onUpdateVipLevel={(level) => updatePlayerContext({...playerContext, vipLevel: level})}
              onUpdateTotalSpend={(amount) => updatePlayerContext({...playerContext, totalSpend: amount})}
              onUpdateFreeformContext={(context) => updatePlayerContext({...playerContext, freeformContext: context})}
              onUpdateLikelinessToChurn={(rate) => updatePlayerContext({...playerContext, likelinessToChurn: rate})}
            />
          </div>

          {/* Legacy Compensation Panel for sidebar display */}
          {compensationHook.processedCompensationData && (
            <div className="border-t border-gray-200 p-4 bg-white">
              <CompensationPanel
                recommendation={compensationHook.processedCompensationData.compensation}
                issue={compensationHook.processedCompensationData.issue}
                sentiment={compensationHook.processedCompensationData.sentiment}
                playerContext={playerContext}
                onRequestCompensation={(requestId, status) => console.log('Request compensation:', requestId, status)}
                onDismiss={compensationHook.dismissCompensation}
              />
            </div>
          )}
        </div>
      )}

      {/* Main Chat Area - Use RAGChatHandler for three-part response support */}
      <div className="flex-1 flex flex-col">
        {(() => {
          console.log('🔥 ChatWithContextProduction: About to render RAGChatHandler with playerContext:', playerContext);
          return null;
        })()}
        <RAGChatHandler
          playerContext={playerContext}
          gameId={gameId}
          onCompensationData={(data) => {
            console.log('💰 Compensation data received in production:', data);
            // Handle compensation data if needed
          }}
          onPlayerContextUpdate={(updatedContext) => {
            console.log('👤 ChatWithContextProduction: Updating player context from escalated analysis:', updatedContext);
            console.log('👤 ChatWithContextProduction: Current playerContext before update:', playerContext);
            updatePlayerContext(updatedContext);
            console.log('👤 ChatWithContextProduction: updatePlayerContext called, should trigger re-render');
          }}
        />
      </div>

      {/* Debug Panel (if enabled) */}
      {showDebugPanel && (
        <div className="w-80 border-l border-gray-200 p-4 bg-gray-50 text-xs overflow-y-auto">
          <h3 className="font-semibold mb-2">Debug Info</h3>
          <div className="space-y-2">
            <div>
              <strong>Mode:</strong> Production
            </div>
            <div>
              <strong>Player Level:</strong> {playerContext.gameLevel}
            </div>
            <div>
              <strong>VIP Level:</strong> {playerContext.vipLevel}
            </div>
            <div>
              <strong>Compensation:</strong> {compensationHook.processedCompensationData ? 'Active' : 'None'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}