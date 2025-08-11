'use client';

import { useCallback, useEffect, useState } from 'react';
import { Message } from 'ai';
import CompensationPanel from './CompensationPanel';
import { ChatWithContextProps, PlayerContext } from '../types/player';
import { KnownIssueContent } from '../types/externalSources';
import { usePlayerContext } from '../hooks/usePlayerContext';
import { useCompensation } from '../hooks/useCompensation';
import { useChatMessages } from '../hooks/useChatMessages';
import { useExternalSources } from '../hooks/useExternalSources';
import { useChatLayout } from '../hooks/useChatLayout';
import { v4 as uuidv4 } from 'uuid';
import { DiscordMessage, RedditComment } from '../types/externalSources';
import { IssueDetectionResult, SentimentAnalysisResult, CompensationRecommendation } from '../types/compensation';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import PlayerContextSidebar from './PlayerContextSidebar';
import ExternalContentAccordion from './ExternalContentAccordion';
import KnownIssueCard from './KnownIssueCard';
import TicketHistory from './TicketHistory';
import DiscordMessages from './DiscordMessages';
import RedditComments from './RedditComments';
import RAGChatHandler from './RAGChatHandler';

// Add this outside the component
const ARTICLE_CONTENT = {
  'new-player': {
    title: "KNOWN ISSUE: Tutorial Crash During Keep Upgrade",
    content: (
      <>
        <p>Following the 3.8 update, some new players are experiencing crashes during the tutorial when upgrading their keep to level 2. This primarily affects lower-end devices and appears to be related to a memory leak in the new particle effects.</p>
        <p><strong>Affected:</strong> Approximately 3% of new players</p>
        <p><strong>Workaround:</strong> Clear app cache and set Graphics Quality to Low in Settings</p>
        <p><strong>Expected resolution:</strong> Hotfix scheduled for deployment within 12 hours</p>
      </>
    )
  },
  'tutorial_crash': {
    title: "KNOWN ISSUE: Tutorial Crash During Keep Upgrade",
    content: (
      <>
        <p>Following the 3.8 update, some new players are experiencing crashes during the tutorial when upgrading their keep to level 2. This primarily affects lower-end devices and appears to be related to a memory leak in the new particle effects.</p>
        <p><strong>Affected:</strong> Approximately 3% of new players</p>
        <p><strong>Workaround:</strong> Clear app cache and set Graphics Quality to Low in Settings</p>
        <p><strong>Expected resolution:</strong> Hotfix scheduled for deployment within 12 hours</p>
      </>
    )
  },
  'mid-tier': {
    title: "KNOWN ISSUE: Alliance Event Reward Distribution Failure",
    content: (
      <>
        <p>Following yesterday's Alliance Event, some players are reporting missing reward distribution. This primarily affects players who completed all event tiers in the final hours before the event ended.</p>
        <p><strong>Affected:</strong> Approximately 8% of event participants</p>
        <p><strong>Workaround:</strong> None available. Affected players will be compensated automatically</p>
        <p><strong>Expected resolution:</strong> All missing rewards will be distributed within 24 hours with 20% bonus</p>
      </>
    )
  },
  'alliance_event': {
    title: "KNOWN ISSUE: Alliance Event Reward Distribution Failure",
    content: (
      <>
        <p>Following yesterday's Alliance Event, some players are reporting missing reward distribution. This primarily affects players who completed all event tiers in the final hours before the event ended.</p>
        <p><strong>Affected:</strong> Approximately 8% of event participants</p>
        <p><strong>Workaround:</strong> None available. Affected players will be compensated automatically</p>
        <p><strong>Expected resolution:</strong> All missing rewards will be distributed within 24 hours with 20% bonus</p>
      </>
    )
  },
  'high-spender': {
    title: "KNOWN ISSUE: Account Access After Device Change",
    content: (
      <>
        <p>Following our security update, some players are experiencing account access issues when changing devices. This primarily affects players who have recently changed their device or installed the game on a new phone.</p>
        <p><strong>Affected:</strong> Approximately 5% of players on new devices</p>
        <p><strong>Workaround:</strong> Use the web portal at dragonrealms.com/recover with your purchase receipt</p>
        <p><strong>Expected resolution:</strong> Emergency patch being deployed within the next hour</p>
      </>
    )
  },
  'account_access': {
    title: "KNOWN ISSUE: Account Access After Device Change",
    content: (
      <>
        <p>Following our security update, some players are experiencing account access issues when changing devices. This primarily affects players who have recently changed their device or installed the game on a new phone.</p>
        <p><strong>Affected:</strong> Approximately 5% of players on new devices</p>
        <p><strong>Workaround:</strong> Use the web portal at dragonrealms.com/recover with your purchase receipt</p>
        <p><strong>Expected resolution:</strong> Emergency patch being deployed within the next hour</p>
      </>
    )
  },
  'guild_shop': {
    title: "KNOWN ISSUE: Guild Shop Access Bug",
    content: (
      <>
        <p>Following the 3.8 update, some players are experiencing an issue where the Guild Shop becomes inaccessible. This primarily affects accounts with pending guild shop purchases or season pass holders.</p>
        <p><strong>Affected:</strong> Approximately 18% of players</p>
        <p><strong>Workaround:</strong> Clear app cache, ensure game is updated to version 3.8.2</p>
        <p><strong>Expected resolution:</strong> Patch scheduled for deployment within 24 hours</p>
      </>
    )
  }
} as const;

