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
  onToggleSidebar = () => {}
}: ChatWithContextProductionProps) {
  
  // Player context state
  const [playerContext, updatePlayerContext] = useState<PlayerContext>({
    gameLevel: initialGameLevel,
    playerName: initialPlayerName,
    preferredName: initialPreferredName,
    sessionDays: initialSessionDays,
    vipLevel: initialVipLevel,
    totalSpend: initialTotalSpend,
    freeformContext: initialFreeformContext,
    likelinessToChurn: initialLikelinessToChurn,
    gameId: gameId,
    isSpender: initialTotalSpend > 0
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize compensation hook
  const compensationHook = useCompensation(
    playerContext,
    null, // streamData
    null, // data
    false, // isResponseStreaming
    0, // currentMessageIndex
    0  // messageQueueLength
  );

  // Initialize chat messages hook for production (no demo messages)
  const chatHook = useChatMessages(
    playerContext,
    gameId, // gameId
    undefined, // demoMessages
    undefined, // demoInitialMessage
    (compensationData: any) => compensationHook.setRawCompensationData(compensationData), // onCompensationData
    undefined, // demoPlayerMessages
    undefined, // demoAgentMessages
    true // forceLiveChat
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHook.displayedMessages]);

  // Handle form submission
  const handleFormSubmit = (updatedContext: PlayerContext) => {
    updatePlayerContext(updatedContext);
  };

  // Handle message sending
  const handleSendMessage = (message: string) => {
    // Set the input value and submit
    chatHook.setInputValue(message);
    chatHook.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

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

          {/* Compensation Panel */}
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatHook.displayedMessages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-lg">Welcome to Game Support!</p>
              <p className="text-sm mt-2">
                Start a conversation by typing your question or issue below.
              </p>
            </div>
          ) : (
            chatHook.displayedMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <div className="prose prose-sm max-w-none">
                    {message.content}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {/* Loading indicator */}
          {chatHook.isResponseStreaming && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span className="text-gray-600">Quimbi is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="border-t border-gray-200 p-4">
          <ChatInput
            onSendMessage={handleSendMessage}
            isResponseStreaming={chatHook.isResponseStreaming}
            waitingForResponse={chatHook.waitingForResponse}
            placeholder="Type your message here..."
            value={chatHook.inputValue}
            onChange={(e) => chatHook.setInputValue(e.target.value)}
          />
        </div>
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
              <strong>Messages:</strong> {chatHook.displayedMessages.length}
            </div>
            <div>
              <strong>Streaming:</strong> {chatHook.isResponseStreaming ? 'Yes' : 'No'}
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