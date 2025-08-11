'use client';

import React, { useState, useEffect } from 'react';

interface Ticket {
  ticket_id: string;
  player_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  resolution_summary: string;
  compensation_awarded?: any;
  chat_summary: string;
  key_issues: string[];
  player_sentiment: string;
  outcome_rating: string;
  resolution_time_minutes: number;
  tags: string[];
  created_at: string;
  resolved_at: string;
}

interface TicketHistoryProps {
  playerId: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function TicketHistory({ playerId, isExpanded = false, onToggle }: TicketHistoryProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (playerId && isExpanded) {
      loadTicketHistory();
    }
  }, [playerId, isExpanded]);

  const loadTicketHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tickets?playerId=${playerId}`);
      if (response.ok) {
        const ticketData = await response.json();
        setTickets(ticketData);
        console.log(`📋 Loaded ${ticketData.length} historical tickets for AI context`);
      } else {
        setError('Failed to load ticket history');
      }
    } catch (err) {
      setError('Error loading ticket history');
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#ca8a04';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return '🔧';
      case 'account': return '👤';
      case 'gameplay': return '🎮';
      case 'billing': return '💳';
      case 'compensation': return '💰';
      default: return '📋';
    }
  };

  return (
    <div className="ticket-history-container">
      <div className="ticket-header" onClick={onToggle}>
        <div className="header-content">
          <h3>📋 Previous Support Tickets</h3>
          <div className="header-info">
            <span className="ticket-count">{tickets.length} tickets</span>
            <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="ticket-history-content">
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <span>Loading ticket history...</span>
            </div>
          )}

          {error && (
            <div className="error-state">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && tickets.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <span>No previous tickets found</span>
            </div>
          )}

          {!loading && !error && tickets.length > 0 && (
            <div className="tickets-list">
              <div className="context-note">
                <span className="ai-icon">🤖</span>
                <span>AI can reference this history to provide better support</span>
              </div>
              
              {tickets.map((ticket) => (
                <div key={ticket.ticket_id} className="ticket-card">
                  <div className="ticket-header-row">
                    <div className="ticket-title">
                      <span className="category-icon">{getCategoryIcon(ticket.category)}</span>
                      <span className="title-text">{ticket.title}</span>
                      <span className="ticket-id">#{ticket.ticket_id}</span>
                    </div>
                    <div className="ticket-meta">
                      <span 
                        className="priority-badge" 
                        style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                      >
                        {ticket.priority}
                      </span>
                      <span className="date">{formatDate(ticket.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="ticket-summary">
                    <p>{ticket.chat_summary}</p>
                  </div>
                  
                  <div className="ticket-outcome">
                    <div className="outcome-info">
                      <span className="resolution-time">⏱️ {ticket.resolution_time_minutes}min</span>
                      <span className="sentiment">😊 {ticket.player_sentiment.replace(/_/g, ' ')}</span>
                      <span className="outcome">✅ {ticket.outcome_rating}</span>
                    </div>
                    
                    {ticket.compensation_awarded && (
                      <div className="compensation-info">
                        <span className="compensation-icon">💰</span>
                        <span className="compensation-text">Compensation provided</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="ticket-tags">
                    {ticket.key_issues.map((issue, index) => (
                      <span key={index} className="issue-tag">
                        {issue.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .ticket-history-container {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 16px;
          overflow: hidden;
        }

        .ticket-header {
          padding: 12px 16px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .ticket-header:hover {
          background: #f3f4f6;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-content h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .header-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ticket-count {
          font-size: 12px;
          color: #6b7280;
          background: #e5e7eb;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .expand-icon {
          font-size: 12px;
          color: #9ca3af;
        }

        .ticket-history-content {
          padding: 16px;
        }

        .loading-state, .error-state, .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 24px;
          color: #6b7280;
          font-size: 14px;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .error-state {
          color: #dc2626;
        }

        .context-note {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 12px;
          color: #1e40af;
        }

        .tickets-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ticket-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          background: #fafafa;
        }

        .ticket-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .ticket-title {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
        }

        .category-icon {
          font-size: 14px;
        }

        .title-text {
          font-weight: 600;
          font-size: 13px;
          color: #111827;
        }

        .ticket-id {
          font-size: 11px;
          color: #6b7280;
          background: #f3f4f6;
          padding: 2px 4px;
          border-radius: 3px;
        }

        .ticket-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .priority-badge {
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        .date {
          font-size: 11px;
          color: #6b7280;
        }

        .ticket-summary {
          margin-bottom: 8px;
        }

        .ticket-summary p {
          margin: 0;
          font-size: 12px;
          color: #4b5563;
          line-height: 1.4;
        }

        .ticket-outcome {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .outcome-info {
          display: flex;
          gap: 12px;
          font-size: 11px;
          color: #6b7280;
        }

        .compensation-info {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #059669;
          font-weight: 500;
        }

        .ticket-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .issue-tag {
          background: #e0e7ff;
          color: #3730a3;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 3px;
          text-transform: capitalize;
        }
      `}</style>
    </div>
  );
}