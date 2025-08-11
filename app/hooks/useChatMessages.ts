import { useState, useCallback, useEffect } from 'react';
import { Message } from 'ai';
import { PlayerContext } from '../types/player';

/**
 * Hook to manage chat messages with simple JSON API calls
 */
export function useChatMessages(
  playerContext: PlayerContext,
  gameId?: string,
  demoMessages?: string[],
  demoInitialMessage?: string,
  onCompensationData?: (data: any) => void,
  demoPlayerMessages?: string[],
  demoAgentMessages?: string[],
  forceLiveChat?: boolean,
  externalSources?: any
) {
  // Simple chat state management for JSON responses
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [initialMessageSent, setInitialMessageSent] = useState(false);

  // Input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  // Auto-send initial message if provided
  useEffect(() => {
    console.log('🔄 useEffect triggered - demoInitialMessage:', demoInitialMessage);
    console.log('🔄 initialMessageSent:', initialMessageSent);
    console.log('🔄 messages.length:', messages.length);
    console.log('🔄 playerContext:', playerContext);
    
    if (demoInitialMessage && !initialMessageSent && messages.length === 0) {
      console.log('🔄 Auto-sending initial message from escalated case:', demoInitialMessage);
      setInitialMessageSent(true);
      
      // Create and send the initial user message
      const initialUserMessage: Message = {
        id: `initial-${Date.now()}`,
        role: 'user',
        content: demoInitialMessage
      };
      
      console.log('🔄 Setting initial message in state:', initialUserMessage);
      setMessages([initialUserMessage]);
      setIsLoading(true);
      
      // Send to AI
      console.log('🔄 Sending to API with playerContext:', playerContext);
      fetch('/api/chat-smart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [initialUserMessage],
          playerContext: {
            ...playerContext,
            playerId: playerContext.playerId
          },
          gameId,
          externalSources: externalSources || null
        })
      })
      .then(response => {
        console.log('🔄 API response status:', response.status);
        return response.json();
      })
      .then(result => {
        console.log('🔄 API result:', result);
        const assistantMessage: Message = {
          id: `assistant-initial-${Date.now()}`,
          role: 'assistant',
          content: result.content
        };
        console.log('🔄 Adding assistant message:', assistantMessage);
        setMessages(prev => [...prev, assistantMessage]);
      })
      .catch(err => {
        console.error('Initial message error:', err);
        setError(err instanceof Error ? err : new Error('Failed to send initial message'));
      })
      .finally(() => {
        setIsLoading(false);
      });
    }
  }, [demoInitialMessage, initialMessageSent, messages.length, playerContext, gameId, externalSources]);

  // Submit handler for JSON API
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim()
    };
    
    // Add user message to messages immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Clear input
    setInput('');
    
    try {
      const response = await fetch('/api/chat-smart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          playerContext: {
            ...playerContext,
            playerId: playerContext.playerId
          },
          gameId,
          externalSources: externalSources || null
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Create assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.content
      };
      
      // Add assistant message
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, playerContext, gameId, externalSources]);

  // Reset chat state
  const resetChat = useCallback(() => {
    setMessages([]);
    setInput('');
    setError(null);
  }, []);

  return {
    // Core chat state
    messages,
    input,
    isLoading,
    error,
    
    // Handlers
    handleInputChange,
    handleSubmit,
    resetChat,
    
    // Aliases for backward compatibility with existing components
    displayedMessages: messages,
    apiMessages: messages,
    inputValue: input,
    setInputValue: setInput,
    setMessages,
    waitingForResponse: isLoading,
    shouldScrollToBottom: true, // Always scroll to bottom for new messages
    
    // Demo-related state (disabled for simplicity)
    messageQueue: [],
    agentResponseQueue: [],
    currentMessageIndex: 0,
    isGeminiGenerating: false,
    isResponseStreaming: false,
    demoCompleted: false,
    showFinalMetrics: false,
    sentMessageIndices: new Set(),
    isUserTyping: false,
    
    // Demo-related setters (no-ops for compatibility)
    setDisplayedMessages: setMessages,
    setMessageQueue: () => {},
    setAgentResponseQueue: () => {},
    setCurrentMessageIndex: () => {},
    setWaitingForResponse: () => {},
    setIsGeminiGenerating: () => {},
    setIsResponseStreaming: () => {},
    setShouldScrollToBottom: () => {},
    setDemoCompleted: () => {},
    setShowFinalMetrics: () => {},
    setSentMessageIndices: () => {},
    setApiMessages: setMessages,
    setIsUserTyping: () => {},
    
    // Demo handlers (no-ops for compatibility)
    sendDemoMessage: () => {},
    sendDemoAgentResponse: () => {},
    
    // Additional properties that components might expect
    data: null,
    streamData: null,
    inputRef: { current: null }
  };
}