'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CompensationRecommendation, IssueDetectionResult, SentimentAnalysisResult } from '@/lib/compensation';
import { CompensationTier } from '@/lib/models';
import { CompensationService } from '@/lib/compensation-service';

interface CompensationPanelProps {
  recommendation: CompensationRecommendation;
  issue: IssueDetectionResult;
  sentiment?: SentimentAnalysisResult;
  playerContext: {
    playerId?: string;
    playerName?: string;
    gameLevel: number;
    vipLevel?: number;
    isSpender?: boolean;
    freeformContext?: string;
  };
  onRequestCompensation: (requestId: string, status: string) => void;
  onDismiss: () => void;
  // New props for approval workflow
  aiSummary?: string;
  awaitingApproval?: boolean;
  onApproveCompensation?: () => void;
  onRejectCompensation?: () => void;
  onApproveAndSend?: () => void;
  onReject?: () => void;
}

/**
 * Component for agents to review and approve player compensation
 */
export default function CompensationPanel({
  recommendation,
  issue,
  sentiment,
  playerContext,
  onRequestCompensation,
  onDismiss,
  aiSummary,
  awaitingApproval = false,
  onApproveCompensation,
  onRejectCompensation,
  onApproveAndSend,
  onReject
}: CompensationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [requestState, setRequestState] = useState<'initial' | 'confirming' | 'processing' | 'completed'>('initial');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Replace useState with useRef for callback tracking
  const callbackFiredRef = useRef(false);
  
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  const [showContactWrap, setShowContactWrap] = useState(false);
  // Add state for CRM update process
  const [crmUpdateState, setCrmUpdateState] = useState<'idle' | 'loading' | 'success'>('idle');
  
  // Use CompensationService static methods
  
  // Maps compensation tiers to severity labels and colors
  const tierInfo = {
    [CompensationTier.P0]: { label: 'Critical', color: '#d32f2f', bg: '#ffebee' },
    [CompensationTier.P1]: { label: 'Severe', color: '#f57c00', bg: '#fff3e0' },
    [CompensationTier.P2]: { label: 'Moderate', color: '#fbc02d', bg: '#fffde7' },
    [CompensationTier.P3]: { label: 'Minor', color: '#7cb342', bg: '#f1f8e9' },
    [CompensationTier.P4]: { label: 'Minimal', color: '#0288d1', bg: '#e1f5fe' },
    [CompensationTier.P5]: { label: 'None', color: '#757575', bg: '#f5f5f5' }
  };
  
  // Ensure we have a valid tier, defaulting to P5 if tier is undefined
  const currentTier = recommendation.tier && tierInfo[recommendation.tier] 
    ? tierInfo[recommendation.tier] 
    : tierInfo[CompensationTier.P5];
  
  // Check if compensation was denied (no gold and no resources)
  const isCompensationDenied = !recommendation.suggestedCompensation?.gold && 
                              !Object.keys(recommendation.suggestedCompensation?.resources || {}).length;
  
  // Auto-expand the panel when no compensation and show metrics
  useEffect(() => {
    if (isCompensationDenied) {
      setIsExpanded(true);
      // Also show metrics for denied recommendations
      setShowPerformanceMetrics(true);
      setShowContactWrap(true);
    }
  }, [isCompensationDenied]);
  
  // Create dedicated functions for triggering callbacks
  const triggerCompensationCallback = (reqId: string, status: string) => {
    if (callbackFiredRef.current) return; // Guard against multiple calls
    
    callbackFiredRef.current = true;
    onRequestCompensation(reqId, status);
    console.log('Compensation callback triggered with status:', status);
  };
  
  const handleDismiss = () => {
    if (callbackFiredRef.current) return;
    
    callbackFiredRef.current = true;
    setShowPerformanceMetrics(true);
    onDismiss();
    console.log('Compensation dismissed: triggering final message flow');
  };
  
  // If we have a requestId, check its status periodically
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const checkStatus = async () => {
      if (!requestId) return;
      
      try {
        const request = await CompensationService.getCompensationRequest(requestId);
        if (!request) return;
        
        setRequestStatus(request.status);
        
        if (request.status === 'approved' || request.status === 'rejected') {
          clearInterval(intervalId);
          // Update state in a single batch
          setRequestState('completed');
          setShowPerformanceMetrics(true);
          setShowContactWrap(true);
        }
      } catch (error) {
        console.error('Error checking request status:', error);
      }
    };
    
    if (requestId && requestState === 'processing') {
      // Check status immediately and then every 3 seconds
      checkStatus();
      intervalId = setInterval(checkStatus, 3000);
    }
    
    return () => {
      clearInterval(intervalId);
    };
  }, [requestId, requestState]);
  
  const handleRequestClick = () => {
    setRequestState('confirming');
  };
  
  const handleConfirmRequest = async () => {
    setRequestState('processing');
    setError(null);
    
    try {
      // Get player information for the request
      const playerId = playerContext.playerId || 'anonymous';
      const playerName = playerContext.playerName || 'Anonymous Player';
      const gameLevel = playerContext.gameLevel;
      const vipLevel = playerContext.vipLevel || 0;
      const isSpender = playerContext.isSpender || false;
      
      // Submit the request to the API
      const result = await CompensationService.submitCompensationRequest(
        playerId,
        playerName,
        gameLevel,
        vipLevel,
        isSpender,
        issue,
        recommendation
      );
      
      setRequestId(result.requestId);
      setRequestStatus(result.status);
      
      // For demo purposes, simulate a processing delay
      // In a real implementation, this would be handled by the server
      const delay = recommendation.requiresHumanReview ? 5000 : 3000;
      
      // If it's a P2-P5 issue (not requiring human review), automatically approve it
      if (!recommendation.requiresHumanReview) {
        setTimeout(async () => {
          try {
            await CompensationService.updateCompensationRequestStatus(
              result.requestId,
              'approved',
              'Automated System',
              'Automatically approved based on issue severity and system guidelines.'
            );
            
            // Update all state in one batch before triggering callback
            setRequestState('completed');
            setShowPerformanceMetrics(true);
            setShowContactWrap(true);
            
            // Then trigger callback once
            triggerCompensationCallback(result.requestId, 'approved');
          } catch (error) {
            console.error('Error auto-approving request:', error);
            setError('Failed to process the request. Please try again.');
          }
        }, delay);
      } else {
        // For P0-P1 issues, notify that it requires human review
        setRequestState('processing');
        
        // Even for requests requiring review, we want to complete the demo
        setTimeout(() => {
          // Update all state first
          setRequestState('completed');
          setShowPerformanceMetrics(true);
          setShowContactWrap(true);
          
          // Then trigger callback once
          triggerCompensationCallback(result.requestId, 'approved');
        }, delay);
      }
    } catch (error) {
      console.error('Error submitting compensation request:', error);
      setError('Failed to submit the request. Please try again.');
      setRequestState('initial');
    }
  };
  
  const handleCancelRequest = () => {
    setRequestState('initial');
    setError(null);
  };
  
  // Format a resources object for display
  const formatResources = (resources: any) => {
    if (!resources) return null;
    
    return Object.entries(resources).map(([key, value]) => {
      if (!value) return null;
      return (
        <div key={key} className="resource-item">
          <span className="resource-value">{value as React.ReactNode}</span>
          <span className="resource-name"> {key.charAt(0).toUpperCase() + key.slice(1)}</span>
        </div>
      );
    });
  };
  
  const issueDescription = issue.description || "Unspecified issue";
  
  // Fixed sentiment property access to match SentimentAnalysisResult interface
  const sentimentLevel = sentiment ? 
    (sentiment.tone === 'angry' || sentiment.tone === 'frustrated' ? 'High frustration detected' : 
    (sentiment.urgency === 'high' ? 'High urgency detected' : '')) : '';
  
  return (
    <div className={`compensation-panel ${requestState !== 'initial' ? 'processing' : ''}`}>
      
      <div 
        className="compensation-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          backgroundColor: currentTier.bg,
          borderColor: currentTier.color
        }}
      >
        <div className="issue-indicator">
          {isCompensationDenied ? (
            <span 
              className="severity-badge"
              style={{ backgroundColor: '#d32f2f' }}
            >
              NOT RECOMMENDED
            </span>
          ) : (
            <span 
              className="severity-badge"
              style={{ backgroundColor: currentTier.color }}
            >
              {currentTier.label}
            </span>
          )}
          <h3>
            {isCompensationDenied
              ? "Compensation Not Recommended" 
              : issueDescription}
          </h3>
          
          {/* Add VIP badge for high-tier VIP players */}
          {playerContext.vipLevel && playerContext.vipLevel >= 5 && (
            <span className="vip-badge">VIP {playerContext.vipLevel}</span>
          )}
          
          {/* Add spender badge */}
          {playerContext.isSpender && (
            <span className="spender-badge">Spender</span>
          )}
        </div>
        
        <button className="expand-button">
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      
      {/* Quick action buttons when collapsed */}
      {!isExpanded && !isCompensationDenied && (
        <div className="condensed-actions">
          <div className="condensed-info">
            <span className="condensed-player">Player: {playerContext.playerName} (Lvl {playerContext.gameLevel})</span>
            <span className="condensed-compensation">
              {recommendation.suggestedCompensation?.gold ? `${recommendation.suggestedCompensation.gold} Gold` : ''} 
              {(recommendation.suggestedCompensation as any)?.gems ? ` • ${(recommendation.suggestedCompensation as any).gems} Gems` : ''}
            </span>
          </div>

        </div>
      )}
      
      {isExpanded && (
        <div className="compensation-details">
          {isCompensationDenied ? (
            // Special view for denied claims
            <div className="denied-claim">
              <div className="issue-description">
                <div className="declined-notice">
                  <div className="declined-icon">❌</div>
                  <h4>System does not recommend compensation</h4>
                </div>
                <p>{recommendation.reasoning}</p>
              </div>
              
              {(recommendation as any).evidenceExists && (
                <div className="evidence-section">
                  <h4>System Evidence</h4>
                  <div className="evidence-item">
                    <div className="evidence-icon">📝</div>
                    <div className="evidence-content">
                      <p>Transaction logs show successful delivery of rewards to player's account.</p>
                      {playerContext.freeformContext && playerContext.freeformContext.includes("transaction ID") && (
                        <p className="evidence-detail">Transaction ID: {playerContext.freeformContext.includes("ALV-2345681") ? "ALV-2345681" : "Unknown"} found in context notes.</p>
                      )}
                      {playerContext.freeformContext && playerContext.freeformContext.includes("opened") && (
                        <p className="evidence-detail">Mail was opened and claimed approximately 4 hours ago.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
             
              
              <div className="action-buttons">
                <button 
                  className="dismiss-button"
                  onClick={handleDismiss}
                >
                  Dismiss
                </button>
              </div>
              

              
            </div>
          ) : (
            <>
              {/* AI Analysis Summary - only show when awaiting approval */}
              {awaitingApproval && aiSummary && (
                <div className="ai-summary-section">
                  <div className="ai-summary-header">
                    <h4>🤖 AI Analysis Summary</h4>
                    <span className="approval-badge">Awaiting Approval</span>
                  </div>
                  <div className="ai-summary-content">
                    <p>{aiSummary}</p>
                  </div>
                </div>
              )}
              
              <div className="issue-description">
                <p>{(issue as any).rootCause || "Player is experiencing a system issue."}</p>
              </div>
              
              {/* Simplified Player Context */}
              <div className="player-summary">
                <div className="player-summary-header">
                  <h4>Player: {playerContext.playerName || "Unknown"} (Level {playerContext.gameLevel})
                  {playerContext.vipLevel ? `, VIP ${playerContext.vipLevel}` : ''}</h4>
                  {sentimentLevel && <span className="high-frustration">{sentimentLevel}</span>}
                </div>
              </div>
              
              {/* Condensed compensation offer */}
              <div className="compensation-offer">
                <h4>Recommended Compensation</h4>
                <div className="offer-details">
                  <div className="compensation-items-grid">
                    {recommendation.suggestedCompensation?.gold && (
                      <div className="compensation-item">
                        <div className="item-icon">🪙</div>
                        <div className="item-details">
                          <span className="item-amount">{recommendation.suggestedCompensation.gold}</span>
                          <span className="item-name">Gold</span>
                        </div>
                      </div>
                    )}
                    
                    {(recommendation.suggestedCompensation as any)?.gems && (
                      <div className="compensation-item">
                        <div className="item-icon">💎</div>
                        <div className="item-details">
                          <span className="item-amount">{(recommendation.suggestedCompensation as any).gems}</span>
                          <span className="item-name">Gems</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Other items shown in a more compact format */}
                    {recommendation.suggestedCompensation?.items && recommendation.suggestedCompensation.items.length > 0 && (
                      <div className="compensation-item">
                        <div className="item-icon">🎁</div>
                        <div className="item-details">
                          <span className="item-name">{recommendation.suggestedCompensation.items.length} Items</span>
                        </div>
                      </div>
                    )}
                    
                    {recommendation.suggestedCompensation?.resources && (
                      <div className="compensation-item">
                        <div className="item-icon">📦</div>
                        <div className="item-details">
                          <span className="item-name">Resources</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Request buttons */}
              <div className="action-buttons">
                {awaitingApproval ? (
                  /* Approval workflow buttons */
                  <>
                    <button 
                      className="approve-send-button"
                      onClick={() => {
                        console.log('🚀 Approving compensation and sending response');
                        if (onApproveCompensation) {
                          onApproveCompensation();
                        }
                      }}
                    >
                      ✅ Approve & Send Response
                    </button>
                    <button 
                      className="reject-button"
                      onClick={() => {
                        console.log('❌ Rejecting compensation');
                        if (onRejectCompensation) {
                          onRejectCompensation();
                        }
                      }}
                    >
                      ❌ Reject & Modify
                    </button>
                  </>
                ) : requestState === 'initial' ? (
                  /* Normal compensation buttons */
                  <>
                    <button 
                      className="request-button"
                      onClick={handleRequestClick}
                    >
                      Approve Compensation
                    </button>
                    <button 
                      className="dismiss-button"
                      onClick={handleDismiss}
                    >
                      Dismiss
                    </button>
                  </>
                ) : null}
                
                {requestState === 'confirming' && (
                  <div className="confirm-dialog">
                    <p>Send this compensation to the player?</p>
                    <div className="confirm-actions">
                      <button 
                        className="confirm-button"
                        onClick={handleConfirmRequest}
                      >
                        Confirm
                      </button>
                      <button 
                        className="cancel-button"
                        onClick={handleCancelRequest}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {requestState === 'processing' && (
                  <div className="processing-state">
                    <div className="processing-spinner"></div>
                    <p>Processing compensation request...</p>
                  </div>
                )}
                
                {requestState === 'completed' && requestStatus === 'success' && (
                  <div className="success-message">
                    <div className="success-icon">✅</div>
                    <p>Compensation request submitted successfully!</p>
                  </div>
                )}
                
                {requestState === 'completed' && requestStatus === 'error' && (
                  <div className="error-message">
                    <div className="error-icon">⚠️</div>
                    <p>{error || "An error occurred while processing your request."}</p>
                  </div>
                )}
              </div>
              
              {/* Add performance metrics section */}
              {showPerformanceMetrics && (
                <div className="agent-performance">
                  <h4>Performance Metrics</h4>
                  <div className="metrics-grid">
                    <div className="metric-item">
                      <span className="metric-label">Resolution Time</span>
                      <span className="metric-value">1:24</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">First Response Time</span>
                      <span className="metric-value">0:12</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Customer Satisfaction</span>
                      <span className="metric-value">94%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Resolution Rate</span>
                      <span className="metric-value">98%</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Add contact wrap section */}
              {showContactWrap && (
                <div className="after-contact-wrap">
                  <h4>Contact Wrap</h4>
                  <div className="contact-summary">
                    <p>Issue has been {requestState === 'completed' ? 'resolved' : 'dismissed'} and player has been notified.</p>
                  </div>
                  {crmUpdateState === 'idle' && (
                    <button 
                      className="crm-update-button"
                      onClick={() => {
                        // Debug log to verify the button click is registered
                        console.log('CRM Update button clicked');
                        
                        // Set loading state
                        setCrmUpdateState('loading');
                        
                        // Simulate API call with timeout
                        setTimeout(() => {
                          // Update to success state
                          setCrmUpdateState('success');
                          console.log('CRM updated with issue resolution');
                          
                          // Wait a moment before dismissing
                          setTimeout(() => {
                            // Use the dedicated handleDismiss function
                            handleDismiss();
                          }, 1500);
                        }, 1000);
                      }}
                    >
                      Update CRM & Ticketing System
                    </button>
                  )}
                  
                  {crmUpdateState === 'loading' && (
                    <div className="crm-loading">
                      <div className="processing-spinner"></div>
                      <span>Updating CRM...</span>
                    </div>
                  )}
                  
                  {crmUpdateState === 'success' && (
                    <div className="crm-success">
                      <div className="success-icon">✅</div>
                      <span>CRM Updated Successfully</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Add conversation summary */}
              {showPerformanceMetrics && (
                <div className="conversation-summary">
                  <h4>Conversation Summary</h4>
                  <div className="conversation-timeline">
                    <div className="conversation-message player">
                      <span className="message-sender">Player</span>
                      <p>I didn't receive my rewards from the event mission. Can you please help?</p>
                    </div>
                    <div className="conversation-message agent">
                      <span className="message-sender">Agent</span>
                      <p>I understand your concern about the missing rewards. Let me check this for you right away.</p>
                    </div>
                    <div className="conversation-message player">
                      <span className="message-sender">Player</span>
                      <p>Thank you, I completed all the requirements but got nothing.</p>
                    </div>
                    <div className="conversation-message agent">
                      <span className="message-sender">Agent</span>
                      <p>I've verified your account and confirmed the issue. I've processed compensation that you should receive shortly.</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
      
      <style jsx>{`
        /* Existing styles from the component plus any additional agent-focused styling */
        .compensation-panel {
          background-color: #fff;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          margin-bottom: 0;
          overflow: hidden;
          width: 100%;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: relative;
        }
        
        .agent-badge {
          position: absolute;
          top: 0;
          right: 0;
          background-color: #6366f1;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 6px;
          border-bottom-left-radius: 4px;
          letter-spacing: 0.5px;
          z-index: 10;
        }
        
        .compensation-header {
          padding: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          border-left: 4px solid;
        }
        
        .issue-indicator {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .severity-badge {
          padding: 3px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          color: white;
          margin-right: 8px;
        }
        
        .issue-indicator h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }
        
        .vip-badge {
          background-color: #4c1d95;
          color: white;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }
        
        .spender-badge {
          background-color: #047857;
          color: white;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }
        
        .expand-button {
          background: none;
          border: none;
          font-size: 12px;
          color: #6b7280;
          cursor: pointer;
        }
        
        /* Condensed view styles */
        .condensed-actions {
          padding: 8px 12px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .condensed-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .condensed-player {
          font-size: 12px;
          font-weight: 500;
          color: #374151;
        }
        
        .condensed-compensation {
          font-size: 11px;
          color: #6b7280;
        }
        
        .condensed-buttons {
          display: flex;
          gap: 6px;
        }
        
        .request-button-small {
          padding: 4px 8px;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          font-size: 12px;
          cursor: pointer;
        }
        
        .dismiss-button-small {
          padding: 4px 8px;
          background-color: white;
          color: #6b7280;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-weight: 500;
          font-size: 12px;
          cursor: pointer;
        }
        
        .compensation-details {
          padding: 12px;
          border-top: 1px solid #e5e7eb;
        }
        
        .issue-description {
          margin-bottom: 12px;
          font-size: 13px;
          color: #374151;
        }
        
        .player-summary {
          background-color: #f9fafb;
          padding: 10px;
          border-radius: 6px;
          margin-bottom: 12px;
        }
        
        .player-summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .player-summary h4 {
          margin: 0;
          font-size: 13px;
          color: #4b5563;
        }
        
        .high-frustration {
          color: #b91c1c;
          font-size: 12px;
        }
        
        .compensation-offer {
          margin-bottom: 12px;
        }
        
        .compensation-offer h4 {
          margin: 0 0 8px 0;
          font-size: 13px;
          color: #111827;
        }
        
        .compensation-items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 8px;
        }
        
        .compensation-item {
          display: flex;
          align-items: center;
          background-color: #f9fafb;
          padding: 6px;
          border-radius: 4px;
        }
        
        .item-icon {
          font-size: 16px;
          margin-right: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
        }
        
        .item-details {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
        }
        
        .item-amount {
          font-weight: 600;
          font-size: 13px;
          color: #111827;
          margin-right: 4px;
        }
        
        .item-name {
          font-size: 12px;
          color: #4b5563;
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        
        .request-button {
          padding: 6px 12px;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          font-size: 13px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .request-button:hover {
          background-color: #1d4ed8;
        }
        
        .dismiss-button {
          padding: 6px 12px;
          background-color: white;
          color: #6b7280;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-weight: 500;
          font-size: 13px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .dismiss-button:hover {
          background-color: #f9fafb;
        }
        
        .confirm-dialog {
          background-color: #f9fafb;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          width: 100%;
        }
        
        .confirm-dialog p {
          margin: 0 0 8px 0;
          font-size: 13px;
          font-weight: 500;
        }
        
        .confirm-actions {
          display: flex;
          gap: 8px;
        }
        
        .confirm-button {
          padding: 5px 10px;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          font-size: 12px;
          cursor: pointer;
        }
        
        .cancel-button {
          padding: 5px 10px;
          background-color: white;
          color: #6b7280;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-weight: 500;
          font-size: 12px;
          cursor: pointer;
        }
        
        .processing-state {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .processing-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #d1d5db;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: spinner 0.8s linear infinite;
        }
        
        @keyframes spinner {
          to {
            transform: rotate(360deg);
          }
        }
        
        .success-message, .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          width: 100%;
        }
        
        .success-icon, .error-icon {
          font-size: 16px;
        }
        
        .denied-claim {
          color: #4b5563;
        }
        
        .declined-notice {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .declined-icon {
          font-size: 16px;
          color: #dc2626;
        }
        
        .declined-notice h4 {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: #dc2626;
        }
        
        .evidence-section {
          margin-top: 12px;
        }
        
        .evidence-section h4 {
          margin: 0 0 6px 0;
          font-size: 13px;
          color: #4b5563;
        }
        
        .evidence-item {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          background-color: #f9fafb;
          padding: 8px;
          border-radius: 4px;
        }
        
        .evidence-icon {
          font-size: 14px;
          color: #6b7280;
        }
        
        .evidence-content {
          flex: 1;
        }
        
        .evidence-content p {
          margin: 0;
          font-size: 12px;
        }
        
        .evidence-detail {
          font-size: 11px;
          color: #6b7280;
          margin-top: 3px !important;
        }
        
        /* AI Summary Section Styles */
        .ai-summary-section {
          margin-bottom: 16px;
          padding: 12px;
          background-color: #f0f9ff;
          border-radius: 6px;
          border: 1px solid #0ea5e9;
        }
        
        .ai-summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .ai-summary-header h4 {
          margin: 0;
          font-size: 14px;
          color: #0c4a6e;
          font-weight: 600;
        }
        
        .approval-badge {
          background-color: #f59e0b;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .ai-summary-content {
          font-size: 13px;
          color: #374151;
          line-height: 1.4;
        }
        
        .ai-summary-content p {
          margin: 0;
        }
        
        /* Approval Workflow Button Styles */
        .approve-send-button {
          padding: 8px 16px;
          background-color: #10b981;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .approve-send-button:hover {
          background-color: #059669;
        }
        
        .reject-button {
          padding: 8px 16px;
          background-color: #dc2626;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .reject-button:hover {
          background-color: #b91c1c;
        }

        /* New styles for the after contact wrap and performance metrics */
        .after-contact-wrap {
          margin-top: 16px;
          padding: 12px;
          background-color: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        
        .after-contact-wrap h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #111827;
          font-weight: 600;
        }
        
        .contact-summary {
          font-size: 13px;
          color: #4b5563;
          margin-bottom: 12px;
        }
        
        .crm-update-button {
          padding: 6px 12px;
          background-color: #4f46e5;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 500;
          font-size: 13px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .crm-update-button:hover {
          background-color: #4338ca;
        }
        
        .agent-performance {
          margin-top: 16px;
          padding: 12px;
          background-color: #f0f9ff;
          border-radius: 6px;
          border: 1px solid #bae6fd;
        }
        
        .agent-performance h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #0c4a6e;
          font-weight: 600;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
        
        .metric-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          background-color: white;
          border-radius: 4px;
          border: 1px solid #e0f2fe;
        }
        
        .metric-label {
          font-size: 12px;
          color: #0369a1;
          font-weight: 500;
        }
        
        .metric-value {
          font-size: 13px;
          color: #111827;
          font-weight: 600;
        }
        
        /* Add conversation summary styles */
        .conversation-summary {
          margin-top: 16px;
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
        }
        
        .conversation-summary h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #111827;
          font-weight: 600;
        }
        
        .conversation-timeline {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 300px;
          overflow-y: auto;
          padding-right: 8px;
        }
        
        .conversation-message {
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          line-height: 1.4;
          position: relative;
        }
        
        .conversation-message.player {
          background-color: #f3f4f6;
          align-self: flex-start;
          max-width: 85%;
          border-bottom-left-radius: 2px;
        }
        
        .conversation-message.agent {
          background-color: #e0f2fe;
          align-self: flex-end;
          max-width: 85%;
          border-bottom-right-radius: 2px;
        }
        
        .message-sender {
          font-weight: 600;
          font-size: 11px;
          display: block;
          margin-bottom: 4px;
          color: #4b5563;
        }
        
        .conversation-message p {
          margin: 0;
          color: #111827;
        }
        
        /* Add styles for CRM update states */
        .crm-loading, .crm-success {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 13px;
          margin-top: 4px;
        }
        
        .crm-loading {
          background-color: #f3f4f6;
          color: #4b5563;
        }
        
        .crm-success {
          background-color: #ecfdf5;
          color: #065f46;
        }
      `}</style>
    </div>
  );
} 