type ScenarioKey = keyof typeof ARTICLE_CONTENT;

/**
 * Main component for chat with player context
 */
export default function ChatWithContext({
  initialGameLevel = 1,
  initialPlayerName = 'Player',
  initialPreferredName,
  initialSessionDays = 3,
  initialVipLevel = 0,
  initialTotalSpend = 0,
  initialFreeformContext = '',
  initialLikelinessToChurn = 15,
  gameId = 'got',
  showDebugPanel = false,
  demoInitialMessage,
  demoMessages,
  demoPlayerMessages,
  demoAgentMessages,
  forceLiveChat = false,
  showSidebar = true,
  onToggleSidebar = () => {}
}: ChatWithContextProps) {
  // Player context hook
  const [playerContext, updatePlayerContext] = useState<PlayerContext>({
    gameLevel: initialGameLevel,
    playerName: initialPlayerName,
    preferredName: initialPreferredName,
    // VIP users (vipLevel > 0) get 122 session days instead of the default 3
    // JonSnow123 (tutorial crash scenario) gets 1 session day
    // DanyStormborn (deceptive reward scenario) gets 27 session days
    sessionDays: initialPlayerName === "JonSnow123" ? 1 : 
                 initialPlayerName === "DanyStormborn" ? 27 :
                 initialVipLevel > 0 ? 122 : initialSessionDays,
    vipLevel: initialVipLevel,
    totalSpend: initialTotalSpend,
    freeformContext: initialFreeformContext,
    likelinessToChurn: initialLikelinessToChurn
  });
  
  // Define update functions for player context
  const updatePlayerId = useCallback((id: string) => {
    updatePlayerContext(prev => ({ ...prev, playerId: id }));
  }, []);

  const updatePlayerName = useCallback((name: string) => {
    updatePlayerContext(prev => ({ ...prev, playerName: name }));
  }, []);

  const updateGameLevel = useCallback((level: number) => {
    updatePlayerContext(prev => ({ ...prev, gameLevel: level }));
  }, []);

  const updateVipLevel = useCallback((level: number) => {
    updatePlayerContext(prev => ({ ...prev, vipLevel: level }));
  }, []);

  const updateTotalSpend = useCallback((amount: number) => {
    updatePlayerContext(prev => ({ ...prev, totalSpend: amount }));
  }, []);

  const updateFreeformContext = useCallback((context: string) => {
    updatePlayerContext(prev => ({ ...prev, freeformContext: context }));
  }, []);

  const updateLikelinessToChurn = useCallback((rate: number) => {
    updatePlayerContext(prev => ({ ...prev, likelinessToChurn: rate }));
  }, []);
  
  // Set a game stage for theming/personalization
  const [gameStage, setGameStage] = useState<string | null>(null);
  
  // Once player context is initialized, set the game stage
  useEffect(() => {
    // Simple algorithm based on level
    const level = playerContext.gameLevel;
    if (level < 5) {
      setGameStage('new-player');
    } else if (level < 15) {
      setGameStage('mid-tier');
    } else {
      setGameStage('high-spender');
    }
    
    // Special scenarios for specific player names
    if (playerContext.playerName === "JonSnow123") {
      setGameStage('tutorial_crash');
    } else if (playerContext.playerName === "DanyStormborn") {
      setGameStage('alliance_event');
    } else if (playerContext.playerName === "LannisterGold") {
      setGameStage('account_access');
    }
  }, [playerContext.gameLevel, playerContext.playerName]);
  
  // Set up UID for player if not present
  useEffect(() => {
    // If no playerId is set, generate one
    if (!playerContext.playerId) {
      updatePlayerId(uuidv4());
    }
  }, [playerContext, updatePlayerId]);
  
  // Chat messages hook will be initialized after external content is prepared
  
  // External sources hook
  const externalSources = useExternalSources(playerContext, gameId);
  
  const {
    externalSourcesContent,
    isLoadingExternalContent,
    externalContentError,
    fetchExternalSourcesContent,
    setExternalSourcesContent
  } = externalSources;
  
  // Define isDemoMode before using it in the useEffect
  const isDemoMode = (!!demoMessages && demoMessages.length > 0) || 
                    (!!demoPlayerMessages && demoPlayerMessages.length > 0 && 
                     !!demoAgentMessages && demoAgentMessages.length > 0);
  
  // When in demo mode, automatically load the external content based on game stage
  useEffect(() => {
    if (isDemoMode && gameStage) {
      console.log('Demo mode detected, loading external content for game stage:', gameStage);
      // Import the function directly here to avoid circular dependencies
      import('../utils/externalSources').then(({ getExternalSourcesContent }) => {
        // Get the external content for the demo scenario
        const demoExternalContent = getExternalSourcesContent(gameStage);
        console.log('Demo external content loaded:', demoExternalContent);
        
        // Set the external content
        setExternalSourcesContent(demoExternalContent);
      });
    }
  }, [isDemoMode, gameStage, setExternalSourcesContent]);
  
  // Hooks and variable assignments will be moved after chat messages hook initialization
  
  // Add a flag to track if the final message has been displayed
  const [finalMessageDisplayed, setFinalMessageDisplayed] = useState(false);
  
  // Helper functions
  const getKnownIssueContent = useCallback((): KnownIssueContent | null => {
    if (!gameStage) return null;
    
    switch (gameStage) {
      case 'new-player':
        return ARTICLE_CONTENT['new-player'];
      case 'mid-tier':
        return ARTICLE_CONTENT['mid-tier'];
      case 'high-spender':
        return ARTICLE_CONTENT['high-spender'];
      default:
        // Look for keyword-based content
        const context = playerContext.freeformContext?.toLowerCase() || '';
        
        if (context.includes('tutorial') && context.includes('crash')) {
          return ARTICLE_CONTENT['tutorial_crash'];
        }
        if (context.includes('alliance') && context.includes('event')) {
          return ARTICLE_CONTENT['alliance_event'];
        }
        if (context.includes('account') && context.includes('access')) {
          return ARTICLE_CONTENT['account_access'];
        }
        if (context.includes('guild') && context.includes('shop')) {
          return ARTICLE_CONTENT['guild_shop'];
        }
        
        return null;
    }
  }, [gameStage, playerContext.freeformContext]);

  // Helper functions will be moved after chat messages hook initialization
  
  // Compensation handlers will be moved after all dependencies are defined

  // Determine which known issue content to show
  const knownIssueContent = getKnownIssueContent();
  
  // Convert the known issue content to the format expected by KnownIssueCard
  const knownIssueCardContent = knownIssueContent
    ? {
        title: knownIssueContent.title,
        content: knownIssueContent.content
      }
    : null;
  
  // Prepare external content for the components
  const transformedExternalContent = externalSourcesContent
    ? {
        discordMessages: externalSourcesContent.discord?.messages || [],
        redditComments: externalSourcesContent.reddit?.comments || [],
        knownIssue: knownIssueCardContent || (externalSourcesContent.articleTitle && externalSourcesContent.articleContent
          ? {
              title: externalSourcesContent.articleTitle,
              content: externalSourcesContent.articleContent
            }
          : null)
      }
    : null;
  
  // Chat messages hook - now with transformed external content
  const chatMessages = useChatMessages(
    playerContext,
    gameId,
    demoMessages,
    demoInitialMessage,
    (compensationData) => compensationHook.setRawCompensationData(compensationData),
    demoPlayerMessages,
    demoAgentMessages,
    forceLiveChat,
    transformedExternalContent
  );

  // Extract relevant states from the chat messages hook
  const {
    displayedMessages,
    messageQueue,
    currentMessageIndex,
    waitingForResponse,
    isGeminiGenerating,
    isResponseStreaming,
    shouldScrollToBottom,
    demoCompleted,
    showFinalMetrics,
    sentMessageIndices,
    input,
    inputValue,
    inputRef,
    apiMessages,
    isLoading,
    error,
    data,
    streamData,
    isUserTyping,
    setInputValue,
    handleInputChange,
    handleSubmit,
    sendDemoMessage,
    sendDemoAgentResponse,
    resetChat,
    setDisplayedMessages,
    setApiMessages,
    setWaitingForResponse,
    setShouldScrollToBottom
  } = chatMessages;
  
  // Layout hook with external sidebar control - now after chat messages are defined
  const layout = useChatLayout(displayedMessages, shouldScrollToBottom, showSidebar);
  
  // Use externally provided sidebar state if available
  const {
    showSidebar: internalShowSidebar,
    showExternalContent,
    showControls,
    isMobileLayout,
    scrollAreaRef,
    formRef,
    toggleSidebar: internalToggleSidebar,
    toggleExternalContent,
    toggleControls
  } = layout;
  
  // Use the sidebar state and toggle function from props if provided
  const actualShowSidebar = showSidebar !== undefined ? showSidebar : internalShowSidebar;
  const actualToggleSidebar = onToggleSidebar || internalToggleSidebar;
  
  // Compensation hook - now after all required variables are defined
  const compensationHook = useCompensation(
    playerContext,
    streamData,
    data,
    isResponseStreaming,
    currentMessageIndex,
    messageQueue.length,
    displayedMessages
  );
  
  const {
    compensationState,
    processedCompensationData,
    streamCompensationData,
    rawCompensationData,
    setRawCompensationData,
    requestCompensation,
    dismissCompensation,
    processStreamData,
    testCompensation,
    // New approval workflow
    interceptAiResponse,
    approveCompensationAndSend,
    rejectCompensation,
    awaitingApproval,
    pendingAiResponse
  } = compensationHook;
  
  // Helper to display the final thank you message - now after all dependencies are defined
  const displayFinalThankYouMessage = useCallback(() => {
    // Prevent duplicate calls
    if (finalMessageDisplayed) {
      console.log('Final thank you message already displayed, skipping duplicate');
      
      // If metrics aren't shown yet, show them now
      if (!showFinalMetrics) {
        // Use a shorter timeout since this is a retry
        setTimeout(() => {
          // Use the no-op function since we simplified the hook
          console.log('Showing metrics card (retry)');
        }, 200);
      }
      return;
    }
    
    // Mark that we've displayed the final message
    setFinalMessageDisplayed(true);
    
    // Show metrics after a short delay
    setTimeout(() => {
      console.log('Showing metrics card');
    }, 300);
    
  }, [
    finalMessageDisplayed,
    showFinalMetrics
  ]);
  
  // Override the compensation handlers to ensure they display the final message
  const handleRequestCompensation = useCallback((requestId: string, status: string) => {
    // Prevent duplicate callbacks if final message is already displayed
    if (finalMessageDisplayed) {
      console.log('Final message already displayed, not calling compensation handlers again');
      return;
    }
    
    // Call the original handler
    requestCompensation(requestId, status);
    
    // Show the metrics card after a short delay
    setTimeout(() => {
      displayFinalThankYouMessage();
    }, 300);
  }, [requestCompensation, displayFinalThankYouMessage, finalMessageDisplayed]);
  
  const handleDismissCompensation = useCallback(() => {
    // Prevent duplicate callbacks if final message is already displayed
    if (finalMessageDisplayed) {
      console.log('Final message already displayed, not calling compensation handlers again');
      return;
    }
    
    // Call the original handler
    dismissCompensation();
    
    // Show the metrics card after a short delay
    setTimeout(() => {
      displayFinalThankYouMessage();
    }, 300);
  }, [dismissCompensation, displayFinalThankYouMessage, finalMessageDisplayed]);
  
  // Handle sending a user message
  const handleSendMessage = (message: string) => {
    // Basic validation
    if (!message || !message.trim()) {
      console.log('Empty message, not sending');
      return;
    }
    
    // Debug logging
    console.log('ChatWithContext: handleSendMessage called with:', message);
    
    // Check if we're already processing a message
    if (isGeminiGenerating || waitingForResponse || isResponseStreaming) {
      console.log('AI is already responding, ignoring message');
      return;
    }

    // Determine if we're in demo mode
    const isDemoMode = (!!demoMessages && demoMessages.length > 0) || 
                     (!!demoPlayerMessages && demoPlayerMessages.length > 0 && 
                      !!demoAgentMessages && demoAgentMessages.length > 0);
    
    // Check if in demo mode and this is an agent response
    if (isDemoMode && !forceLiveChat) {
      console.log('In demo mode, checking if this is an agent response');
      
      // If we have agent responses and this message matches the current agent response
      if (chatMessages.agentResponseQueue && 
          chatMessages.agentResponseQueue.length > chatMessages.currentMessageIndex && 
          chatMessages.agentResponseQueue[chatMessages.currentMessageIndex] === message) {
        
        console.log('This is an agent response in demo mode, using sendDemoAgentResponse');
        
        // Use the proper function to send it as an agent response
        sendDemoAgentResponse();
        
        // Clear input field
        setInputValue('');
        
        return;
      }
    }
    
    try {
      // Create a unique ID for this message
      const messageId = `user-${Date.now()}`;
      
      // Create the user message
      const userMessage = {
        id: messageId,
        content: message,
        role: 'user' as const
      };
      
      console.log('Adding message to API messages:', userMessage);
      
      // Store the message first in apiMessages to trigger the API request
      // This is what will actually call the API
      setApiMessages((prev: Message[]) => {
        // Check if this exact message is already in the array to prevent duplicates
        if (prev.some(m => m.content === message && m.role === 'user')) {
          console.log('Message already exists in apiMessages, not adding duplicate');
          return prev;
        }
        return [...prev, userMessage];
      });
      
      // Clear input field
      setInputValue('');
      
      // Set waiting flags
      setWaitingForResponse();
      setShouldScrollToBottom();
      
      // Debug
      console.log('Message submission complete - API call triggered');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };
  
  // Set fixed likeliness to churn values based on game stage
  useEffect(() => {
    if (gameStage) {
      let churnRate;
      switch (gameStage) {
        case 'new-player':
          churnRate = 28; // Higher churn for new players (red zone)
          break;
        case 'mid-tier':
          churnRate = 18; // Medium churn for mid-tier players (yellow zone)
          break;
        case 'high-spender':
          churnRate = 9; // Lower churn for high-spenders (green zone)
          break;
        default:
          // Check player context for specific scenarios
          if (playerContext.playerName === "JonSnow123") {
            churnRate = 83; // Very high churn risk for tutorial crash scenario (red zone)
          } else if (playerContext.playerName === "DanyStormborn") {
            churnRate = 16; // Yellow zone
          } else if (playerContext.playerName === "LannisterGold") {
            churnRate = 8; // Green zone (VIP)
          } else {
            churnRate = 15; // Default value (yellow zone)
          }
      }
      
      // Update the likeliness to churn if it's different from current value
      if (playerContext.likelinessToChurn !== churnRate) {
        updateLikelinessToChurn(churnRate);
      }
    }
  }, [gameStage, playerContext.playerName, playerContext.likelinessToChurn, updateLikelinessToChurn]);
  
  // State management for chat
  const [localChatMessages, setLocalChatMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string>('Legend League');
  const [inputMessage, setInputMessage] = useState('');
  const [typingIndicator, setTypingIndicator] = useState('');
  const [typingSpeed, setTypingSpeed] = useState(30); // ms per character
  
  // Ticket history state
  const [showTicketHistory, setShowTicketHistory] = useState(false);
  const [actionPromptShown, setActionPromptShown] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  
  // Refresh demo function
  const handleRefreshDemo = useCallback(() => {
    console.log('🔄 Refreshing demo - reloading page');
    window.location.reload();
  }, []);
  
  /* eslint-disable react-hooks/exhaustive-deps */
  
  // Render the component
  return (
      <div className="flex flex-col h-full bg-white overflow-hidden font-inter">
      {/* Main content area with sidebar and chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar with player context */}
        {actualShowSidebar && (
          <PlayerContextSidebar 
            playerContext={playerContext}
            onUpdatePlayerName={updatePlayerName}
            onUpdateGameLevel={updateGameLevel}
            onUpdateVipLevel={updateVipLevel}
            onUpdateTotalSpend={updateTotalSpend}
            onUpdateFreeformContext={updateFreeformContext}
            onUpdateLikelinessToChurn={updateLikelinessToChurn}
            externalContent={transformedExternalContent}
            isLoadingExternalContent={isLoadingExternalContent}
            onRefreshDemo={handleRefreshDemo}
          />
        )}
        
        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* External content accordion */}
          {showExternalContent && (
            <ExternalContentAccordion 
              externalContent={transformedExternalContent}
              isLoading={isLoadingExternalContent}
            />
          )}
          
          {/* Ticket History for AI Context */}
          <div className="px-4 py-2">
            <TicketHistory 
              playerId='lannister-gold'
              isExpanded={showTicketHistory}
              onToggle={() => setShowTicketHistory(!showTicketHistory)}
            />
          </div>
          
          {/* Use the RAGChatHandler for live chat or the existing code for demo mode */}
          {forceLiveChat ? (
            <RAGChatHandler 
              playerContext={playerContext}
              gameId={gameId}
              onCompensationData={(compensationData) => compensationHook.setRawCompensationData(compensationData)}
            />
          ) : (
            <>
              {/* Messages area */}
              <div ref={scrollAreaRef} className="flex-1 overflow-y-auto bg-slate-50">
                <MessageList 
                  messages={displayedMessages}
                  isResponseStreaming={isResponseStreaming}
                />
                
                {/* Demo completion message */}
                {demoCompleted && showFinalMetrics && (
                  <div className="mx-auto max-w-2xl bg-emerald-50 border border-emerald-200 rounded-lg p-6 text-center my-6">
                    <h3 className="text-xl font-semibold text-emerald-800 mb-3">Demo Completed</h3>
                    <p className="text-emerald-700">Successfully resolved issue for {playerContext.playerName}</p>
                    
                    {/* Divider to clearly separate content */}
                    <hr className="my-3 border-green-200" />
                    
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      {playerContext.playerName === "JonSnow123" && (
                        <>
                          <div className="bg-white rounded-md p-3 shadow-sm border border-green-100">
                            <div className="text-sm text-gray-500">Time Saved</div>
                            <div className="text-xl font-medium text-gray-800">9 minutes</div>
                            <div className="text-xs text-gray-500 mt-1">Avg. human agent time: 18min</div>
                          </div>
                          <div className="bg-white rounded-md p-3 shadow-sm border border-green-100">
                            <div className="text-sm text-gray-500">Player Satisfaction</div>
                            <div className="text-xl font-medium text-green-600">Good</div>
                            <div className="text-xs text-gray-500 mt-1">Technical issue resolved</div>
                          </div>
                        </>
                      )}
                      
                      {playerContext.playerName === "DanyStormborn" && (
                        <>
                          <div className="bg-white rounded-md p-3 shadow-sm border border-green-100">
                            <div className="text-sm text-gray-500">Time Saved</div>
                            <div className="text-xl font-medium text-gray-800">18 minutes</div>
                            <div className="text-xs text-gray-500 mt-1">Avg. human agent time: 20min</div>
                          </div>
                          <div className="bg-white rounded-md p-3 shadow-sm border border-green-100">
                            <div className="text-sm text-gray-500">Fraud Detection</div>
                            <div className="text-xl font-medium text-green-600">Successful</div>
                            <div className="text-xs text-gray-500 mt-1">System evidence utilized</div>
                          </div>
                        </>
                      )}
                      
                      {playerContext.playerName === "LannisterGold" && (
                        <>
                          <div className="bg-white rounded-md p-3 shadow-sm border border-green-100">
                            <div className="text-sm text-gray-500">Time Saved</div>
                            <div className="text-xl font-medium text-gray-800">12 minutes</div>
                            <div className="text-xs text-gray-500 mt-1">Avg. human agent time: 32min</div>
                          </div>
                          <div className="bg-white rounded-md p-3 shadow-sm border border-green-100">
                            <div className="text-sm text-gray-500">VIP Retention</div>
                            <div className="text-xl font-medium text-green-600">High Value</div>
                            <div className="text-xs text-gray-500 mt-1">$2,187 lifetime spend</div>
                          </div>
                        </>
                      )}
                      
                      {playerContext.playerName && !["JonSnow123", "DanyStormborn", "LannisterGold"].includes(playerContext.playerName) && (
                        <>
                          <div className="bg-white rounded-md p-3 shadow-sm border border-green-100">
                            <div className="text-sm text-gray-500">Average Response Time</div>
                            <div className="text-xl font-medium text-gray-800">00:42</div>
                          </div>
                          <div className="bg-white rounded-md p-3 shadow-sm border border-green-100">
                            <div className="text-sm text-gray-500">Player Satisfaction</div>
                            <div className="text-xl font-medium text-green-600">Great</div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-4 bg-white rounded-md p-3 shadow-sm border border-green-100">
                      <div className="text-sm font-medium text-gray-700">Agent Workflow Summary</div>
                      
                      {playerContext.playerName === "JonSnow123" && (
                        <div className="text-sm text-gray-600 mt-1">
                          Identified known tutorial crash bug, provided workaround, explained resolution timeline, and issued appropriate new player compensation.
                        </div>
                      )}
                      
                      {playerContext.playerName === "DanyStormborn" && (
                        <div className="text-sm text-gray-600 mt-1">
                          Verified logs showed rewards were already claimed, efficiently cross-referenced transaction data, respectfully explained the situation with evidence, and provided helpful information about upcoming events.
                        </div>
                      )}
                      
                      {playerContext.playerName === "LannisterGold" && (
                        <div className="text-sm text-gray-600 mt-1">
                          Verified account identity using email and purchase history, sent verification code, restored account access in time for critical event, and provided appropriate VIP compensation.
                        </div>
                      )}
                      
                      {playerContext.playerName && !["JonSnow123", "DanyStormborn", "LannisterGold"].includes(playerContext.playerName) && (
                        <div className="text-sm text-gray-600 mt-1">
                          Successfully resolved the player's issue with efficient troubleshooting and clear communication.
                        </div>
                      )}
                    </div>
                    
                    {/* Update CRM button */}
                    <div className="mt-4 flex justify-center">
                      {updateStatus === 'idle' && (
                        <button
                          type="button"
                          className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          onClick={() => {
                            console.log('Update CRM button clicked');
                            setUpdateStatus('loading');
                            
                            // Simulate API call with timeout
                            setTimeout(() => {
                              setUpdateStatus('success');
                              console.log('CRM updated successfully');
                              
                              // Reset to idle after a delay
                              setTimeout(() => {
                                setUpdateStatus('idle');
                              }, 2000);
                            }, 1000);
                          }}
                        >
                          Update CRM & Ticketing System
                        </button>
                      )}
                      
                      {updateStatus === 'loading' && (
                        <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 font-medium rounded-md">
                          <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Updating...</span>
                        </div>
                      )}
                      
                      {updateStatus === 'success' && (
                        <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 font-medium rounded-md">
                          <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>CRM Updated Successfully</span>
                        </div>
                      )}
                      
                      {/* Debug info - comment out in production */}
                      <div className="absolute bottom-0 right-0 text-xs text-gray-400 opacity-50 mr-1">
                        Status: {updateStatus}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Debug area */}
              <div className="flex-shrink-0 p-2 bg-yellow-50 border-t border-yellow-200">
                <button 
                  type="button"
                  onClick={testCompensation}
                  className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600"
                >
                  🧪 Test Compensation Panel
                </button>
                <span className="ml-2 text-xs text-gray-600">
                  Debug: {processedCompensationData ? '✅ Panel Data Ready' : '❌ No Panel Data'}
                </span>
              </div>
              
              {/* Input area */}
              <div className="flex-shrink-0">
                <form ref={formRef} onSubmit={handleSubmit}>
                  <ChatInput 
                    onSendMessage={handleSendMessage}
                    isResponseStreaming={isResponseStreaming}
                    waitingForResponse={waitingForResponse || isGeminiGenerating}
                    isUserTyping={isUserTyping}
                    placeholder="Type your message..."
                    inputRef={inputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                  />
                </form>
              </div>
            </>
          )}

          {/* Compensation panel - fixed position at bottom */}
          {processedCompensationData && !compensationState.dismissed && !compensationState.requested && processedCompensationData.recommendation && processedCompensationData.issue && (
            <div className="sticky bottom-0 left-0 right-0 border-t border-gray-200 bg-white z-10 shadow-md max-h-[30vh] overflow-y-auto">
              <CompensationPanel 
                recommendation={processedCompensationData.recommendation}
                issue={processedCompensationData.issue}
                sentiment={processedCompensationData.sentiment}
                playerContext={{
                  playerId: playerContext.playerId,
                  playerName: playerContext.playerName,
                  gameLevel: playerContext.gameLevel,
                  vipLevel: playerContext.vipLevel,
                  isSpender: (playerContext.totalSpend ?? 0) > 0,
                  freeformContext: playerContext.freeformContext
                }}
                onRequestCompensation={requestCompensation}
                onDismiss={dismissCompensation}
                // Approval workflow props
                awaitingApproval={awaitingApproval}
                aiSummary={processedCompensationData.aiSummary}
                onApproveAndSend={approveCompensationAndSend}
                onReject={rejectCompensation}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 