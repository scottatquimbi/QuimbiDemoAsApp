'use client';

import React from 'react';

interface EndChatDecisionPopupProps {
  isOpen: boolean;
  playerResponse: string;
  analysisResult: {
    needsMoreHelp: boolean;
    confidence: number;
    reasoning: string;
  };
  onContinueChat: () => void;
  onEndChat: () => void;
}

export default function EndChatDecisionPopup({
  isOpen,
  playerResponse,
  analysisResult,
  onContinueChat,
  onEndChat
}: EndChatDecisionPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <div className="popup-header">
          <h2>🤔 Agent Decision Required</h2>
          <span className="analysis-confidence">
            AI Confidence: {Math.round(analysisResult.confidence * 100)}%
          </span>
        </div>

        <div className="player-response-section">
          <h3>💬 Player Response</h3>
          <div className="response-box">
            "{playerResponse}"
          </div>
        </div>

        <div className="ai-analysis-section">
          <h3>🤖 AI Analysis</h3>
          <div className="analysis-box">
            <div className="analysis-result">
              <span className="label">Needs More Help:</span>
              <span className={`value ${analysisResult.needsMoreHelp ? 'needs-help' : 'satisfied'}`}>
                {analysisResult.needsMoreHelp ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className="reasoning">
              <span className="label">Reasoning:</span>
              <span className="value">{analysisResult.reasoning}</span>
            </div>
          </div>
        </div>

        <div className="decision-section">
          <h3>🎯 What would you like to do?</h3>
          <div className="decision-buttons">
            <button 
              onClick={onContinueChat}
              className="continue-button"
            >
              💬 Continue Conversation
              <span className="button-subtitle">Keep chat open for more assistance</span>
            </button>
            <button 
              onClick={onEndChat}
              className="end-button"
            >
              ✅ End Chat Session
              <span className="button-subtitle">Close conversation and update CRM</span>
            </button>
          </div>
        </div>

        <div className="guidance-section">
          <h4>💡 Guidance</h4>
          <ul>
            <li>If the player seems satisfied and said "no" or "thanks", consider ending the chat</li>
            <li>If they mentioned new issues or said "yes", continue the conversation</li>
            <li>When in doubt, it's better to offer continued assistance</li>
          </ul>
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

        .popup-header h2 {
          margin: 0;
          color: #111827;
          font-size: 20px;
          font-weight: 600;
        }

        .analysis-confidence {
          background: #3b82f6;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .player-response-section,
        .ai-analysis-section,
        .decision-section,
        .guidance-section {
          margin-bottom: 20px;
        }

        .player-response-section h3,
        .ai-analysis-section h3,
        .decision-section h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .guidance-section h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
        }

        .response-box {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 12px;
          font-style: italic;
          color: #475569;
          line-height: 1.5;
        }

        .analysis-box {
          background: #f0f9ff;
          border: 1px solid #0ea5e9;
          border-radius: 6px;
          padding: 12px;
        }

        .analysis-result {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding: 8px;
          background: white;
          border-radius: 4px;
        }

        .reasoning {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 8px;
          background: white;
          border-radius: 4px;
        }

        .label {
          font-weight: 500;
          color: #6b7280;
          font-size: 14px;
        }

        .value {
          color: #111827;
          font-size: 14px;
        }

        .needs-help {
          color: #dc2626;
          font-weight: 600;
        }

        .satisfied {
          color: #059669;
          font-weight: 600;
        }

        .decision-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 16px;
        }

        .continue-button,
        .end-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          border: 2px solid transparent;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .continue-button {
          background: #dbeafe;
          color: #1e40af;
          border-color: #3b82f6;
        }

        .continue-button:hover {
          background: #bfdbfe;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }

        .end-button {
          background: #f0fdf4;
          color: #166534;
          border-color: #22c55e;
        }

        .end-button:hover {
          background: #dcfce7;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(34, 197, 94, 0.3);
        }

        .button-subtitle {
          font-size: 12px;
          font-weight: 400;
          color: #6b7280;
          margin-top: 4px;
        }

        .guidance-section {
          background: #fffbeb;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 12px;
        }

        .guidance-section ul {
          margin: 0;
          padding-left: 16px;
          color: #92400e;
          font-size: 13px;
          line-height: 1.4;
        }

        .guidance-section li {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}