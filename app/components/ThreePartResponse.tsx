'use client';

import React, { useState } from 'react';
import { Message } from 'ai';

interface ThreePartResponseProps {
  problemSummary: string;
  fix: string;
  compensation?: string;
  hasCompensation: boolean;
  compensationDetails?: {
    tier: string;
    gold?: number;
    resources?: any;
    reasoning: string;
    requiresApproval: boolean;
  };
  onSendMessage: (message: string, section: 'summary' | 'solution' | 'compensation') => void;
  onAwardCompensation?: () => void;
}

export default function ThreePartResponse({
  problemSummary,
  fix,
  compensation,
  hasCompensation,
  compensationDetails,
  onSendMessage,
  onAwardCompensation
}: ThreePartResponseProps) {
  const [editingSummary, setEditingSummary] = useState(false);
  const [editingFix, setEditingFix] = useState(false);
  const [editingCompensation, setEditingCompensation] = useState(false);
  
  const [summaryText, setSummaryText] = useState(problemSummary);
  const [fixText, setFixText] = useState(fix);
  const [compensationText, setCompensationText] = useState(compensation || '');
  
  // Approval workflow state
  const [compensationApproved, setCompensationApproved] = useState(false);
  const [showApprovalDetails, setShowApprovalDetails] = useState(false);

  const handleSendSummary = () => {
    console.log('🔍 Sending summary:', summaryText);
    onSendMessage(summaryText, 'summary');
    setEditingSummary(false);
  };

  const handleSendFix = () => {
    console.log('🔧 Sending fix:', fixText);
    onSendMessage(fixText, 'solution');
    setEditingFix(false);
  };

  const handleSendCompensation = () => {
    if (compensationDetails?.requiresApproval && !compensationApproved) {
      alert('⚠️ This compensation requires approval before sending. Please approve it first.');
      return;
    }
    
    console.log('💰 Sending compensation:', compensationText);
    onSendMessage(compensationText, 'compensation');
    // Note: Compensation awarding and follow-up workflow is now handled 
    // automatically by the section tracking logic in handleSendMessage
    setEditingCompensation(false);
  };

  const handleApproveCompensation = () => {
    setCompensationApproved(true);
    console.log('✅ Compensation approved:', compensationDetails);
  };

  const handleRejectCompensation = () => {
    setCompensationApproved(false);
    setCompensationText('Unfortunately, after reviewing your case, we are unable to provide compensation at this time.');
    console.log('❌ Compensation rejected');
  };

  return (
    <div className="three-part-response">
      {/* Problem Summary Section */}
      <div className="response-section">
        <div className="section-header">
          <h4>🔍 Problem Summary</h4>
        </div>
        <div className="section-content">
          {editingSummary ? (
            <div className="edit-mode">
              <textarea
                value={summaryText}
                onChange={(e) => setSummaryText(e.target.value)}
                className="edit-textarea"
                rows={3}
              />
              <div className="edit-buttons">
                <button
                  onClick={handleSendSummary}
                  className="send-button"
                >
                  Send Summary
                </button>
                <button
                  onClick={() => {
                    setSummaryText(problemSummary);
                    setEditingSummary(false);
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="view-mode">
              <p>{summaryText}</p>
              <div className="section-buttons">
                <button
                  onClick={() => setEditingSummary(true)}
                  className="edit-button"
                >
                  Edit
                </button>
                <button
                  onClick={handleSendSummary}
                  className="send-button"
                >
                  Send Summary
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fix Section */}
      <div className="response-section">
        <div className="section-header">
          <h4>🔧 Solution</h4>
        </div>
        <div className="section-content">
          {editingFix ? (
            <div className="edit-mode">
              <textarea
                value={fixText}
                onChange={(e) => setFixText(e.target.value)}
                className="edit-textarea"
                rows={4}
              />
              <div className="edit-buttons">
                <button
                  onClick={handleSendFix}
                  className="send-button"
                >
                  Send Solution
                </button>
                <button
                  onClick={() => {
                    setFixText(fix);
                    setEditingFix(false);
                  }}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="view-mode">
              <p>{fixText}</p>
              <div className="section-buttons">
                <button
                  onClick={() => setEditingFix(true)}
                  className="edit-button"
                >
                  Edit
                </button>
                <button
                  onClick={handleSendFix}
                  className="send-button"
                >
                  Send Solution
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compensation Section */}
      {hasCompensation && (
        <div className="response-section compensation-section">
          <div className="section-header">
            <h4>💰 Compensation</h4>
            {compensationDetails?.requiresApproval && (
              <span className={`approval-status ${compensationApproved ? 'approved' : 'pending'}`}>
                {compensationApproved ? '✅ Approved' : '⏳ Pending Approval'}
              </span>
            )}
          </div>
          
          {/* Compensation Details Panel */}
          {compensationDetails && (
            <div className="compensation-details-panel">
              <div className="details-row">
                <span className="detail-label">Tier:</span>
                <span className={`detail-value tier-${compensationDetails.tier.toLowerCase()}`}>
                  {compensationDetails.tier}
                </span>
              </div>
              {compensationDetails.gold && (
                <div className="details-row">
                  <span className="detail-label">Gold:</span>
                  <span className="detail-value gold-amount">{compensationDetails.gold}</span>
                </div>
              )}
              {compensationDetails.resources && Object.keys(compensationDetails.resources).length > 0 && (
                <div className="details-row">
                  <span className="detail-label">Resources:</span>
                  <span className="detail-value">
                    {Object.entries(compensationDetails.resources).map(([key, value]) => 
                      `${value} ${key}`
                    ).join(', ')}
                  </span>
                </div>
              )}
              <div className="details-row">
                <span className="detail-label">Reasoning:</span>
                <span className="detail-value reasoning-text">{compensationDetails.reasoning}</span>
              </div>
              
              {/* Approval Controls */}
              {compensationDetails.requiresApproval && !compensationApproved && (
                <div className="approval-controls">
                  <button
                    onClick={handleApproveCompensation}
                    className="approve-button"
                  >
                    ✅ Approve Compensation
                  </button>
                  <button
                    onClick={handleRejectCompensation}
                    className="reject-button"
                  >
                    ❌ Reject Compensation
                  </button>
                </div>
              )}
            </div>
          )}
          
          <div className="section-content">
            {editingCompensation ? (
              <div className="edit-mode">
                <textarea
                  value={compensationText}
                  onChange={(e) => setCompensationText(e.target.value)}
                  className="edit-textarea"
                  rows={3}
                />
                <div className="edit-buttons">
                  <button
                    onClick={handleSendCompensation}
                    className={`send-button compensation-send ${
                      compensationDetails?.requiresApproval && !compensationApproved ? 'disabled' : ''
                    }`}
                    disabled={compensationDetails?.requiresApproval && !compensationApproved}
                  >
                    Send & Award Compensation
                  </button>
                  <button
                    onClick={() => {
                      setCompensationText(compensation || '');
                      setEditingCompensation(false);
                    }}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="view-mode">
                <p>{compensationText}</p>
                <div className="section-buttons">
                  <button
                    onClick={() => setEditingCompensation(true)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleSendCompensation}
                    className={`send-button compensation-send ${
                      compensationDetails?.requiresApproval && !compensationApproved ? 'disabled' : ''
                    }`}
                    disabled={compensationDetails?.requiresApproval && !compensationApproved}
                  >
                    Send & Award Compensation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .three-part-response {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
          border-radius: 8px 8px 0 0;
        }

        .response-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .compensation-section {
          border-color: #fbbf24;
          background: #fffbeb;
        }

        .section-header {
          background: #f3f4f6;
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .compensation-section .section-header {
          background: #fef3c7;
          border-bottom-color: #fbbf24;
        }

        .section-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-content {
          padding: 16px;
        }

        .compensation-section .section-content {
          background: white;
        }

        .view-mode p {
          margin: 0 0 12px 0;
          color: #374151;
          line-height: 1.5;
          font-size: 14px;
        }

        .edit-mode {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .edit-textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
          resize: vertical;
          min-height: 80px;
        }

        .edit-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .section-buttons,
        .edit-buttons {
          display: flex;
          gap: 8px;
        }

        .edit-button {
          padding: 6px 12px;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .edit-button:hover {
          background: #e5e7eb;
        }

        .send-button {
          padding: 6px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .send-button:hover {
          background: #2563eb;
        }

        .compensation-send {
          background: #10b981;
        }

        .compensation-send:hover {
          background: #059669;
        }

        .cancel-button {
          padding: 6px 12px;
          background: white;
          color: #6b7280;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-button:hover {
          background: #f9fafb;
        }

        /* Approval workflow styles */
        .approval-status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .approval-status.pending {
          background: #fef3c7;
          color: #92400e;
        }

        .approval-status.approved {
          background: #d1fae5;
          color: #065f46;
        }

        .compensation-details-panel {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
          margin: 12px 16px;
        }

        .details-row {
          display: flex;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .details-row:last-child {
          margin-bottom: 0;
        }

        .detail-label {
          font-weight: 500;
          color: #475569;
          min-width: 80px;
          font-size: 13px;
        }

        .detail-value {
          color: #1e293b;
          font-size: 13px;
          flex: 1;
        }

        .tier-p0, .tier-p1 { color: #dc2626; font-weight: 600; }
        .tier-p2, .tier-p3 { color: #d97706; font-weight: 600; }
        .tier-p4, .tier-p5 { color: #65a30d; font-weight: 600; }

        .gold-amount {
          color: #d97706;
          font-weight: 600;
        }

        .reasoning-text {
          font-style: italic;
          color: #64748b;
          line-height: 1.4;
        }

        .approval-controls {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
        }

        .approve-button {
          padding: 8px 16px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .approve-button:hover {
          background: #059669;
        }

        .reject-button {
          padding: 8px 16px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .reject-button:hover {
          background: #dc2626;
        }

        .send-button.disabled,
        .compensation-send.disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .send-button.disabled:hover,
        .compensation-send.disabled:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}