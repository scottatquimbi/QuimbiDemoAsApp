'use client';

import React, { useState, useEffect } from 'react';

interface AutomatedResolution {
  success: boolean;
  ticketId: string;
  resolution: {
    category: string;
    actions: string[];
    compensation?: {
      gold?: number;
      resources?: any;
      items?: any[];
      description: string;
    };
    timeline: string;
    followUpInstructions: string;
  };
  escalationReason?: string;
}

interface PlayerProfile {
  player_id: string;
  player_name: string;
  game_level: number;
  vip_level: number;
  is_spender: boolean;
  total_spend: number;
  session_days: number;
  kingdom_id?: number;
  alliance_name?: string;
}

interface AutomatedResolutionDisplayProps {
  resolution: AutomatedResolution;
  playerProfile: PlayerProfile;
  onStartOver: () => void;
  onContactAgent: () => void;
}

export default function AutomatedResolutionDisplay({ 
  resolution, 
  playerProfile, 
  onStartOver, 
  onContactAgent 
}: AutomatedResolutionDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyTicketId = () => {
    navigator.clipboard.writeText(resolution.ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatResources = (resources: any) => {
    if (!resources) return [];
    return Object.entries(resources).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      amount: String(value)
    }));
  };

  return (
    <div className="resolution-container">
      {resolution.success ? (
        <>
          {/* Success Header */}
          <div className="success-header">
            <div className="status-indicator success"></div>
            <h1>Issue Resolved</h1>
            <p>Your support request has been processed automatically</p>
          </div>

          {/* Ticket Reference */}
          <div className="ticket-reference">
            <div className="ticket-header">
              <h3>Support Ticket Reference</h3>
            </div>
            <div className="ticket-id-section">
              <div className="ticket-id-display">
                <span className="ticket-label">Ticket</span>
                <span className="ticket-number">{resolution.ticketId}</span>
                <button className="copy-button" onClick={copyTicketId}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="ticket-note">
                Save this ticket number for your records. Reference it if you need further assistance.
              </p>
            </div>
          </div>

          {/* Resolution Summary */}
          <div className="resolution-summary">
            <h3>Resolution Details</h3>
            <div className="category-badge">
              {resolution.resolution.category}
            </div>
            <div className="actions-list">
              {resolution.resolution.actions.map((action, index) => (
                <div key={index} className="action-item">
                  <span className="action-number">{index + 1}</span>
                  <span className="action-text">{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compensation Section */}
          {resolution.resolution.compensation && (
            <div className="compensation-section">
              <h3>Compensation Added</h3>
              <p className="compensation-description">
                {resolution.resolution.compensation.description}
              </p>
              <div className="compensation-items">
                {resolution.resolution.compensation.gold && (
                  <div className="compensation-item gold">
                    <div className="item-indicator gold-indicator"></div>
                    <span className="item-amount">{resolution.resolution.compensation.gold.toLocaleString()}</span>
                    <span className="item-name">Gold</span>
                  </div>
                )}
                
                {resolution.resolution.compensation.resources && 
                  formatResources(resolution.resolution.compensation.resources).map((resource, index) => (
                    <div key={index} className="compensation-item resource">
                      <div className="item-indicator resource-indicator"></div>
                      <span className="item-amount">{resource.amount}</span>
                      <span className="item-name">{resource.name}</span>
                    </div>
                  ))
                }
                
                {resolution.resolution.compensation.items && 
                  resolution.resolution.compensation.items.map((item, index) => (
                    <div key={index} className="compensation-item item">
                      <div className="item-indicator item-indicator"></div>
                      <span className="item-amount">{item.quantity}x</span>
                      <span className="item-name">{item.name}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Timeline & Instructions */}
          <div className="instructions-section">
            <div className="timeline-info">
              <h4>Timeline</h4>
              <p>{resolution.resolution.timeline}</p>
            </div>
            
            <div className="follow-up-info">
              <h4>Next Steps</h4>
              <p>{resolution.resolution.followUpInstructions}</p>
            </div>
          </div>

          {/* VIP Status Acknowledgment */}
          {playerProfile.vip_level > 0 && (
            <div className="vip-section">
              <div className="vip-badge">
                VIP {playerProfile.vip_level} Priority Service
              </div>
              <p>As a VIP player, your issue received priority processing and enhanced compensation.</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="primary-button" onClick={() => {
              // Clean up any escalated analysis data when returning to support menu (non-blocking)
              if (typeof window !== 'undefined') {
                setTimeout(() => {
                  try {
                    localStorage.removeItem('escalatedAnalysisData');
                  } catch (error) {
                    console.log('Non-critical: Failed to clear localStorage:', error);
                  }
                }, 0);
              }
              onStartOver();
            }}>
              Return to Support Menu
            </button>
            <button className="secondary-button" onClick={onContactAgent}>
              Still Need Help? Contact Agent
            </button>
          </div>

          {/* Additional Details Toggle */}
          <div className="details-toggle">
            <button 
              className="toggle-button"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Hide Technical Details' : 'Show Technical Details'}
            </button>
            
            {showDetails && (
              <div className="technical-details">
                <div className="detail-row">
                  <span className="detail-label">Resolution Time:</span>
                  <span className="detail-value">~2 minutes (Automated)</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Processing Method:</span>
                  <span className="detail-value">AI-Powered Automated Resolution</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Player Priority:</span>
                  <span className="detail-value">
                    VIP {playerProfile.vip_level} | Level {playerProfile.game_level} | 
                    {playerProfile.is_spender ? ' Premium Player' : ' Standard Player'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Next Steps:</span>
                  <span className="detail-value">Monitor account for 24 hours | Contact support if issues persist</span>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Escalation Notice */}
          <div className="escalation-header">
            <div className="status-indicator escalation"></div>
            <h1>Transferred to Human Agent</h1>
            <p>Your issue requires personalized attention</p>
          </div>

          <div className="escalation-reason">
            <h3>Why was this escalated?</h3>
            <p>{resolution.escalationReason}</p>
          </div>

          <div className="ticket-reference">
            <div className="ticket-id-section">
              <div className="ticket-id-display">
                <span className="ticket-label">Priority Ticket #</span>
                <span className="ticket-number">{resolution.ticketId}</span>
                <button className="copy-button" onClick={copyTicketId}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="ticket-note">
                A human agent will review your case and contact you within 2-4 hours.
              </p>
            </div>
          </div>

          <div className="action-buttons">
            <button className="primary-button" onClick={() => {
              // Clean up any escalated analysis data when returning to support menu (non-blocking)
              if (typeof window !== 'undefined') {
                setTimeout(() => {
                  try {
                    localStorage.removeItem('escalatedAnalysisData');
                  } catch (error) {
                    console.log('Non-critical: Failed to clear localStorage:', error);
                  }
                }, 0);
              }
              onStartOver();
            }}>
              Return to Support Menu
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .resolution-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 32px;
          background: #ffffff;
          font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .success-header, .escalation-header {
          text-align: center;
          padding: 48px 32px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 32px;
        }
        
        .success-header {
          border-left: 4px solid #8b5cf6;
        }
        
        .escalation-header {
          border-left: 4px solid #a855f7;
        }
        
        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin: 0 auto 20px;
        }
        
        .status-indicator.success {
          background: #8b5cf6;
        }
        
        .status-indicator.escalation {
          background: #a855f7;
        }
        
        .success-header h1, .escalation-header h1 {
          font-size: 28px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 12px 0;
          letter-spacing: -0.025em;
        }
        
        .success-header p, .escalation-header p {
          font-size: 16px;
          color: #64748b;
          margin: 0;
        }

        .ticket-reference {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .ticket-header h3 {
          margin: 0 0 20px 0;
          color: #1e293b;
          font-size: 18px;
          font-weight: 600;
        }

        .ticket-id-section {
          text-align: center;
        }

        .ticket-id-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 16px;
          padding: 20px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .ticket-label {
          font-weight: 500;
          color: #64748b;
          font-size: 14px;
        }

        .ticket-number {
          font-family: var(--font-mono), 'Courier New', monospace;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          background: #f1f5f9;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
        }

        .copy-button {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .copy-button:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .ticket-note {
          margin: 0;
          font-size: 14px;
          color: #64748b;
          line-height: 1.5;
        }

        .resolution-summary {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .resolution-summary h3 {
          margin: 0 0 20px 0;
          color: #1e293b;
          font-size: 18px;
          font-weight: 600;
        }

        .category-badge {
          display: inline-block;
          background: #e9d5ff;
          color: #6b21a8;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 20px;
        }

        .actions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .action-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 16px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }

        .action-number {
          background: #8b5cf6;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .action-text {
          color: #475569;
          line-height: 1.6;
          font-size: 15px;
        }

        .compensation-section {
          background: #faf7ff;
          border: 1px solid #e9d5ff;
          border-left: 4px solid #8b5cf6;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .compensation-section h3 {
          margin: 0 0 12px 0;
          color: #6b21a8;
          font-size: 18px;
          font-weight: 600;
        }

        .compensation-description {
          margin: 0 0 20px 0;
          color: #7c3aed;
          font-size: 15px;
          line-height: 1.5;
        }

        .compensation-items {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .compensation-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e9d5ff;
        }

        .item-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .gold-indicator {
          background: #c084fc;
        }

        .resource-indicator {
          background: #a78bfa;
        }

        .item-indicator {
          background: #8b5cf6;
        }

        .item-amount {
          font-weight: 600;
          color: #1e293b;
          font-size: 16px;
        }

        .item-name {
          color: #64748b;
          font-size: 14px;
        }

        .instructions-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .timeline-info, .follow-up-info {
          margin-bottom: 24px;
        }

        .timeline-info:last-child, .follow-up-info:last-child {
          margin-bottom: 0;
        }

        .timeline-info h4, .follow-up-info h4 {
          margin: 0 0 12px 0;
          color: #1e293b;
          font-size: 16px;
          font-weight: 600;
        }

        .timeline-info p, .follow-up-info p {
          margin: 0;
          color: #64748b;
          line-height: 1.6;
          font-size: 15px;
        }

        .vip-section {
          background: #faf7ff;
          border: 1px solid #e9d5ff;
          border-left: 4px solid #a855f7;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
          text-align: center;
        }

        .vip-badge {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          background: #a855f7;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          display: inline-block;
        }

        .vip-section p {
          margin: 0;
          color: #6b21a8;
          font-size: 15px;
          line-height: 1.5;
        }

        .action-buttons {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
        }

        .primary-button, .secondary-button {
          flex: 1;
          padding: 16px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .primary-button {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .primary-button:hover {
          background: linear-gradient(135deg, #7c3aed 0%, #6b21a8 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(139, 92, 246, 0.25);
        }

        .secondary-button {
          background: white;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }

        .secondary-button:hover {
          background: #faf7ff;
          border-color: #d1d5db;
          transform: translateY(-1px);
        }

        .details-toggle {
          background: white;
          border-radius: 12px;
          padding: 16px;
        }

        .toggle-button {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          font-size: 14px;
          width: 100%;
          text-align: left;
          padding: 8px 0;
        }

        .toggle-button:hover {
          color: #374151;
        }

        .technical-details {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          font-weight: 500;
          color: #6b7280;
        }

        .detail-value {
          color: #374151;
          text-align: right;
          max-width: 60%;
        }

        .escalation-reason {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          border-left: 4px solid #a855f7;
        }

        .escalation-reason h3 {
          margin: 0 0 12px 0;
          color: #6b21a8;
        }

        .escalation-reason p {
          margin: 0;
          color: #7c3aed;
        }
      `}</style>
    </div>
  );
}