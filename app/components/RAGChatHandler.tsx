'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message } from 'ai';
import { PlayerContext } from '@/lib/models';
import ChatInput from './ChatInput';
import MessageList from './MessageList';
import { v4 as uuidv4 } from 'uuid';
import CompensationPanel from './CompensationPanel';
import ThreePartResponse from './ThreePartResponse';
import IssueSummaryPopup from './IssueSummaryPopup';
import CRMUpdatePopup from './CRMUpdatePopup';
import { generateClosingResponse } from '../../lib/follow-up-analysis';
import { useCompensation } from '../hooks/useCompensation';

interface RAGChatHandlerProps {
  playerContext: PlayerContext;
  gameId?: string;
  onCompensationData?: (data: any) => void;
}

// Define an extended player context type that includes all the required properties
interface CompensationPlayerContext {
  playerId: string;
  playerName: string;
  gameLevel: number;
  vipLevel: number;
  isSpender: boolean;
  freeformContext?: string;
}

export default function RAGChatHandler({ 
  playerContext, 
  gameId = 'got',
  onCompensationData 
}: RAGChatHandlerProps) {
  console.log('🎯 RAGChatHandler: Component instantiated with playerContext:', playerContext.playerName);
  // State for UI
  const [waitingForResponse, setWaitingForResponse] = useState<boolean>(false);
  const [isResponseStreaming, setIsResponseStreaming] = useState<boolean>(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState<boolean>(true);
  
  // Generate playerId if it doesn't exist in playerContext
  const [playerId] = useState<string>(uuidv4());
  
  // Simple chat state management for JSON responses
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Approval workflow state
  const [pendingAiResponse, setPendingAiResponse] = useState<string | null>(null);
  const [awaitingApproval, setAwaitingApproval] = useState(false);
  
  // Three-part response state
  const [showThreePartResponse, setShowThreePartResponse] = useState(false);
  const [threePartData, setThreePartData] = useState<{
    problemSummary: string;
    solution: string;
    compensation: string;
    hasCompensation: boolean;
  } | null>(null);
  
  // Popup workflow state
  const [workflowStage, setWorkflowStage] = useState<'initial' | 'analysis_pending' | 'acknowledged' | 'responses_sent' | 'crm_complete'>('initial');
  const [showIssueSummaryPopup, setShowIssueSummaryPopup] = useState(false);
  const [showCRMUpdatePopup, setShowCRMUpdatePopup] = useState(false);
  const [issueAnalysisData, setIssueAnalysisData] = useState<any>(null);
  const [sessionSummary, setSessionSummary] = useState<any>(null);
  const [messagesSent, setMessagesSent] = useState(0);
  const [sectionsTracker, setSectionsTracker] = useState({
    summarySent: false,
    solutionSent: false,
    compensationSent: false
  });
  const [followUpMessagesSent, setFollowUpMessagesSent] = useState(false); // Guard against duplicate follow-up messages
  const [compensationConfirmationSent, setCompensationConfirmationSent] = useState(false); // Guard against duplicate compensation messages
  const [startTime] = useState(Date.now());

  // Debug: Log component mounting and check for escalated analysis data
  useEffect(() => {
    console.log('🎯 RAGChatHandler: Component mounted/remounted with player:', playerContext.playerName);
    
    // Check for escalated analysis data from automated support
    if (typeof window !== 'undefined') {
      const escalatedAnalysisData = localStorage.getItem('escalatedAnalysisData');
      if (escalatedAnalysisData) {
        console.log('🔄 Found escalated analysis data, triggering immediate three-part response');
        try {
          const analysisData = JSON.parse(escalatedAnalysisData);
          handleEscalatedAnalysis(analysisData);
          localStorage.removeItem('escalatedAnalysisData'); // Clean up
        } catch (error) {
          console.error('🚨 Error parsing escalated analysis data:', error);
        }
      }
    }
    
    return () => {
      console.log('🔄 RAGChatHandler: Component unmounting');
    };
  }, []);
  
  // Use the compensation hook with approval workflow
  const compensationHook = useCompensation(
    playerContext,
    null, // streamData - not used in RAG handler
    null, // data - not used in RAG handler
    isResponseStreaming,
    0, // currentMessageIndex - not used in RAG handler
    messages.length,
    messages
  );
  
  const {
    processedCompensationData,
    compensationState,
    requestCompensation,
    dismissCompensation,
    testCompensation
  } = compensationHook;
  
  // Input field reference
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  // Submit handler for JSON API
  const originalHandleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    setIsLoading(true);
    setWaitingForResponse(true);
    setIsResponseStreaming(true);
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
            playerId: playerId
          },
          gameId
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Check if we have structured response data
      if (result.problemSummary && result.solution) {
        console.log('🎯 Structured response detected - showing issue summary popup first');
        
        // Prepare issue analysis data for popup with proper third-person report format
        const generateThirdPersonDescription = (data: any, message: string) => {
          const playerName = playerContext.playerName || 'Player';
          const issueType = data?.issue?.issueType || 'technical';
          const description = data?.issue?.description;
          
          if (description && description !== 'Player reported an issue') {
            return `${playerName} has reported: ${description}`;
          }
          
          // Generate description based on message content and issue type
          const messageLower = message.toLowerCase();
          if (messageLower.includes('missing') || messageLower.includes('lost')) {
            return `${playerName} reports missing game resources or rewards that were expected to be received.`;
          } else if (messageLower.includes('crash') || messageLower.includes('freeze')) {
            return `${playerName} is experiencing game stability issues including crashes or freezing during gameplay.`;
          } else if (messageLower.includes('bug') || messageLower.includes('glitch')) {
            return `${playerName} has encountered a game bug or glitch affecting their gameplay experience.`;
          } else if (messageLower.includes('purchase') || messageLower.includes('payment')) {
            return `${playerName} is reporting an issue related to in-game purchases or payment transactions.`;
          } else if (messageLower.includes('account') || messageLower.includes('login')) {
            return `${playerName} is experiencing difficulties with account access or authentication.`;
          } else {
            return `${playerName} has submitted a ${issueType} support request requiring investigation and resolution.`;
          }
        };

        const analysisData = {
          playerName: playerContext.playerName || 'Unknown Player',
          issueType: result.compensationData?.issue?.issueType || 'General Support',
          description: generateThirdPersonDescription(result.compensationData, input),
          severity: result.compensationData?.compensation?.tier || 'P5',
          confidenceScore: result.compensationData?.issue?.confidenceScore || 0.8
        };
        
        const compensationDetails = result.compensationData?.compensation ? {
          tier: result.compensationData.compensation.tier,
          gold: result.compensationData.compensation.suggestedCompensation?.gold,
          resources: result.compensationData.compensation.suggestedCompensation?.resources,
          reasoning: result.compensationData.compensation.reasoning?.replace(/^I've|^I have/, 'Analysis has') || 'Compensation recommended based on issue severity and player impact',
          requiresApproval: result.compensationData.compensation.requiresHumanReview || false
        } : null;
        
        // Store data for later use
        console.log('🔍 DEBUG: API result fields:', {
          problemSummary: !!result.problemSummary,
          solution: !!result.solution,
          compensationText: result.compensationText,
          hasCompensation: result.hasCompensation,
          compensationData: !!result.compensationData
        });
        
        setThreePartData({
          problemSummary: result.problemSummary,
          solution: result.solution,
          compensation: result.compensationText || '',
          hasCompensation: result.hasCompensation || false
        });
        
        setIssueAnalysisData({ analysisData, compensationDetails });
        
        // Do NOT set legacy compensation data for structured responses
        // The three-part response system handles all compensation logic
        console.log('🚫 Skipping legacy compensation data setup for structured response');
        
        // Show issue summary popup first
        setWorkflowStage('analysis_pending');
        setShowIssueSummaryPopup(true);
        
        return;
      }
      
      // Handle legacy compensation data if present - this determines if we need approval
      console.log('🔍 Full API result:', result);
      console.log('🔍 result.compensation exists:', !!result.compensation);
      console.log('🔍 result.compensation.issueDetected:', result.compensation?.issueDetected);
      
      if (result.compensation && result.compensation.issueDetected) {
        console.log('🎯 Compensation analysis detected issue - requiring approval before showing response');
        console.log('📊 Compensation data structure:', JSON.stringify(result.compensation, null, 2));
        
        // Transform the API data structure to match what the frontend expects
        const transformedData = {
          issueDetected: result.compensation.issueDetected,
          issue: result.compensation.issue,
          sentiment: result.compensation.sentiment,
          recommendation: result.compensation.compensation, // Map 'compensation' to 'recommendation'
          aiSummary: `AI analysis detected an issue requiring compensation. Player: ${playerContext.playerName || 'Unknown'}, Issue: ${result.compensation.issue?.type || 'general'}. Compensation tier: ${result.compensation.compensation?.tier || 'unknown'}.`
        };
        
        console.log('🔄 Transformed compensation data:', JSON.stringify(transformedData, null, 2));
        
        // Set the compensation data for the approval workflow
        compensationHook.setRawCompensationData(transformedData);
        
        // Store the AI response for later approval
        setPendingAiResponse(result.content);
        setAwaitingApproval(true);
        
        // Don't add the message yet - it will be added after approval
        if (onCompensationData) {
          onCompensationData(result.compensation);
        }
        return;
      }
      
      // No compensation needed - check if we have partial structured data or need to show fallback
      console.log('✅ No compensation required - checking response format');
      
      // Check if we have any structured data that failed the initial check
      if (result.problemSummary || result.solution || result.compensationText) {
        console.log('🔧 Found partial structured data, attempting to create three-part response');
        
        // Create three-part data from whatever we have
        const threePartResponseData = {
          problemSummary: result.problemSummary || 'I understand your concern and I\'m here to help.',
          solution: result.solution || 'Let me work on resolving this issue for you.',
          compensation: result.compensationText || '',
          hasCompensation: !!result.compensationText && result.compensationText.length > 0
        };
        
        // Create basic analysis data for popup
        const analysisDataForPopup = {
          playerName: playerContext.playerName || 'Player',
          issueType: 'General Support',
          description: `${playerContext.playerName || 'Player'} has submitted a support request.`,
          severity: 'P5',
          confidenceScore: 0.7
        };
        
        // Store data and show issue summary popup
        setThreePartData(threePartResponseData);
        setIssueAnalysisData({ analysisData: analysisDataForPopup, compensationDetails: null });
        
        // Show issue summary popup first
        setWorkflowStage('analysis_pending');
        setShowIssueSummaryPopup(true);
        
        return;
      }
      
      // Check if result.content looks like JSON (indicating parsing failure)
      let displayContent = result.content;
      if (typeof result.content === 'string' && result.content.trim().startsWith('{')) {
        console.log('⚠️ Response appears to be unparsed JSON, creating fallback message');
        try {
          const jsonData = JSON.parse(result.content);
          // If it's a JSON object with structured data, extract what we can
          if (jsonData.problemSummary || jsonData.solution) {
            console.log('🔧 Extracting structured data from JSON content');
            
            const threePartResponseData = {
              problemSummary: jsonData.problemSummary || 'I understand your concern and I\'m here to help.',
              solution: jsonData.solution || 'Let me work on resolving this issue for you.',
              compensation: jsonData.compensationText || '',
              hasCompensation: !!jsonData.compensationText && jsonData.compensationText.length > 0
            };
            
            // Create basic analysis data for popup
            const analysisDataForPopup = {
              playerName: playerContext.playerName || 'Player',
              issueType: 'General Support',
              description: `${playerContext.playerName || 'Player'} has submitted a support request.`,
              severity: 'P5',
              confidenceScore: 0.7
            };
            
            // Store data and show issue summary popup
            setThreePartData(threePartResponseData);
            setIssueAnalysisData({ analysisData: analysisDataForPopup, compensationDetails: null });
            
            // Show issue summary popup first
            setWorkflowStage('analysis_pending');
            setShowIssueSummaryPopup(true);
            
            return;
          } else {
            // JSON doesn't have structured data, use fallback message
            displayContent = 'I understand your request. Let me help you with that. Please provide more details if needed.';
          }
        } catch (e) {
          // Not valid JSON, use fallback message
          displayContent = 'I understand your request. Let me help you with that. Please provide more details if needed.';
        }
      }
      
      console.log('📝 Showing traditional response message');
      
      // Create assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: displayContent
      };
      
      // Add assistant message
      setMessages(prev => [...prev, assistantMessage]);
      
      setShouldScrollToBottom(true);
      
    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      
      // Add error message to chat
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
      setWaitingForResponse(false);
      setIsResponseStreaming(false);
    }
  }, [input, messages, playerContext, playerId, gameId, onCompensationData]);

  // State for input value
  const [inputValue, setInputValue] = useState<string>('');
  
  // Handle compensation approval and send response
  const handleApproveCompensation = () => {
    console.log('💰 Compensation approved - sending AI response');
    console.log('⚠️ LEGACY: handleApproveCompensation called - this should not happen with three-part response');
    
    // Guard against executing during three-part response workflow
    if (showThreePartResponse || workflowStage !== 'initial') {
      console.log('🚫 Blocking legacy compensation approval - three-part response is active');
      return;
    }
    
    if (pendingAiResponse) {
      console.log('✅ Adding original AI response to messages');
      // Create assistant message with the approved response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: pendingAiResponse
      };
      
      // Add assistant message
      setMessages(prev => {
        console.log('📝 Adding assistant message, current messages:', prev.length);
        return [...prev, assistantMessage];
      });
      
      // Clear approval state
      setPendingAiResponse(null);
      setAwaitingApproval(false);
      
      // Note: Removed duplicate confirmation message - it's already handled by three-part response workflow
      
      setShouldScrollToBottom(true);
    } else {
      console.error('❌ No pending AI response to send!');
    }
  };
  
  // Handle compensation rejection
  const handleRejectCompensation = () => {
    console.log('❌ Compensation rejected');
    
    // Clear approval state and compensation data
    setPendingAiResponse(null);
    setAwaitingApproval(false);
    compensationHook.setRawCompensationData(null);
    
    // Add a generic support response instead
    const supportMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: "I understand you're experiencing an issue. I've reviewed your situation but cannot provide compensation at this time. Please contact our support team if you need further assistance."
    };
    
    setMessages(prev => [...prev, supportMessage]);
    setShouldScrollToBottom(true);
  };
  
  // Handle standard compensation request (for non-approval workflow)
  const handleRequestCompensation = (requestId: string, status: string) => {
    console.log('⚠️ LEGACY: handleRequestCompensation called - this should not happen with three-part response');
    
    // Guard against executing during three-part response workflow
    if (showThreePartResponse || workflowStage !== 'initial') {
      console.log('🚫 Blocking legacy compensation request - three-part response is active');
      return;
    }
    
    requestCompensation(requestId, status);
    
    // Note: Removed duplicate confirmation message - it's already handled by three-part response workflow
    
    setShouldScrollToBottom(true);
  };
  
  // Handle compensation dismissal
  const handleDismissCompensation = () => {
    dismissCompensation();
  };
  
  
  // Handle dismissing three-part response
  const handleDismissThreePartResponse = () => {
    setShowThreePartResponse(false);
    setThreePartData(null);
  };
  
  // Handle CRM update completion
  const handleCRMUpdate = () => {
    console.log('📝 CRM updated successfully');
    setWorkflowStage('crm_complete');
  };
  
  // Handle escalated analysis data from automated support
  const handleEscalatedAnalysis = (analysisData: any) => {
    console.log('🎯 Processing escalated analysis data:', analysisData);
    
    // Generate AI response based on escalated analysis
    const { issueDetected, issue, compensation } = analysisData;
    
    // More flexible check - proceed if we have at least issue detection
    if (issueDetected || issue || compensation) {
      console.log('🔧 Creating escalated response with available data');
      // Create structured response components with fallbacks
      const problemSummary = issue ? generateProblemSummary(issue, playerContext) : 
        `I can see that you're a Level ${playerContext.gameLevel || 1}${(playerContext.vipLevel || 0) > 0 ? ` VIP ${playerContext.vipLevel}` : ''} player who was escalated from our automated support system. I've reviewed your case and understand the issue you're facing.`;
      
      const solution = issue ? generateSolution(issue) : 
        "I'll investigate this issue for you right away. Based on your escalation from automated support, this requires human review. Let me check your account and resolve this matter.";
      
      const compensationText = (compensation && compensation.tier !== 'NONE') ? 
        generateCompensationText(compensation) : '';
      const hasCompensation = !!(compensation && compensation.tier !== 'NONE' && compensationText);
      
      // Set three-part data
      const threePartResponseData = {
        problemSummary,
        solution,
        compensation: compensationText,
        hasCompensation
      };
      
      // Prepare issue analysis data for popup with proper third-person report format
      const generateThirdPersonDescription = (issue: any) => {
        const playerName = playerContext.playerName || 'Player';
        if (issue?.description) {
          return `${playerName} has reported: ${issue.description}`;
        }
        return `${playerName} was escalated from automated support and requires human assistance.`;
      };

      const analysisDataForPopup = {
        playerName: playerContext.playerName || 'Unknown Player',
        issueType: issue?.issueType || 'Escalated Support',
        description: generateThirdPersonDescription(issue),
        severity: compensation?.tier || 'P5',
        confidenceScore: issue?.confidenceScore || 0.8
      };
      
      const compensationDetails = hasCompensation ? {
        tier: compensation.tier,
        gold: compensation.suggestedCompensation?.gold,
        resources: compensation.suggestedCompensation?.resources,
        reasoning: compensation.reasoning?.replace(/^I've|^I have/, 'Analysis has') || 'Compensation recommended based on issue severity and player impact',
        requiresApproval: compensation.requiresHumanReview || false
      } : null;
      
      // Store data and show issue summary popup
      setThreePartData(threePartResponseData);
      setIssueAnalysisData({ analysisData: analysisDataForPopup, compensationDetails });
      
      // Show issue summary popup first
      setWorkflowStage('analysis_pending');
      setShowIssueSummaryPopup(true);
      
      console.log('✅ Escalated analysis processed - showing issue summary popup');
    } else {
      console.log('⚠️ No escalated analysis data found, creating basic escalation response');
      
      // Create basic escalation response when no analysis data is available
      const threePartResponseData = {
        problemSummary: `I can see that you're a Level ${playerContext.gameLevel || 1}${(playerContext.vipLevel || 0) > 0 ? ` VIP ${playerContext.vipLevel}` : ''} player who was escalated from our automated support system. I'm here to provide personalized assistance.`,
        solution: "I'll review your case personally and ensure we resolve any issues you're experiencing. Let me investigate this matter for you right away.",
        compensation: '',
        hasCompensation: false
      };
      
      const analysisDataForPopup = {
        playerName: playerContext.playerName || 'Unknown Player',
        issueType: 'Escalated Support',
        description: `${playerContext.playerName || 'Player'} was escalated from automated support and requires human assistance.`,
        severity: 'P5',
        confidenceScore: 0.7
      };
      
      // Store data and show issue summary popup
      setThreePartData(threePartResponseData);
      setIssueAnalysisData({ analysisData: analysisDataForPopup, compensationDetails: null });
      
      // Show issue summary popup first
      setWorkflowStage('analysis_pending');
      setShowIssueSummaryPopup(true);
      
      console.log('🎯 Basic escalation response created - showing issue summary popup');
    }
  };

  // Generate problem summary from issue data
  const generateProblemSummary = (issue: any, playerContext: any) => {
    const vipLevel = playerContext.vipLevel || 0;
    const gameLevel = playerContext.gameLevel || 1;
    const description = issue.description || 'general issue';
    
    return `I can see that you're a Level ${gameLevel}${vipLevel > 0 ? ` VIP ${vipLevel}` : ''} player experiencing ${description}. I've reviewed your account and understand the specific issue you're facing.`;
  };

  // Generate solution from issue data
  const generateSolution = (issue: any) => {
    const issueType = issue.issueType || 'technical';
    
    switch (issueType.toLowerCase()) {
      case 'account':
        return "I'll immediately verify your account status and resolve any access issues. Please check your email for a verification code if prompted, and restart the game after I've made the necessary adjustments.";
      case 'missing_rewards':
        return "I'll manually trigger the reward distribution for your account. Please restart your game and check your in-game mailbox within the next 5 minutes. The missing rewards should appear there.";
      case 'technical':
        return "I'll investigate the technical issue you're experiencing. Please try clearing your game cache by going to Settings > General > Clear Cache, then restart the game. This should resolve the issue.";
      case 'purchase':
        return "I'll review your purchase history and ensure all transactions are properly credited to your account. Any missing items or currency will be restored within the next few minutes.";
      default:
        return "I'll investigate and resolve this issue for you. Please restart your game and monitor your account. The issue should be resolved shortly.";
    }
  };

  // Generate compensation text from compensation data
  const generateCompensationText = (compensation: any) => {
    const gold = compensation.suggestedCompensation?.gold || 0;
    const resources = compensation.suggestedCompensation?.resources || {};
    
    let compensationText = '';
    if (gold > 0) {
      compensationText += `I've added ${gold.toLocaleString()} gold to your account`;
    }
    
    const resourceEntries = Object.entries(resources);
    if (resourceEntries.length > 0) {
      const resourceText = resourceEntries.map(([resource, amount]) => 
        `${amount} ${resource}`
      ).join(', ');
      
      if (compensationText) {
        compensationText += ` and ${resourceText}`;
      } else {
        compensationText += `I've added ${resourceText} to your account`;
      }
    }
    
    compensationText += ' as compensation for this inconvenience.';
    
    return compensationText;
  };

  // Handle advancement to next demo scenario
  const handleAdvanceToNextScenario = () => {
    console.log('🔄 RAGChatHandler: Advancing to next demo scenario - performing complete state reset');
    
    // Reset all popup states
    setShowCRMUpdatePopup(false);
    setShowIssueSummaryPopup(false);
    setShowThreePartResponse(false);
    
    // Reset workflow state
    setWorkflowStage('initial');
    
    // Reset data states
    setThreePartData(null);
    setIssueAnalysisData(null);
    setSessionSummary(null);
    
    // Reset approval workflow
    setPendingAiResponse(null);
    setAwaitingApproval(false);
    
    // Reset message tracking
    setMessagesSent(0);
    setSectionsTracker({ summarySent: false, solutionSent: false, compensationSent: false });
    setFollowUpMessagesSent(false);
    setCompensationConfirmationSent(false);
    
    // Reset chat state
    setMessages([]);
    setInput('');
    setInputValue('');
    setIsLoading(false);
    setError(null);
    setWaitingForResponse(false);
    setIsResponseStreaming(false);
    
    console.log('✅ RAGChatHandler: Complete state reset performed for next demo scenario');
    
    // Note: Removed automatic page refresh - users can now manually refresh using the refresh button
  };
  
  // Handle closing CRM popup without advancing scenario
  const handleCloseCRMPopup = () => {
    console.log('❌ Closing CRM popup');
    setShowCRMUpdatePopup(false);
    // Don't reset state - just close the popup and return to chat
  };
  
  // Custom input change handler
  const handleCustomInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    handleInputChange(e);
  };

  // Custom submit handler
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    // Get the current input value
    const currentValue = inputRef.current?.value || inputValue;
    
    if (!currentValue || !currentValue.trim()) {
      console.log("Empty input, not submitting");
      return;
    }
    
    // Set waiting state
    setWaitingForResponse(true);
    setShouldScrollToBottom(true);
    
    // Create a modified event with the current value
    const modifiedEvent = {
      preventDefault: () => {},
      target: {
        message: { value: currentValue },
        form: formRef.current || {
          reset: () => {
            // Reset input after submission
            if (inputRef.current) {
              inputRef.current.value = '';
            }
            setInputValue('');
          }
        }
      }
    } as unknown as React.FormEvent;
    
    // Call the original handler
    originalHandleSubmit(modifiedEvent);
    
    // Clear the input value
    setInputValue('');
  };

  // Handle message sending from three-part response
  const handleSendMessage = (message: string, section: 'summary' | 'solution' | 'compensation') => {
    if (!message || !message.trim()) {
      return;
    }
    
    console.log(`📤 Sending ${section} message:`, message);
    
    // Create assistant message directly
    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: message.trim()
    };
    
    // Add assistant message to chat
    setMessages(prev => {
      console.log('💬 Adding message to chat, current messages:', prev.length);
      return [...prev, assistantMessage];
    });
    
    // Track messages sent and sections
    setMessagesSent(prev => prev + 1);
    setSectionsTracker(prev => {
      const updated = { ...prev };
      
      // Check if this section was already sent to prevent duplicate processing
      if ((section === 'summary' && prev.summarySent) ||
          (section === 'solution' && prev.solutionSent) ||
          (section === 'compensation' && prev.compensationSent)) {
        console.log(`⚠️ Section ${section} already sent, skipping duplicate processing`);
        return prev; // Return unchanged state to prevent duplicate processing
      }
      
      if (section === 'summary') updated.summarySent = true;
      if (section === 'solution') updated.solutionSent = true;
      if (section === 'compensation') updated.compensationSent = true;
      
      // Check if all required sections are sent
      // Only consider all sections sent if we've explicitly sent a compensation section OR there's definitively no compensation
      const hasCompensationData = threePartData?.hasCompensation || (threePartData?.compensation && threePartData.compensation.length > 0);
      const allRequiredSent = updated.summarySent && updated.solutionSent && 
        (hasCompensationData ? updated.compensationSent : true);
      
      console.log('🔍 Section tracking:', {
        summarySent: updated.summarySent,
        solutionSent: updated.solutionSent,
        compensationSent: updated.compensationSent,
        hasCompensationData,
        allRequiredSent,
        section
      });
      
      if (allRequiredSent && !followUpMessagesSent) {
        console.log('🎯 All required sections sent');
        setFollowUpMessagesSent(true); // Prevent duplicate follow-up messages
        
        // If compensation was sent, trigger follow-up workflow instead of CRM
        if (section === 'compensation' && hasCompensationData && !compensationConfirmationSent) {
          console.log('💰 NEW WORKFLOW: Compensation sent - starting follow-up workflow');
          setCompensationConfirmationSent(true); // Prevent duplicate compensation messages
          
          // Add compensation confirmation message first
          setTimeout(() => {
            console.log('📬 NEW WORKFLOW: Adding compensation confirmation message');
            setMessages(prev => {
              // Check if confirmation message already exists to prevent duplicates
              const hasConfirmationMessage = prev.some(msg => 
                msg.content.includes('Your compensation has been sent to your in-game mailbox')
              );
              
              if (hasConfirmationMessage) {
                console.log('⚠️ Compensation confirmation message already exists, skipping duplicate');
                return prev;
              }
              
              return [...prev, {
                id: `system-${Date.now()}`,
                role: 'assistant',
                content: 'Your compensation has been sent to your in-game mailbox. Please allow up to 24 hours for it to appear.'
              }];
            });
            setShouldScrollToBottom(true);
            
            // Then send ticket message and trigger CRM workflow
            setTimeout(() => {
              console.log('🎫 Sending ticket message and triggering CRM workflow');
              setMessages(prev => {
                // Check if follow-up message already exists to prevent duplicates
                const hasFollowUpMessage = prev.some(msg => 
                  msg.content.includes('If the problem persists, please come back and reference ticket')
                );
                
                if (hasFollowUpMessage) {
                  console.log('⚠️ Ticket message already exists, skipping duplicate');
                  return prev;
                }
                
                // Generate random 10-digit ticket ID
                const ticketId = Math.floor(1000000000 + Math.random() * 9000000000);
                
                return [...prev, {
                  id: `assistant-followup-${Date.now()}`,
                  role: 'assistant',
                  content: `If the problem persists, please come back and reference ticket #${ticketId}`
                }];
              });
              setShouldScrollToBottom(true);
              
              // Trigger CRM workflow immediately after ticket message
              setTimeout(() => {
                console.log('📋 Triggering CRM workflow after ticket message');
                handleAllResponsesSent();
              }, 1500);
            }, 2000);
          }, 1000);
        } else {
          // No compensation involved, go directly to CRM
          console.log('📋 No compensation - triggering CRM workflow');
          setTimeout(() => handleAllResponsesSent(), 1500);
        }
      }
      
      return updated;
    });
    
    setShouldScrollToBottom(true);
  };
  
  // Handle acknowledgment of issue summary
  const handleAcknowledgeIssue = () => {
    console.log('✅ Issue acknowledged - showing three-part response');
    console.log('🔍 Current state before acknowledgment:', {
      showThreePartResponse,
      workflowStage,
      hasThreePartData: !!threePartData,
      threePartData: threePartData ? Object.keys(threePartData) : null
    });
    
    setShowIssueSummaryPopup(false);
    setWorkflowStage('acknowledged');
    setShowThreePartResponse(true);
    
    // Debug: Force a state check after setting
    setTimeout(() => {
      console.log('🔍 State after acknowledgment:', {
        showThreePartResponse: true, // should be true now
        workflowStage: 'acknowledged', // should be acknowledged now
        hasThreePartData: !!threePartData,
        threePartData: threePartData ? Object.keys(threePartData) : null
      });
    }, 100);
  };
  
  // Handle completion of all responses (detect when all sections have been sent)
  const handleAllResponsesSent = () => {
    console.log('📬 All responses sent - showing CRM update popup');
    
    // Calculate session duration
    const duration = Date.now() - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    // Prepare session summary
    const summary = {
      playerName: playerContext.playerName || 'Unknown Player',
      issueResolved: true,
      compensationAwarded: threePartData?.hasCompensation ? {
        gold: issueAnalysisData?.compensationDetails?.gold,
        resources: issueAnalysisData?.compensationDetails?.resources,
        tier: issueAnalysisData?.compensationDetails?.tier
      } : undefined,
      messagesExchanged: messagesSent,
      resolutionTime: `${minutes}:${seconds.toString().padStart(2, '0')}`
    };
    
    setSessionSummary(summary);
    setWorkflowStage('responses_sent');
    setShowThreePartResponse(false);
    setShowCRMUpdatePopup(true);
  };
  
  // Handle message sending for input (original functionality)
  const handleSendUserMessage = (message: string) => {
    if (!message || !message.trim() || waitingForResponse || isResponseStreaming) {
      return;
    }
    
    // Normal message handling - no more follow-up stage since we go directly to CRM after ticket
    setInputValue(message);
    
    // Use setTimeout to ensure the input value is set
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.value = message;
      }
      handleSubmit();
    }, 0);
  };

  // Effect for scrolling
  useEffect(() => {
    if (shouldScrollToBottom && scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      setShouldScrollToBottom(false);
    }
  }, [shouldScrollToBottom, messages]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Messages area - 50% of height */}
      <div ref={scrollAreaRef} className="flex-none h-1/2 overflow-y-auto p-4 pb-2 border-b border-gray-200">
        <MessageList 
          messages={messages}
          isResponseStreaming={isResponseStreaming}
        />
      </div>
      
      {/* Three-part response area - 50% of height */}
      <div className="flex-none h-1/2 flex flex-col overflow-hidden">
        {/* Three-part response component - takes remaining space after input */}
        {(showThreePartResponse && threePartData && workflowStage === 'acknowledged') ? (
          <div className="flex-1 border-gray-200 bg-white overflow-y-auto">
            <ThreePartResponse
              problemSummary={threePartData.problemSummary}
              fix={threePartData.solution}
              compensation={threePartData.compensation}
              hasCompensation={threePartData.hasCompensation}
              compensationDetails={issueAnalysisData?.compensationDetails}
              onSendMessage={handleSendMessage}
            />
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleDismissThreePartResponse}
                className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Dismiss All
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">📝</div>
              <div className="font-medium">Three-Part Response</div>
              <div className="text-sm">Responses will appear here after analysis</div>
              <div className="text-xs mt-2 font-mono bg-white p-2 rounded border">
                Debug: showThreePartResponse={String(showThreePartResponse)}, 
                hasThreePartData={String(!!threePartData)}, 
                workflowStage={workflowStage}
              </div>
            </div>
          </div>
        )}
        
        {/* Input area - fixed at bottom of lower half */}
        <div className="flex-shrink-0 border-t border-gray-200">
          <form ref={formRef} onSubmit={handleSubmit}>
            <ChatInput 
              onSendMessage={handleSendUserMessage}
              isResponseStreaming={isResponseStreaming}
              waitingForResponse={waitingForResponse}
              isUserTyping={false}
              placeholder="Type your message..."
              inputRef={inputRef}
              value={inputValue}
              onChange={handleCustomInputChange}
            />
          </form>
          
          {/* Test compensation button for debugging */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <button
              onClick={testCompensation}
              className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
              type="button"
            >
              🧪 Test Compensation Panel
            </button>
          </div>
        </div>
      </div>

      {/* Issue Summary Popup */}
      {issueAnalysisData && (
        <IssueSummaryPopup
          isOpen={showIssueSummaryPopup}
          issueAnalysis={issueAnalysisData.analysisData}
          compensationDetails={issueAnalysisData.compensationDetails}
          onAcknowledge={handleAcknowledgeIssue}
        />
      )}

      {/* CRM Update Popup */}
      {sessionSummary && (
        <CRMUpdatePopup
          isOpen={showCRMUpdatePopup}
          sessionSummary={sessionSummary}
          onCRMUpdate={handleCRMUpdate}
          onComplete={handleAdvanceToNextScenario}
          onClose={handleCloseCRMPopup}
        />
      )}


      {/* Legacy compensation panel with approval workflow - only show if not using three-part response */}
      {!showThreePartResponse && processedCompensationData && !compensationState.dismissed && !compensationState.requested && 
       processedCompensationData.recommendation && processedCompensationData.issue && (
        <div className="sticky bottom-0 left-0 right-0 border-t border-gray-200 bg-white z-10 shadow-md max-h-[30vh] overflow-y-auto">
          <CompensationPanel 
            recommendation={processedCompensationData.recommendation}
            issue={processedCompensationData.issue}
            sentiment={processedCompensationData.sentiment}
            playerContext={{
              playerId: playerId,
              playerName: playerContext.playerName || 'Player',
              gameLevel: playerContext.gameLevel,
              vipLevel: playerContext.vipLevel || 0,
              isSpender: playerContext.isSpender || false,
              freeformContext: playerContext.freeformContext
            } as CompensationPlayerContext}
            onRequestCompensation={handleRequestCompensation}
            onDismiss={handleDismissCompensation}
            // Approval workflow props
            awaitingApproval={awaitingApproval}
            aiSummary={processedCompensationData.aiSummary}
            onApproveCompensation={handleApproveCompensation}
            onRejectCompensation={handleRejectCompensation}
          />
        </div>
      )}
    </div>
  );
} 