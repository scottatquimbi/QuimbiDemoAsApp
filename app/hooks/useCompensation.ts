import { useMemo, useState } from 'react';
import { CompensationData } from '../types/compensation';
import { PlayerContext } from '../types/player';
import { CompensationTier } from '@/lib/models';

/**
 * Hook to manage compensation data and processing
 */
export function useCompensation(
  playerContext: PlayerContext,
  streamData: any,
  data: any,
  isResponseStreaming: boolean,
  currentMessageIndex: number,
  messageQueueLength: number,
  messages?: any[]
) {
  // State for compensation data
  const [rawCompensationData, setRawCompensationData] = useState<any>(null);
  const [streamCompensationData, setStreamCompensationData] = useState<any>(null);
  const [compensationState, setCompensationState] = useState<{
    requested: boolean;
    dismissed: boolean;
    requestId?: string;
    status?: string;
  }>({
    requested: false,
    dismissed: false
  });
  const [callbackFired, setCallbackFired] = useState(false);
  
  // Approval workflow state
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  const [pendingAiResponse, setPendingAiResponse] = useState<string | null>(null);

  /**
   * Helper function to ensure compensation data has the required tierInfo for the UI
   */
  function addFallbackTierInfo(compensationData: any): any {
    if (!compensationData) return null;
    
    // Create a deep copy to avoid mutations
    const enhancedData = JSON.parse(JSON.stringify(compensationData));
    
    // Add tierInfo if needed for the UI
    if (enhancedData.recommendation?.tier) {
      // Mapping for tier to colors/labels for the UI
      const tierInfoMapping: Record<string, { label: string; color: string; bg: string }> = {
        'P0': { label: 'Critical', color: '#d32f2f', bg: '#ffebee' },
        'P1': { label: 'Severe', color: '#f57c00', bg: '#fff3e0' },
        'P2': { label: 'Moderate', color: '#fbc02d', bg: '#fffde7' },
        'P3': { label: 'Minor', color: '#7cb342', bg: '#f1f8e9' },
        'P4': { label: 'Minimal', color: '#0288d1', bg: '#e1f5fe' },
        'P5': { label: 'None', color: '#757575', bg: '#f5f5f5' }
      };
      
      // Make sure tier is a string (from the enum)
      const tierKey = enhancedData.recommendation.tier.toString();
      
      // Add the UI info directly to the data to avoid the lookup in CompensationPanel
      enhancedData.recommendation.tierInfo = tierInfoMapping[tierKey] || 
        { label: 'Unknown', color: '#9e9e9e', bg: '#f5f5f5' };
    }
    
    return enhancedData;
  }

  /**
   * Function to find compensation data in complex objects
   */
  function findCompensationData(data: any): any {
    if (!data) return null;
    
    // Look in various locations where compensation data might be
    if (typeof data === 'object') {
      // Direct paths
      if (data.compensation) {
        console.log("Found compensation data at data.compensation", data.compensation);
        return data.compensation;
      }
      
      // Check for ai_compensation (new format)
      if (data.ai_compensation?.compensation) {
        console.log("Found compensation data at data.ai_compensation.compensation", data.ai_compensation.compensation);
        return data.ai_compensation.compensation;
      }
      
      // Nested in compensation_recommendation
      if (data.compensation_recommendation?.compensation) {
        console.log("Found compensation data at data.compensation_recommendation", data.compensation_recommendation);
        return data.compensation_recommendation;
      }
      
      // Check if nested in message metadata
      if (data.metadata?.compensation) {
        console.log("Found compensation data at data.metadata.compensation", data.metadata.compensation);
        return data.metadata.compensation;
      }
      
      // In messages
      if (Array.isArray(data.messages)) {
        for (const msg of data.messages) {
          if (msg.metadata?.compensation) {
            console.log("Found compensation data in message metadata", msg.metadata.compensation);
            return msg.metadata.compensation;
          }
        }
      }
      
      // Look for specific key
      if (typeof data === 'object' && 'type' in data && data.type === 'compensation_recommendation') {
        console.log("Found compensation_recommendation object", data);
        return data;
      }
      
      // Look through all keys for compensation-related data
      for (const key in data) {
        if (typeof data[key] === 'object' && data[key] !== null) {
          if (key.includes('compensation')) {
            console.log(`Found compensation-related data at data.${key}`, data[key]);
            return data[key];
          }
          
          // Skip recursive searching in messages array to avoid excessive computation
          if (key === 'messages') continue;
          
          // Recursive search in nested objects (limit depth to avoid excessive recursion)
          const nestedResult = findCompensationData(data[key]);
          if (nestedResult) return nestedResult;
        }
      }
    }
    
    return null;
  }

  /**
   * Process compensation data
   */
  const processedCompensationData = useMemo<any>(() => {
    // Only process compensation data when not streaming
    if (isResponseStreaming) {
      console.log('Still streaming response, deferring compensation display');
      return null;
    }
    
    // Get the raw compensation data from AI analysis or stream
    let rawData = streamCompensationData || rawCompensationData || findCompensationData(data);
    
    console.log('🔍 Raw compensation data sources:', {
      streamCompensationData: !!streamCompensationData,
      rawCompensationData: !!rawCompensationData,
      dataFromFindFunction: !!findCompensationData(data),
      selectedRawData: !!rawData
    });
    
    if (rawData) {
      console.log('🔍 Raw data structure:', JSON.stringify(rawData, null, 2));
    }
    
    // ONLY show compensation panel if we have actual AI-generated compensation data
    if (rawData && rawData.issueDetected) {
      console.log('Processing AI-generated compensation data for player:', playerContext.playerName || 'Unknown Player');
      
      // Ensure player name is properly included in the data
      const processedData = addFallbackTierInfo(rawData);
      console.log('🔍 Processed data after addFallbackTierInfo:', JSON.stringify(processedData, null, 2));
      
      if (processedData && processedData.recommendation) {
        processedData.recommendation.playerContext = {
          ...processedData.recommendation.playerContext,
          playerName: playerContext.playerName || playerContext.preferredName || 'Player',
          gameLevel: playerContext.gameLevel,
          vipStatus: playerContext.vipLevel,
          isSpender: (playerContext.totalSpend ?? 0) > 0
        };
      }
      
      console.log('🔍 Final processed data:', JSON.stringify(processedData, null, 2));
      return processedData;
    }
    
    // No compensation data from AI means no panel should be shown
    console.log('❌ No AI compensation decision made yet - panel will not appear');
    console.log('❌ Reason: rawData exists?', !!rawData, 'issueDetected?', rawData?.issueDetected);
    return null;
  }, [
    streamCompensationData, 
    rawCompensationData, 
    data, 
    isResponseStreaming, 
    playerContext
  ]);

  /**
   * Handle requesting compensation
   */
  const handleRequestCompensation = (requestId: string, status: string) => {
    // Only proceed if the callback hasn't been fired yet
    if (callbackFired) return;
    setCallbackFired(true);
    
    setCompensationState({
      requested: true,
      dismissed: false,
      requestId,
      status
    });
    
    // Log detailed information for debugging
    console.log(`Compensation request submitted: ${requestId}, status: ${status}`);
    console.log('Current message info:', {
      currentMessageIndex,
      messageQueueLength,
      isAtFinalMessage: currentMessageIndex >= messageQueueLength - 1
    });
    
    // Force the demo to be marked as completed to ensure final message is shown
    if (currentMessageIndex >= messageQueueLength - 2) {
      console.log('Advancing to final thank you message after compensation request');
      
      // The compensation flow occurred at the end of the conversation
      // We should ensure that the final thank you message is displayed
      // This can be handled by the message processing logic
    }
  };

  /**
   * Handle dismissing compensation
   */
  const handleDismissCompensation = () => {
    // Only proceed if the callback hasn't been fired yet
    if (callbackFired) return;
    setCallbackFired(true);
    
    setCompensationState(prev => ({
      ...prev,
      dismissed: true
    }));
    
    console.log('Compensation dismissed by user');
    console.log('Current message info:', {
      currentMessageIndex,
      messageQueueLength,
      isAtFinalMessage: currentMessageIndex >= messageQueueLength - 1
    });
    
    // Force the demo to be marked as completed to ensure final message is shown
    if (currentMessageIndex >= messageQueueLength - 2) {
      console.log('Advancing to final thank you message after compensation dismissal');
      
      // The compensation dismissal occurred at the end of the conversation
      // We should ensure that the final thank you message is displayed
      // This can be handled by the message processing logic
    }
  };

  // Process stream data for compensation info
  const processStreamData = (streamData: any) => {
    if (!streamData) return;
    
    // Process each chunk looking for compensation
    for (const chunk of streamData) {
      if (chunk.type === 'ai_compensation' || chunk.type === 'compensation_recommendation') {
        console.log(`Found compensation in stream data (${chunk.type})`, chunk);
        // Save the data but don't display yet - we'll show after streaming finishes
        if (!streamCompensationData) {
          setStreamCompensationData(chunk.compensation || chunk);
        }
      }
    }
  };

  // Approval workflow functions
  
  /**
   * Analyze AI response for compensation keywords and determine if approval is needed
   */
  const analyzeAiResponseForApproval = (response: string): boolean => {
    // Only trigger on explicit compensation offers, not general support language
    const compensationOfferPhrases = [
      'sending you compensation',
      'provide compensation',
      'offer compensation',
      'compensate you',
      'send you resources',
      'send you gold',
      'send you gems',
      'refund you',
      'reimburse you',
      'give you a package',
      'compensation package',
      'here are some resources',
      'i\'ll send you some',
      'i\'ll send you resources',
      'i\'ll send you gold',
      'i\'ll send you gems',
      'sent to your mailbox',
      'added to your account'
    ];
    
    const lowerResponse = response.toLowerCase();
    
    for (const phrase of compensationOfferPhrases) {
      if (lowerResponse.includes(phrase)) {
        console.log('🎯 Matched compensation phrase:', phrase);
        return true;
      }
    }
    
    return false;
  };
  
  /**
   * Intercept AI response to check if it requires approval before sending to player
   */
  const interceptAiResponse = (response: string): boolean => {
    if (!response) return true;
    
    console.log('🔍 Analyzing AI response for compensation offers:', response.substring(0, 200) + '...');
    const needsApproval = analyzeAiResponseForApproval(response);
    console.log('📊 Needs approval:', needsApproval);
    
    if (needsApproval) {
      console.log('🔒 AI response contains compensation keywords - requiring approval');
      console.log('📝 Full response:', response);
      setPendingAiResponse(response);
      setAwaitingApproval(true);
      
      // Generate AI summary for the agent
      const summary = `AI detected an issue and is offering compensation. Response contains keywords suggesting player assistance is needed.`;
      
      // Set compensation data with AI summary
      setRawCompensationData({
        issueDetected: true,
        aiSummary: summary,
        originalResponse: response,
        recommendation: {
          tier: 'P2',
          playerContext: {
            playerName: playerContext.playerName || 'Player',
            gameLevel: playerContext.gameLevel,
            vipLevel: playerContext.vipLevel || 0,
            isSpender: playerContext.isSpender || false
          }
        },
        issue: {
          type: 'general_support',
          description: 'Player reported an issue requiring assistance'
        },
        sentiment: {
          tone: 'neutral',
          urgency: 'medium'
        }
      });
      
      return false; // Block the response
    }
    
    return true; // Allow the response
  };
  
  /**
   * Approve compensation and send the original AI response to the player
   */
  const approveCompensationAndSend = (): string | null => {
    const responseToSend = pendingAiResponse;
    
    if (responseToSend) {
      console.log('✅ Compensation approved - releasing AI response');
      setAwaitingApproval(false);
      setPendingAiResponse(null);
      setRawCompensationData(null);
      return responseToSend;
    }
    
    console.error('❌ No pending AI response to approve');
    return null;
  };
  
  /**
   * Reject compensation and clear pending response
   */
  const rejectCompensation = (): void => {
    console.log('❌ Compensation rejected - clearing pending response');
    setAwaitingApproval(false);
    setPendingAiResponse(null);
    setRawCompensationData(null);
  };
  
  /**
   * Test compensation panel by generating fake compensation data
   */
  const testCompensation = (): void => {
    console.log('🧪 Manually triggering test compensation');
    
    const testData = {
      issueDetected: true,
      recommendation: {
        tier: 'P2',
        resources: {
          gold: 5000,
          gems: 100,
          speedups: 5
        },
        reasoning: 'Test compensation for debugging purposes',
        playerContext: {
          playerName: playerContext.playerName || 'Player',
          gameLevel: playerContext.gameLevel,
          vipLevel: playerContext.vipLevel || 0,
          isSpender: playerContext.isSpender || false
        }
      },
      issue: {
        type: 'technical_issue',
        description: 'Test issue for compensation panel debugging'
      },
      sentiment: {
        tone: 'frustrated',
        urgency: 'high'
      }
    };
    
    setRawCompensationData(testData);
  };

  // Aliases for backward compatibility with existing code
  const requestCompensation = handleRequestCompensation;
  const dismissCompensation = handleDismissCompensation;

  return {
    processedCompensationData,
    setRawCompensationData,
    processStreamData,
    compensationState,
    handleRequestCompensation,
    handleDismissCompensation,
    addFallbackTierInfo,
    findCompensationData,
    // Add these properties to match what the component is expecting
    streamCompensationData,
    rawCompensationData,
    requestCompensation,
    dismissCompensation,
    // Approval workflow functions
    interceptAiResponse,
    approveCompensationAndSend,
    rejectCompensation,
    awaitingApproval,
    pendingAiResponse,
    testCompensation
  };
} 