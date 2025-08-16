'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

interface ContactOption {
  title: string;
  description: string;
  icon: string;
  available: boolean;
  route?: string;
}

const contactOptions: ContactOption[] = [
  {
    title: "Automated Support",
    description: "Instant resolution for common issues including account access, missing rewards, and technical problems. Most issues resolved in under 2 minutes.",
    icon: "",
    available: true,
    route: "/automated-support"
  },
  {
    title: "Email Support",
    description: "Submit detailed support requests via email with comprehensive responses within 24 hours.",
    icon: "",
    available: false
  }
];

export default function DemoScenarios() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [ollamaEnabled, setOllamaEnabled] = useState(true);
  
  // Load LannisterGold player profile and auto-enable Ollama
  useEffect(() => {
    const loadPlayerProfile = async () => {
      try {
        const response = await fetch('/api/players?playerId=lannister-gold');
        if (response.ok) {
          const profile = await response.json();
          setPlayerProfile(profile);
        }
      } catch (error) {
        console.error('Error loading player profile:', error);
      }
    };
    
    // Auto-enable Ollama to reduce spin-up time
    const initializeOllama = async () => {
      try {
        console.log('🚀 Auto-initializing Ollama for faster chat performance...');
        
        // First, check if Ollama is healthy
        const healthResponse = await fetch('/api/ollama-health', { method: 'GET' });
        
        if (healthResponse.ok) {
          console.log('✅ Ollama health check passed');
          
          // Warm up both critical models for optimal performance
          console.log('🔥 Warming up llama3.1:8b model for faster responses...');
          try {
            // Warm up both chat endpoints to load both models
            const chatPromises = [
              fetch('/api/chat-local', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: 'warmup',
                  playerContext: { player_name: 'system', game_level: 1, vip_level: 0 }
                })
              }),
              fetch('/api/chat-smart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  messages: [{ role: 'user', content: 'warmup' }],
                  playerContext: { player_name: 'system', game_level: 1, vip_level: 0 }
                })
              })
            ];
            
            await Promise.allSettled(chatPromises);
            console.log('✅ Model warm-up complete - both models ready for fast responses');
          } catch (warmupError) {
            console.log('⚠️ Model warm-up failed, but Ollama is running:', warmupError);
          }
        } else {
          console.log('⚠️ Ollama health check failed');
        }
      } catch (error) {
        console.error('⚠️ Ollama initialization failed:', error);
      }
    };
    
    loadPlayerProfile();
    initializeOllama();
  }, []);
  
  const handleContactOption = async (option: ContactOption) => {
    if (!option.available) {
      setError('Email support is coming soon! Please use Automated Support for immediate assistance.');
      return;
    }
    
    if (!option.route) return;
    
    // Handle automated support differently - no demo seed needed
    if (option.route === '/automated-support') {
      console.log('🤖 Navigating to automated support');
      router.push(option.route);
      return;
    }
    
    // For traditional chat, do the demo seed process
    
    setLoading(true);
    setError(null);
    
    try {
      // Create demo session with LannisterGold profile
      const response = await fetch('/api/demo-seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scenarioType: 'high-spender',
          playerId: 'lannister-gold'
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create demo session');
      }
      
      // Store player context for the chat
      if (playerProfile) {
        localStorage.setItem('demoScenario', JSON.stringify({
          playerLevel: playerProfile.game_level,
          playerVip: playerProfile.vip_level,
          playerName: playerProfile.player_name,
          isSpender: playerProfile.is_spender,
          totalSpend: playerProfile.total_spend,
          sessionDays: playerProfile.session_days,
          kingdomId: playerProfile.kingdom_id,
          allianceName: playerProfile.alliance_name,
          playerId: playerProfile.player_id,
          preloadedMessages: [],
          playerMessages: [],
          agentMessages: [],
          freeformContext: `VIP ${playerProfile.vip_level} player in Kingdom #${playerProfile.kingdom_id}. Member of ${playerProfile.alliance_name}. Total spend: $${playerProfile.total_spend}. ${playerProfile.session_days} days active.`
        }));
      }
      
      router.push(option.route);
    } catch (err) {
      console.error('Error starting session:', err);
      setError('Failed to start support session. Please try again.');
      setLoading(false);
    }
  };
  
  
  return (
    <div className="demo-scenarios-container">
      <div className="header-section">
        <h1>Support Center</h1>
        <p>Choose your preferred support method</p>
      </div>
      
      {playerProfile && (
        <div className="player-profile-card">
          <div className="profile-header">
            <h3>{playerProfile.player_name}</h3>
            <div className="profile-badges">
              <span className="badge">Level {playerProfile.game_level}</span>
              <span className="badge">VIP {playerProfile.vip_level}</span>
            </div>
          </div>
          <div className="profile-details">
            <div className="detail-row">
              <span className="detail-label">Total Spend</span>
              <span className="detail-value">${playerProfile.total_spend.toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Kingdom</span>
              <span className="detail-value">{playerProfile.kingdom_id}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Alliance</span>
              <span className="detail-value">{playerProfile.alliance_name}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="ollama-status">
        <div className="status-indicator">
          <div className="status-dot online"></div>
          <span className="status-text">AI System Online</span>
        </div>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="contact-options">
        {contactOptions.map((option, index) => (
          <div 
            key={index}
            className={`contact-card ${!option.available ? 'unavailable' : ''}`}
            onClick={() => handleContactOption(option)}
          >
            <div className="card-content">
              <h3 className="contact-title">{option.title}</h3>
              <p className="contact-description">{option.description}</p>
              {!option.available && (
                <div className="coming-soon-badge">Coming Soon</div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {loading && (
        <div className="loading-container">
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            <span>Starting support session...</span>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .demo-scenarios-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 48px 32px;
          font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .header-section {
          text-align: center;
          margin-bottom: 48px;
        }

        .header-section h1 {
          font-size: 32px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 12px 0;
          letter-spacing: -0.025em;
        }

        .header-section p {
          font-size: 16px;
          color: #64748b;
          margin: 0;
        }
        
        .player-profile-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
        }
        
        .profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .profile-header h3 {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .profile-badges {
          display: flex;
          gap: 8px;
        }

        .badge {
          background: #e2e8f0;
          color: #475569;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .profile-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          font-weight: 500;
          color: #475569;
          font-size: 14px;
        }
        
        .detail-value {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }
        
        .ollama-status {
          display: flex;
          justify-content: center;
          margin-bottom: 40px;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          border: 1px solid #059669;
          border-radius: 8px;
          background: #f0fdf4;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        
        .status-dot.online {
          background: #059669;
          animation: pulse-green 2s infinite;
        }
        
        .status-text {
          font-weight: 500;
          font-size: 15px;
          color: #047857;
        }
        
        @keyframes pulse-green {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .contact-options {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .contact-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 32px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .contact-card:hover:not(.unavailable) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          border-color: #3b82f6;
        }
        
        .contact-card.unavailable {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .card-content {
          position: relative;
        }
        
        .contact-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: #1e293b;
        }
        
        .contact-description {
          font-size: 15px;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }
        
        .coming-soon-badge {
          position: absolute;
          top: -16px;
          right: -16px;
          background: #8b5cf6;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 12px;
        }
        
        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          text-align: center;
          font-weight: 500;
        }
        
        .loading-container {
          display: flex;
          justify-content: center;
          margin-top: 32px;
        }

        .loading-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 16px 24px;
          border-radius: 8px;
          color: #475569;
          font-weight: 500;
        }
        
        .loading-spinner {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #e2e8f0;
          border-top-color: #3b82f6;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 