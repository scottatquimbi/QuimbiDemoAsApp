'use client';

import React from 'react';

interface IssueSummaryPopupProps {
  isOpen: boolean;
  issueAnalysis: {
    playerName: string;
    issueType: string;
    description: string;
    severity: string;
    confidenceScore: number;
  };
  compensationDetails?: {
    tier: string;
    gold?: number;
    resources?: any;
    reasoning: string;
    requiresApproval: boolean;
  };
  onAcknowledge: () => void;
}

export default function IssueSummaryPopup({
  isOpen,
  issueAnalysis,
  compensationDetails,
  onAcknowledge
}: IssueSummaryPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <div className="popup-header">
          <h2>📊 Support Case Analysis Report</h2>
          <span className="analysis-confidence">
            Confidence: {Math.round(issueAnalysis.confidenceScore * 100)}%
          </span>
        </div>

        <div className="issue-summary-section">
          <h3>📋 Incident Summary</h3>
          <div className="issue-details">
            <div className="detail-row">
              <span className="label">Player:</span>
              <span className="value">{issueAnalysis.playerName}</span>
            </div>
            <div className="detail-row">
              <span className="label">Issue Type:</span>
              <span className="value issue-type">{issueAnalysis.issueType}</span>
            </div>
            <div className="detail-row">
              <span className="label">Description:</span>
              <span className="value">{issueAnalysis.description}</span>
            </div>
            <div className="detail-row">
              <span className="label">Severity:</span>
              <span className={`value severity-${issueAnalysis.severity.toLowerCase()}`}>
                {issueAnalysis.severity}
              </span>
            </div>
          </div>
        </div>

        {compensationDetails && (
          <div className="compensation-summary-section">
            <h3>💰 Compensation Assessment</h3>
            <div className="compensation-details">
              <div className="detail-row">
                <span className="label">Severity Level:</span>
                <span className={`value tier-${compensationDetails.tier.toLowerCase()}`}>
                  {compensationDetails.tier}
                </span>
              </div>
              {compensationDetails.gold && (
                <div className="detail-row">
                  <span className="label">Recommended Gold:</span>
                  <span className="value gold-amount">{compensationDetails.gold}</span>
                </div>
              )}
              {compensationDetails.resources && Object.keys(compensationDetails.resources).length > 0 && (
                <div className="detail-row">
                  <span className="label">Additional Resources:</span>
                  <span className="value">
                    {Object.entries(compensationDetails.resources).map(([key, value]) => 
                      `${value} ${key}`
                    ).join(', ')}
                  </span>
                </div>
              )}
              <div className="detail-row">
                <span className="label">Analysis Result:</span>
                <span className="value reasoning">{compensationDetails.reasoning}</span>
              </div>
              {compensationDetails.requiresApproval && (
                <div className="approval-notice">
                  ⚠️ Requires supervisory approval before processing
                </div>
              )}
            </div>
          </div>
        )}

        <div className="popup-actions">
          <button 
            onClick={onAcknowledge}
            className="acknowledge-button"
          >
            📋 Proceed with Response
          </button>
        </div>
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
          max-width: 600px;
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

        .popup-header h2 {
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 600;
        }

        .analysis-confidence {
          background: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .issue-summary-section,
        .compensation-summary-section {
          margin-bottom: 20px;
        }

        .issue-summary-section h3,
        .compensation-summary-section h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .issue-details,
        .compensation-details {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 16px;
        }

        .detail-row {
          display: flex;
          margin-bottom: 8px;
          align-items: flex-start;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .label {
          font-weight: 500;
          color: #6b7280;
          min-width: 100px;
          font-size: 14px;
        }

        .value {
          color: #111827;
          font-size: 14px;
          flex: 1;
        }

        .issue-type {
          background: #dbeafe;
          color: #1e40af;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          display: inline-block;
        }

        .severity-critical { color: #dc2626; font-weight: 600; }
        .severity-high { color: #ea580c; font-weight: 600; }
        .severity-moderate { color: #d97706; font-weight: 600; }
        .severity-low { color: #65a30d; font-weight: 600; }
        .severity-minimal { color: #6b7280; }

        .tier-p0 { color: #dc2626; font-weight: 600; }
        .tier-p1 { color: #ea580c; font-weight: 600; }
        .tier-p2 { color: #d97706; font-weight: 600; }
        .tier-p3 { color: #65a30d; font-weight: 600; }
        .tier-p4, .tier-p5 { color: #6b7280; }

        .gold-amount {
          color: #d97706;
          font-weight: 600;
        }

        .reasoning {
          font-style: italic;
          color: #4b5563;
          line-height: 1.4;
        }

        .approval-notice {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          color: #92400e;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          margin-top: 12px;
        }

        .popup-actions {
          display: flex;
          justify-content: center;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
          margin-top: 20px;
        }

        .acknowledge-button {
          background: #3b82f6;
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
        }

        .acknowledge-button:hover {
          background: #2563eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
        }

        .acknowledge-button:active {
          transform: translateY(0);
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
}