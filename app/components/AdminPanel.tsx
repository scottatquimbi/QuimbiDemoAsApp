/**
 * @deprecated This component has been replaced by a standalone admin page.
 * Please use the /admin route instead. This file will be removed in a future update.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CompensationTier } from '@/lib/models';
import { CompensationRequest } from '@/lib/compensation';
import { CompensationService } from '@/lib/compensation-service';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Type to match the compensation request coming from the database
interface DBCompensationRequest {
  id: string;
  player_id: string; // DB uses snake_case properties
  tier: string;
  status: string;
  requires_human_review: boolean;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  reviewed_by?: string;
  review_notes?: string;
  gold?: number;
  resources?: any;
  items?: any[];
  vip_points?: number;
  detected_issues?: {
    description?: string;
    issue_type?: string;
  };
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'history' | 'stats'>('history');
  const [completedRequests, setCompletedRequests] = useState<DBCompensationRequest[]>([]);
  const [stats, setStats] = useState<any>({
    completedRequests: 0,
    averageResponseTime: 'N/A',
    rejectionRate: 'N/A',
    commonIssueTypes: {
      technical: 0,
      account: 0,
      gameplay: 0
    },
    compensationByTier: {
      P0: 0,
      P1: 0,
      P2: 0,
      P3: 0,
      P4: 0,
      P5: 0
    },
    handlingTime: {
      averageHandlingMinutes: 0,
      totalEstimatedHours: 0,
      averageComplexity: 0,
      averageSteps: 0,
      automationScore: 0,
      humanResolutionMinutes: 0,
      botResolutionMinutes: 0,
      timeSavedPercentage: 0,
      automatedResolutionCount: 0,
      humanResolutionCount: 0,
      totalTimeSavedHours: 0
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use CompensationService static methods
  
  // Fetch compensation data whenever the panel is opened or when requests are updated
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchCompensationData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load completed requests
        const historyData = await CompensationService.getCompensationHistory();
        setCompletedRequests(historyData || []);
        
        // Load stats
        const statsData = await CompensationService.getStats();
        if (statsData) {
          console.log('Stats data received:', statsData); // Debug: Log the stats data
          
          setStats({
            completedRequests: statsData.stats.completed_requests || 0,
            averageResponseTime: statsData.stats.avg_response_time_minutes !== undefined
              ? `${statsData.stats.avg_response_time_minutes.toFixed(1)} min` 
              : 'N/A',
            rejectionRate: statsData.stats.rejection_rate_percent !== undefined
              ? `${statsData.stats.rejection_rate_percent}%` 
              : 'N/A',
            commonIssueTypes: statsData.issueTypes || {
              technical: 0,
              account: 0,
              gameplay: 0
            },
            compensationByTier: statsData.compensationByTier || {
              P0: 0,
              P1: 0,
              P2: 0,
              P3: 0,
              P4: 0,
              P5: 0
            },
            handlingTime: {
              averageHandlingMinutes: statsData.handlingTime?.averageHandlingMinutes || 0,
              totalEstimatedHours: statsData.handlingTime?.totalEstimatedHours || 0,
              averageComplexity: statsData.handlingTime?.averageComplexity || 0,
              averageSteps: statsData.handlingTime?.averageSteps || 0,
              automationScore: statsData.handlingTime?.automationScore || 0,
              humanResolutionMinutes: statsData.handlingTime?.humanResolutionMinutes || 0,
              botResolutionMinutes: statsData.handlingTime?.botResolutionMinutes || 0,
              timeSavedPercentage: statsData.handlingTime?.timeSavedPercentage || 0,
              automatedResolutionCount: statsData.handlingTime?.automatedResolutionCount || 0,
              humanResolutionCount: statsData.handlingTime?.humanResolutionCount || 0,
              totalTimeSavedHours: statsData.handlingTime?.totalTimeSavedHours || 0
            }
          });
        }
      } catch (err) {
        console.error('Error fetching compensation data:', err);
        setError('Failed to load compensation data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompensationData();
    
    // Set up polling for updates every 15 seconds
    const intervalId = setInterval(fetchCompensationData, 15000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isOpen]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Get pill color based on severity
  const getSeverityColor = (tier: CompensationTier | string) => {
    switch(tier) {
      case CompensationTier.P0:
      case 'P0':
        return 'bg-red-100 text-red-800 border-red-200';
      case CompensationTier.P1:
      case 'P1':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case CompensationTier.P2: 
      case 'P2':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case CompensationTier.P3:
      case 'P3':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };
  
  // Get status pill color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_review': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'denied': return 'bg-red-100 text-red-800 border-red-200';
      case 'delivered': return 'bg-teal-100 text-teal-800 border-teal-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Type-safe function to get values from stats object
  const getStatValue = (obj: Record<string, unknown>, key: string): number => {
    const value = obj[key];
    return typeof value === 'number' ? value : 0;
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>Compensation Admin</h2>
        <button onClick={onClose} className="close-button">×</button>
      </div>
      
      <div className="tab-navigation">
        <button 
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button 
          className={`tab-button ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Analytics
        </button>
      </div>
      
      <div className="panel-content">
        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Loading data...</p>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button 
              className="retry-button"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}
        
        {!loading && !error && activeTab === 'history' && (
          <div className="request-history">
            <h3>Compensation History</h3>
            
            {completedRequests.length === 0 && (
              <div className="empty-state">
                <p>No compensation history available.</p>
              </div>
            )}
            
            {completedRequests.map(request => (
              <div key={request.id} className="history-card">
                <div className="history-header">
                  <div className="request-meta">
                    <div className="player-id">Player: {request.player_id}</div>
                    <div className="history-dates">
                      <div>Submitted: {formatDate(request.created_at)}</div>
                      <div>Resolved: {formatDate(request.resolved_at || request.updated_at)}</div>
                    </div>
                  </div>
                  <div className="history-badges">
                    <span className={`severity-badge ${getSeverityColor(request.tier)}`}>
                      {request.tier}
                    </span>
                    <span className={`status-badge ${getStatusColor(request.status)}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                
                <div className="history-issue">
                  <h4>Issue</h4>
                  <p>{request.detected_issues?.description || 'Issue description unavailable'}</p>
                </div>
                
                <div className="history-resolution">
                  <h4>Resolution</h4>
                  <div className="reviewer">Reviewed by: {request.reviewed_by || 'Automated System'}</div>
                  <p className="review-notes">{request.review_notes || 'No review notes available.'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && !error && activeTab === 'stats' && (
          <div className="analytics">
            <h3>Compensation Analytics</h3>
            
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Completed Requests</h4>
                <div className="stat-value">{stats.completedRequests}</div>
              </div>
              
              <div className="stat-card">
                <h4>Average Response Time</h4>
                <div className="stat-value">{stats.averageResponseTime}</div>
              </div>
              
              <div className="stat-card">
                <h4>Rejection Rate</h4>
                <div className="stat-value">{stats.rejectionRate}</div>
              </div>
            </div>
            
            <h3>Support Efficiency Analytics</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Avg. Human Resolution</h4>
                <div className="stat-value">{stats.handlingTime.humanResolutionMinutes} min</div>
              </div>
              
              <div className="stat-card">
                <h4>Avg. Bot Resolution</h4>
                <div className="stat-value">{stats.handlingTime.botResolutionMinutes} min</div>
              </div>
              
              <div className="stat-card">
                <h4>Time Saved</h4>
                <div className="stat-value">{stats.handlingTime.timeSavedPercentage}%</div>
              </div>
              
              <div className="stat-card">
                <h4>Total Hours Saved</h4>
                <div className="stat-value">{stats.handlingTime.totalTimeSavedHours} hrs</div>
              </div>
            </div>
            
            <div className="resolution-comparison">
              <h4>Resolution Distribution</h4>
              <div className="comparison-bar">
                <div 
                  className="bot-segment" 
                  style={{ 
                    width: `${
                      (stats.handlingTime.automatedResolutionCount + stats.handlingTime.humanResolutionCount) > 0 
                        ? (stats.handlingTime.automatedResolutionCount / (stats.handlingTime.automatedResolutionCount + stats.handlingTime.humanResolutionCount) * 100) 
                        : 0
                    }%`
                  }}
                >
                  Bot: {stats.handlingTime.automatedResolutionCount}
                </div>
                <div 
                  className="human-segment"
                  style={{ 
                    width: `${
                      (stats.handlingTime.automatedResolutionCount + stats.handlingTime.humanResolutionCount) > 0 
                        ? (stats.handlingTime.humanResolutionCount / (stats.handlingTime.automatedResolutionCount + stats.handlingTime.humanResolutionCount) * 100) 
                        : 100
                    }%`
                  }}
                >
                  Human: {stats.handlingTime.humanResolutionCount}
                </div>
              </div>
              
              <h4>Avg. Resolution Time (minutes)</h4>
              <div className="resolution-time-comparison">
                <div className="resolution-time-item">
                  <div className="label">Bot</div>
                  <div className="value">{stats.handlingTime.botResolutionMinutes}</div>
                </div>
                <div className="resolution-time-item">
                  <div className="label">Human</div>
                  <div className="value">{stats.handlingTime.humanResolutionMinutes}</div>
                </div>
              </div>
            </div>
            
            <div className="stat-charts">
              <div className="chart-container">
                <h4>Issue Types</h4>
                <div className="bar-chart">
                  {Object.entries(stats.commonIssueTypes || {}).map(([type, count]) => {
                    const countValue = typeof count === 'number' ? count : 0;
                    const total = Object.values(stats.commonIssueTypes || {})
                      .reduce((a: number, b: unknown) => a + (typeof b === 'number' ? b : 0), 0);
                    
                    return (
                      <div key={type} className="chart-bar-container">
                        <div className="bar-label">{type}</div>
                        <div className="bar-outer">
                          <div 
                            className="bar-inner"
                            style={{ 
                              width: `${total > 0 ? (countValue / total) * 100 : 0}%`,
                              backgroundColor: 
                                type === 'technical' ? '#3b82f6' : 
                                type === 'account' ? '#10b981' : 
                                '#f59e0b'
                            }}
                          />
                        </div>
                        <div className="bar-value">{countValue}</div>
                      </div>
                    );
                  })}
                  
                  {Object.keys(stats.commonIssueTypes || {}).length === 0 && (
                    <div className="no-data-message">No issue type data available</div>
                  )}
                </div>
              </div>
              
              <div className="chart-container">
                <h4>Compensation by Tier</h4>
                <div className="bar-chart">
                  {Object.entries(stats.compensationByTier).map(([tier, count]) => {
                    const countValue = typeof count === 'number' ? count : 0;
                    const total = Object.values(stats.compensationByTier)
                      .reduce((a: number, b: unknown) => a + (typeof b === 'number' ? b : 0), 0);
                    
                    return (
                      <div key={tier} className="chart-bar-container">
                        <div className="bar-label">{tier}</div>
                        <div className="bar-outer">
                          <div 
                            className="bar-inner"
                            style={{ 
                              width: `${total > 0 ? (countValue / total) * 100 : 0}%`,
                              backgroundColor: 
                                tier === 'P0' ? '#ef4444' : 
                                tier === 'P1' ? '#f97316' : 
                                tier === 'P2' ? '#f59e0b' : 
                                tier === 'P3' ? '#84cc16' : 
                                tier === 'P4' ? '#06b6d4' : 
                                '#8b5cf6'
                            }}
                          />
                        </div>
                        <div className="bar-value">{countValue}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .admin-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 500px;
          background-color: white;
          box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }
        
        .panel-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
        }
        
        .tab-navigation {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .tab-button {
          padding: 12px 16px;
          border: none;
          background: none;
          cursor: pointer;
          font-weight: 500;
          color: #6b7280;
          position: relative;
        }
        
        .tab-button.active {
          color: #3b82f6;
          border-bottom: 2px solid #3b82f6;
        }
        
        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          position: relative;
        }
        
        .loading-indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
          color: #6b7280;
        }
        
        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        .error-message {
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 16px;
          color: #b91c1c;
          text-align: center;
        }
        
        .error-message p {
          margin: 0 0 12px 0;
        }
        
        .retry-button {
          background-color: #b91c1c;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          font-size: 14px;
          cursor: pointer;
        }
        
        .empty-state {
          padding: 40px 0;
          text-align: center;
          color: #6b7280;
        }
        
        /* Content Styles */
        .request-history h3,
        .analytics h3 {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }
        
        .severity-badge,
        .status-badge {
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid transparent;
        }
        
        .history-issue h4,
        .history-resolution h4 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }
        
        .empty-state {
          padding: 40px 0;
          text-align: center;
          color: #6b7280;
        }
        
        /* History Tab */
        .history-card {
          margin-bottom: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .history-header {
          padding: 12px 16px;
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .history-dates {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
        
        .history-badges {
          display: flex;
          gap: 8px;
        }
        
        .history-issue,
        .history-resolution {
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .history-issue p {
          margin: 0;
        }
        
        .reviewer {
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 6px;
        }
        
        .review-notes {
          margin: 0;
          font-style: italic;
          color: #4b5563;
        }
        
        /* Analytics Tab */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .stat-card {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }
        
        .stat-card h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #111827;
        }
        
        .resolution-comparison {
          margin-top: 20px;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }
        
        .resolution-comparison h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
        }
        
        .comparison-bar {
          display: flex;
          height: 36px;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        
        .bot-segment {
          background-color: #10b981;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 13px;
          font-weight: 500;
          min-width: 80px;
        }
        
        .human-segment {
          background-color: #6366f1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 13px;
          font-weight: 500;
          min-width: 80px;
        }
        
        .resolution-time-comparison {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .resolution-time-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .label {
          width: 80px;
          font-size: 13px;
          color: #6b7280;
        }
        
        .value {
          font-size: 13px;
          font-weight: 500;
        }
        
        .stat-charts {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-top: 20px;
        }
        
        .chart-container {
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }
        
        .chart-container h4 {
          margin: 0 0 16px 0;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
        }
        
        .bar-chart {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .chart-bar-container {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .bar-label {
          width: 80px;
          font-size: 13px;
          color: #6b7280;
        }
        
        .bar-outer {
          flex: 1;
          height: 12px;
          background-color: #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .bar-inner {
          height: 100%;
          border-radius: 6px;
        }
        
        .bar-value {
          width: 40px;
          font-size: 13px;
          font-weight: 500;
          text-align: right;
        }
        
        .no-data-message {
          text-align: center;
          color: #6b7280;
          margin-top: 12px;
          font-size: 14px;
          padding: 12px;
          background-color: #f9f9f9;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
} 