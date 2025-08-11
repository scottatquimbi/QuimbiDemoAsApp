'use client';

import React, { useState, useEffect } from 'react';
import AutomatedIntakeForm from './AutomatedIntakeForm';
import AutomatedResolutionDisplay from './AutomatedResolutionDisplay';
import { AutomatedResolutionEngine } from '@/lib/automated-resolution';

interface IntakeFormData {
  identityConfirmed: boolean;
  problemCategory: string;
  problemDescription: string;
  urgencyLevel: string;
  deviceInfo?: string;
  lastKnownWorking?: string;
  affectedFeatures: string[];
}

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

type FlowState = 'loading_profile' | 'intake_form' | 'processing' | 'resolution_display' | 'escalated_to_agent';

interface AutomatedSupportFlowProps {
  onEscalateToAgent: (reason: string, formData?: IntakeFormData, playerProfile?: PlayerProfile) => void | Promise<void>;
  onReturnToTraditionalChat: () => void;
}

export default function AutomatedSupportFlow({ onEscalateToAgent, onReturnToTraditionalChat }: AutomatedSupportFlowProps) {
  const [flowState, setFlowState] = useState<FlowState>('loading_profile');
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null);
  const [formData, setFormData] = useState<IntakeFormData | null>(null);
  const [resolution, setResolution] = useState<AutomatedResolution | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load player profile on component mount
  useEffect(() => {
    loadPlayerProfile();
  }, []);

  const loadPlayerProfile = async () => {
    console.log('🤖 AutomatedSupportFlow: Loading player profile...');
    try {
      const response = await fetch('/api/players?playerId=lannister-gold');
      console.log('🤖 Player profile response status:', response.status);
      
      if (response.ok) {
        const profile = await response.json();
        console.log('🤖 Player profile loaded:', profile);
        setPlayerProfile(profile);
        setFlowState('intake_form');
        console.log('🤖 Flow state changed to intake_form');
      } else {
        console.error('🤖 Failed to load player profile, status:', response.status);
        setError('Failed to load player profile');
      }
    } catch (err) {
      console.error('🤖 Error loading player profile:', err);
      setError('Unable to connect to support system');
    }
  };

  const handleIntakeSubmit = async (data: IntakeFormData) => {
    if (!playerProfile) return;

    setFormData(data);
    setFlowState('processing');
    setError(null);

    try {
      console.log('🤖 Starting automated resolution process...');
      
      // Initialize model persistence after first automated support use
      try {
        const persistenceResponse = await fetch('/api/model-persistence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'initialize' })
        });
        
        if (persistenceResponse.ok) {
          const result = await persistenceResponse.json();
          console.log('🦙 Model persistence initialized for future chat sessions:', result);
        } else {
          console.log('🦙 Model persistence initialization failed (non-critical)');
        }
      } catch (persistenceError) {
        console.log('🦙 Model persistence initialization failed (non-critical):', persistenceError);
      }
      
      // Attempt automated resolution
      const resolutionResult = await AutomatedResolutionEngine.resolveIssue(data, playerProfile);
      
      console.log('🤖 Resolution result:', resolutionResult);
      
      if (resolutionResult.success) {
        // Create ticket for successful automated resolution
        await AutomatedResolutionEngine.createAutomatedTicket(data, playerProfile, resolutionResult);
        
        setResolution(resolutionResult);
        setFlowState('resolution_display');
        
        console.log('✅ Automated resolution completed successfully');
      } else {
        // Handle escalation - immediately show redirecting screen and trigger escalation
        console.log('🔄 Escalating to human agent:', resolutionResult.escalationReason);
        setResolution(resolutionResult);
        setFlowState('escalated_to_agent');
        
        // Immediately trigger the escalation with the resolution reason
        const escalationReason = resolutionResult.escalationReason || 'Automated resolution could not resolve this issue';
        console.log('🔄 Immediately triggering escalation:', escalationReason);
        
        // Short delay to show the redirecting screen, then escalate
        setTimeout(() => {
          onEscalateToAgent(escalationReason, data, playerProfile);
        }, 1500);
      }
    } catch (err) {
      console.error('🚨 Error during automated resolution:', err);
      setError('Technical error occurred during resolution. Escalating to human agent.');
      onEscalateToAgent('Technical error during automated resolution', data, playerProfile);
    }
  };

  const handleEscalation = (reason: string, escalatedFormData?: IntakeFormData) => {
    console.log('🔄 Manual escalation requested:', reason, escalatedFormData ? 'with form data' : 'without form data');
    
    // IMMEDIATELY show the escalation screen
    setFlowState('escalated_to_agent');
    setResolution({
      success: false,
      ticketId: 'ESCALATED-' + Date.now(),
      resolution: {
        category: 'escalation',
        actions: [],
        timeline: '',
        followUpInstructions: ''
      },
      escalationReason: reason
    });
    
    // Use the escalated form data if provided, otherwise fall back to stored form data
    const dataToPass = escalatedFormData || formData || undefined;
    
    // Short delay to show the redirecting screen, then escalate
    setTimeout(() => {
      onEscalateToAgent(reason, dataToPass, playerProfile || undefined);
    }, 1500);
  };

  const handleStartOver = () => {
    console.log('🔄 Start Over button clicked - returning to intake form');
    
    // Clean up any escalated analysis data when starting over (non-blocking)
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        try {
          localStorage.removeItem('escalatedAnalysisData');
        } catch (error) {
          console.log('Non-critical: Failed to clear localStorage:', error);
        }
      }, 0);
    }
    
    // Immediately update state for fast UI response
    setFormData(null);
    setResolution(null);
    setError(null);
    setFlowState('intake_form');
  };

  const handleContactAgent = () => {
    console.log('🔄 Contact Agent button clicked');
    console.log('🔄 Current formData:', formData);
    console.log('🔄 Current resolution:', resolution);
    
    const reason = resolution ? 
      `Follow-up needed after automated resolution (Ticket: ${resolution.ticketId})` : 
      'Player requested human agent after automated process';
    
    console.log('🔄 Escalation reason:', reason);
    console.log('🔄 Calling onEscalateToAgent...');
    
    onEscalateToAgent(reason, formData || undefined, playerProfile || undefined);
  };

  // Render loading state
  if (flowState === 'loading_profile') {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h2>Loading your account...</h2>
          <p>Retrieving your profile and support history</p>
        </div>
        
        <style jsx>{`
          .loading-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #fafafa;
          }
          
          .loading-content {
            text-align: center;
            padding: 48px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .loading-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #e5e7eb;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 24px;
          }
          
          .loading-content h2 {
            margin: 0 0 8px 0;
            color: #1e293b;
          }
          
          .loading-content p {
            margin: 0;
            color: #64748b;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Render processing state
  if (flowState === 'processing') {
    return (
      <div className="processing-container">
        <div className="processing-content">
          <div className="processing-animation">
            <div className="processing-spinner"></div>
            <div className="processing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <h2>AI Processing Your Request</h2>
          <p>Analyzing your issue and applying automated resolution...</p>
          <div className="processing-steps">
            <div className="step completed">
              <span className="step-icon"></span>
              <span className="step-text">Identity verified</span>
            </div>
            <div className="step completed">
              <span className="step-icon"></span>
              <span className="step-text">Issue categorized</span>
            </div>
            <div className="step active">
              <span className="step-icon"></span>
              <span className="step-text">Applying resolution...</span>
            </div>
            <div className="step pending">
              <span className="step-icon"></span>
              <span className="step-text">Generating ticket</span>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          .processing-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #fafafa;
          }
          
          .processing-content {
            text-align: center;
            padding: 48px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            max-width: 500px;
          }
          
          .processing-animation {
            position: relative;
            margin-bottom: 32px;
          }
          
          .processing-spinner {
            width: 64px;
            height: 64px;
            border: 4px solid #e0f2fe;
            border-top-color: #0ea5e9;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
          }
          
          .processing-dots {
            display: flex;
            justify-content: center;
            gap: 4px;
            margin-top: 16px;
          }
          
          .processing-dots span {
            width: 8px;
            height: 8px;
            background: #3b82f6;
            border-radius: 50%;
            animation: bounce 1.4s ease-in-out infinite both;
          }
          
          .processing-dots span:nth-child(1) { animation-delay: -0.32s; }
          .processing-dots span:nth-child(2) { animation-delay: -0.16s; }
          
          .processing-content h2 {
            margin: 0 0 8px 0;
            color: #1e293b;
            font-size: 24px;
          }
          
          .processing-content p {
            margin: 0 0 32px 0;
            color: #64748b;
          }
          
          .processing-steps {
            display: flex;
            flex-direction: column;
            gap: 12px;
            text-align: left;
          }
          
          .step {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px;
            border-radius: 6px;
            transition: all 0.3s;
          }
          
          .step.completed {
            background: #f0fdf4;
            color: #166534;
          }
          
          .step.active {
            background: #eff6ff;
            color: #1e40af;
            animation: pulse 1s infinite;
          }
          
          .step.pending {
            color: #9ca3af;
          }
          
          .step-icon {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #9ca3af;
            display: inline-block;
          }
          
          .step.completed .step-icon {
            background: #8b5cf6;
          }
          
          .step.active .step-icon {
            background: #3b82f6;
          }
          
          .step-text {
            font-weight: 500;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          @keyframes bounce {
            0%, 80%, 100% { 
              transform: scale(0.8);
              opacity: 0.5; 
            } 
            40% { 
              transform: scale(1);
              opacity: 1; 
            }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
        `}</style>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon"></div>
          <h2>Service Temporarily Unavailable</h2>
          <p>{error}</p>
          <button className="retry-button" onClick={loadPlayerProfile}>
            Try Again
          </button>
          <button className="fallback-button" onClick={onReturnToTraditionalChat}>
            Use Traditional Chat Support
          </button>
        </div>
        
        <style jsx>{`
          .error-container {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #fafafa;
          }
          
          .error-content {
            text-align: center;
            padding: 48px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-top: 4px solid #7c3aed;
          }
          
          .error-icon {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #7c3aed;
            margin: 0 auto 16px;
          }
          
          .error-content h2 {
            margin: 0 0 8px 0;
            color: #7c3aed;
          }
          
          .error-content p {
            margin: 0 0 24px 0;
            color: #64748b;
          }
          
          .retry-button, .fallback-button {
            display: block;
            width: 100%;
            padding: 12px 24px;
            margin-bottom: 12px;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .retry-button {
            background: #3b82f6;
            color: white;
          }
          
          .retry-button:hover {
            background: #2563eb;
          }
          
          .fallback-button {
            background: #f3f4f6;
            color: #374151;
          }
          
          .fallback-button:hover {
            background: #e5e7eb;
          }
        `}</style>
      </div>
    );
  }

  // Main flow rendering
  if (!playerProfile) return null;

  return (
    <div className="automated-support-flow">
      {flowState === 'intake_form' && (
        <AutomatedIntakeForm
          playerProfile={playerProfile}
          onSubmit={handleIntakeSubmit}
          onEscalate={handleEscalation}
        />
      )}
      
      {flowState === 'resolution_display' && resolution && (
        <AutomatedResolutionDisplay
          resolution={resolution}
          playerProfile={playerProfile}
          onStartOver={handleStartOver}
          onContactAgent={handleContactAgent}
        />
      )}
      
      {flowState === 'escalated_to_agent' && resolution && (
        <div className="redirecting-container">
          <div className="redirecting-content">
            <div className="redirecting-animation">
              <div className="redirecting-spinner"></div>
              <div className="redirecting-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <h2>Transferring to Human Agent</h2>
            <p>Your case requires specialized attention. You'll be connected with a human agent shortly.</p>
            <div className="redirect-info">
              <div className="info-item">
                <span className="info-label">Issue:</span>
                <span className="info-value">{formData?.problemDescription || 'Technical support required'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Priority:</span>
                <span className="info-value">High - Human Review Required</span>
              </div>
            </div>
          </div>
          
          <style jsx>{`
            .redirecting-container {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            
            .redirecting-content {
              text-align: center;
              padding: 48px;
              background: rgba(255, 255, 255, 0.95);
              border-radius: 16px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
              max-width: 500px;
              backdrop-filter: blur(10px);
            }
            
            .redirecting-animation {
              margin-bottom: 32px;
            }
            
            .redirecting-spinner {
              width: 64px;
              height: 64px;
              border: 4px solid #e0e7ff;
              border-top-color: #8b5cf6;
              border-radius: 50%;
              animation: spin 1.2s linear infinite;
              margin: 0 auto;
            }
            
            .redirecting-dots {
              display: flex;
              justify-content: center;
              gap: 6px;
              margin-top: 16px;
            }
            
            .redirecting-dots span {
              width: 10px;
              height: 10px;
              background: #8b5cf6;
              border-radius: 50%;
              animation: bounce 1.4s ease-in-out infinite both;
            }
            
            .redirecting-dots span:nth-child(1) { animation-delay: -0.32s; }
            .redirecting-dots span:nth-child(2) { animation-delay: -0.16s; }
            
            .redirecting-content h2 {
              margin: 0 0 12px 0;
              color: #1e293b;
              font-size: 28px;
              font-weight: 700;
            }
            
            .redirecting-content p {
              margin: 0 0 32px 0;
              color: #64748b;
              font-size: 16px;
              line-height: 1.5;
            }
            
            .redirect-info {
              display: flex;
              flex-direction: column;
              gap: 16px;
              text-align: left;
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #8b5cf6;
            }
            
            .info-item {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 12px;
            }
            
            .info-label {
              font-weight: 600;
              color: #374151;
              min-width: 60px;
            }
            
            .info-value {
              color: #1f2937;
              text-align: right;
              flex: 1;
            }
            
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            
            @keyframes bounce {
              0%, 80%, 100% { 
                transform: scale(0.8);
                opacity: 0.5; 
              } 
              40% { 
                transform: scale(1);
                opacity: 1; 
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}