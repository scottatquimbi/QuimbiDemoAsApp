'use client';

import React, { useState } from 'react';

interface CRMUpdatePopupProps {
  isOpen: boolean;
  sessionSummary: {
    playerName: string;
    issueResolved: boolean;
    compensationAwarded?: {
      gold?: number;
      resources?: any;
      tier: string;
    };
    messagesExchanged: number;
    resolutionTime: string;
  };
  onCRMUpdate: () => void;
  onComplete: () => void;
  onClose?: () => void;
}

export default function CRMUpdatePopup({
  isOpen,
  sessionSummary,
  onCRMUpdate,
  onComplete,
  onClose
}: CRMUpdatePopupProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateComplete, setUpdateComplete] = useState(false);

  if (!isOpen) return null;

  const handleUpdateCRM = async () => {
    setIsUpdating(true);
    
    // Create ticket for this support session
    try {
      const ticketData = {
        player_id: 'lannister-gold', // TODO: get from session data
        title: sessionSummary.compensationAwarded ? 
          `Support request with ${sessionSummary.compensationAwarded.tier} compensation` : 
          'General support request',
        description: sessionSummary.compensationAwarded ? 
          `Player received ${sessionSummary.compensationAwarded.tier} tier compensation during support interaction.` : 
          'Support interaction completed.',
        category: sessionSummary.compensationAwarded ? 'compensation' : 'general',
        priority: sessionSummary.compensationAwarded ? 'medium' : 'low',
        status: 'resolved',
        resolution_summary: sessionSummary.compensationAwarded ? 
          `Issue resolved with ${sessionSummary.compensationAwarded.tier} compensation package` : 
          'Issue resolved through standard support',
        compensation_awarded: sessionSummary.compensationAwarded || null,
        chat_summary: `Support session completed in ${sessionSummary.resolutionTime} with ${sessionSummary.messagesExchanged} messages. ${sessionSummary.issueResolved ? 'Issue successfully resolved.' : 'Session ended without full resolution.'}`,
        key_issues: sessionSummary.compensationAwarded ? ['compensation_request', 'customer_support'] : ['general_inquiry'],
        player_sentiment: sessionSummary.issueResolved ? 'satisfied' : 'neutral',
        outcome_rating: sessionSummary.issueResolved ? 'successful' : 'partially_resolved',
        resolution_time_minutes: parseInt(sessionSummary.resolutionTime.split(':')[0]) * 60 + parseInt(sessionSummary.resolutionTime.split(':')[1]) || 15,
        tags: sessionSummary.compensationAwarded ? 
          ['support', 'compensation', sessionSummary.compensationAwarded.tier] : 
          ['support', 'general']
      };

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🎫 Ticket created:', result.ticket_id);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
    }
    
    // Simulate CRM update API call
    setTimeout(() => {
      setIsUpdating(false);
      setUpdateComplete(true);
      onCRMUpdate();
      
      // Note: Removed auto-advance - user can manually close or continue
    }, 1500);
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <div className="popup-header">
          <h2>📊 Session Complete</h2>
          <div className="header-right">
            <span className="status-badge">
              {sessionSummary.issueResolved ? '✅ Resolved' : '⏳ In Progress'}
            </span>
            {onClose && (
              <button onClick={onClose} className="close-button" title="Close">
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="session-summary">
          <h3>🗂️ Session Summary</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="label">Player:</span>
              <span className="value">{sessionSummary.playerName}</span>
            </div>
            <div className="summary-item">
              <span className="label">Resolution Time:</span>
              <span className="value">{sessionSummary.resolutionTime}</span>
            </div>
            <div className="summary-item">
              <span className="label">Messages:</span>
              <span className="value">{sessionSummary.messagesExchanged}</span>
            </div>
            <div className="summary-item">
              <span className="label">Status:</span>
              <span className={`value status-${sessionSummary.issueResolved ? 'resolved' : 'pending'}`}>
                {sessionSummary.issueResolved ? 'Issue Resolved' : 'Pending Resolution'}
              </span>
            </div>
          </div>

          {sessionSummary.compensationAwarded && (
            <div className="compensation-awarded">
              <h4>💰 Compensation Awarded</h4>
              <div className="compensation-details">
                <span className="tier">Tier: {sessionSummary.compensationAwarded.tier}</span>
                {sessionSummary.compensationAwarded.gold && (
                  <span className="gold">{sessionSummary.compensationAwarded.gold} Gold</span>
                )}
                {sessionSummary.compensationAwarded.resources && Object.keys(sessionSummary.compensationAwarded.resources).length > 0 && (
                  <span className="resources">
                    + Resources: {Object.entries(sessionSummary.compensationAwarded.resources).map(([key, value]) => 
                      `${value} ${key}`
                    ).join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="performance-metrics">
          <h3>📈 Performance Metrics</h3>
          <div className="metrics-grid">
            <div className="metric">
              <span className="metric-value">1:24</span>
              <span className="metric-label">Avg Response Time</span>
            </div>
            <div className="metric">
              <span className="metric-value">98%</span>
              <span className="metric-label">Customer Satisfaction</span>
            </div>
            <div className="metric">
              <span className="metric-value">3.2</span>
              <span className="metric-label">Messages to Resolution</span>
            </div>
          </div>
        </div>

        {!updateComplete ? (
          <div className="popup-actions">
            <button 
              onClick={handleUpdateCRM}
              disabled={isUpdating}
              className="update-crm-button"
            >
              {isUpdating ? (
                <>
                  <div className="spinner"></div>
                  Updating CRM...
                </>
              ) : (
                <>
                  📝 Update CRM & Ticketing System
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="completion-status">
            <div className="success-icon">✅</div>
            <span>CRM Updated Successfully</span>
            <div className="popup-actions">
              <button onClick={onClose || onComplete} className="close-button-large">
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }

        .popup-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 700px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          border: 1px solid #e5e7eb;
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f3f4f6;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .popup-header h2 {
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 600;
        }

        .status-badge {
          background: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .session-summary {
          margin-bottom: 24px;
        }

        .session-summary h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        .label {
          font-weight: 500;
          color: #6b7280;
          font-size: 14px;
        }

        .value {
          color: #111827;
          font-size: 14px;
          font-weight: 500;
        }

        .status-resolved { color: #059669; }
        .status-pending { color: #d97706; }

        .compensation-awarded {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 12px;
        }

        .compensation-awarded h4 {
          margin: 0 0 8px 0;
          color: #92400e;
          font-size: 14px;
          font-weight: 600;
        }

        .compensation-details {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .tier {
          background: #92400e;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .gold {
          background: #d97706;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .resources {
          background: #065f46;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .performance-metrics {
          margin-bottom: 24px;
        }

        .performance-metrics h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .metric {
          text-align: center;
          padding: 12px;
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 6px;
        }

        .metric-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: #0c4a6e;
          margin-bottom: 4px;
        }

        .metric-label {
          font-size: 12px;
          color: #0369a1;
          font-weight: 500;
        }

        .popup-actions {
          display: flex;
          justify-content: center;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .update-crm-button {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .update-crm-button:hover:not(:disabled) {
          background: #4338ca;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(79, 70, 229, 0.4);
        }

        .update-crm-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .completion-status {
          text-align: center;
          padding: 20px;
          color: #059669;
        }

        .success-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 18px;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .close-button-large {
          background: #6b7280;
          color: white;
          border: none;
          padding: 8px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .close-button-large:hover {
          background: #4b5563;
        }
      `}</style>
    </div>
  );
}