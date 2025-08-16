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

  useEffect(() => {
    loadPlayerProfile();
  }, []);

  const loadPlayerProfile = async () => {
    try {
      const response = await fetch('/api/players?playerId=lannister-gold');
      if (response.ok) {
        const profile = await response.json();
        setPlayerProfile(profile);
        setFlowState('intake_form');
      } else {
        setError(`Failed to load player profile (${response.status})`);
      }
    } catch (err) {
      setError(`Unable to connect to support system: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleIntakeSubmit = async (data: IntakeFormData) => {
    if (!playerProfile) return;

    setFormData(data);
    setFlowState('processing');
    setError(null);

    try {
      fetch('/api/model-persistence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' })
      }).catch(() => {});

      if ((data as any).sequentialEscalation) {
        await handleSequentialEscalation(data, playerProfile);
      } else {
        // Run AI analysis for regular flow as well
        console.log('🧠 Running AI analysis for regular automated resolution...');
        const analysisStartTime = Date.now();
        
        let aiAnalysis = null;
        try {
          const analysisResponse = await fetch('/api/analyze-player-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              message: data.problemDescription, 
              playerContext: {
                player_name: playerProfile.player_name,
                game_level: playerProfile.game_level,
                vip_level: playerProfile.vip_level,
                total_spend: playerProfile.total_spend,
                is_spender: playerProfile.is_spender
              }
            })
          });
          
          if (analysisResponse.ok) {
            aiAnalysis = await analysisResponse.json();
            const analysisTime = Date.now() - analysisStartTime;
            console.log(`🧠 AI Analysis completed in ${analysisTime}ms for regular flow`);
            
          } else {
            console.warn('AI analysis failed, proceeding with fallback');
          }
        } catch (error) {
          console.warn('AI analysis error, proceeding with fallback:', error);
        }
        
        const resolutionResult = await AutomatedResolutionEngine.resolveIssue(data, playerProfile, aiAnalysis);
        if (resolutionResult.success) {
          await AutomatedResolutionEngine.createAutomatedTicket(data, playerProfile, resolutionResult);
          const detectedSentiment = (data as any).detectedSentiment;
          const requiresHumanDelivery = detectedSentiment?.requiresHuman || ['angry', 'frustrated', 'agitated'].includes(detectedSentiment?.tone);

          if (requiresHumanDelivery) {
            const escalationReason = `Customer resolved automatically but requires human touch due to ${detectedSentiment?.tone} sentiment. Resolution ready for personal delivery.`;
            const dataWithResolution = {
              ...data,
              automatedResolution: resolutionResult,
              humanDeliveryRequired: true,
              sentimentReason: `${detectedSentiment?.tone} sentiment detected (intensity: ${detectedSentiment?.intensity})`
            };
            setResolution(resolutionResult);
            setFlowState('escalated_to_agent');
            await onEscalateToAgent(escalationReason, dataWithResolution, playerProfile);
          } else {
            setResolution(resolutionResult);
            setFlowState('resolution_display');
          }
        } else {
          const escalationReason = resolutionResult.escalationReason || 'Automated resolution could not resolve this issue';
          setResolution(resolutionResult);
          setFlowState('escalated_to_agent');
          await onEscalateToAgent(escalationReason, data, playerProfile);
        }
      }
    } catch (err) {
      setError('Technical error occurred during resolution. Escalating to human agent.');
      await onEscalateToAgent('Technical error during automated resolution', data, playerProfile);
    }
  };

  const handleEscalation = async (reason: string, escalatedFormData?: IntakeFormData) => {
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
    const dataToPass = escalatedFormData || formData || undefined;
    await onEscalateToAgent(reason, dataToPass, playerProfile || undefined);
  };

  const handleStartOver = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('escalatedAnalysisData');
    }
    setFormData(null);
    setResolution(null);
    setError(null);
    setFlowState('intake_form');
  };

  const handleContactAgent = () => {
    const reason = resolution ? `Follow-up needed after automated resolution (Ticket: ${resolution.ticketId})` : 'Player requested human agent after automated process';
    onEscalateToAgent(reason, formData || undefined, playerProfile || undefined);
  };

  const handleSequentialEscalation = async (data: IntakeFormData, playerProfile: PlayerProfile) => {
    try {
      console.log('🔄 Starting sequential escalation with AI analysis...');
      
      const escalationPlayerContext = (data as any).escalationPlayerContext;
      if (!escalationPlayerContext) throw new Error('Missing escalation player context');

      // Step 1: Run AI Analysis (this should take 10-15 seconds)
      console.log('🤖 Step 1: Running AI analysis via llama3.1...');
      const analysisStartTime = Date.now();
      
      const escalationAnalysisResponse = await fetch('/api/analyze-player-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: data.problemDescription, playerContext: escalationPlayerContext })
      });

      if (!escalationAnalysisResponse.ok) {
        const errorText = await escalationAnalysisResponse.text();
        throw new Error(`Escalation analysis failed: ${escalationAnalysisResponse.status} - ${errorText}`);
      }

      const escalationAnalysis = await escalationAnalysisResponse.json();
      const analysisTime = Date.now() - analysisStartTime;
      console.log(`🤖 AI Analysis completed in ${analysisTime}ms:`, escalationAnalysis);
      
      
      // Step 3: Apply resolution based on AI analysis
      console.log('🔧 Step 3: Applying resolution based on AI analysis...');
      let resolutionResult;

      try {
        // Pass AI analysis results to resolution engine
        resolutionResult = await AutomatedResolutionEngine.resolveIssue(data, playerProfile, escalationAnalysis);
      } catch (resolutionError) {
        console.error('Resolution engine failed:', resolutionError);
        resolutionResult = {
          success: false,
          ticketId: 'FALLBACK-' + Date.now(),
          resolution: { category: 'escalation', actions: [], timeline: '', followUpInstructions: '' },
          escalationReason: 'Resolution engine failed - requires human review'
        };
      }

      if (resolutionResult.success) {
        try {
          await AutomatedResolutionEngine.createAutomatedTicket(data, playerProfile, resolutionResult);
        } catch (ticketError) {
          // Continue without ticket - resolution can still proceed
        }

        const aiAnalysisResult = (data as any).aiAnalysisResult;
        const detectedSentiment = (data as any).detectedSentiment || aiAnalysisResult?.sentiment;
        const requiresHumanDelivery = detectedSentiment?.requiresHuman || ['angry', 'frustrated', 'agitated'].includes(detectedSentiment?.tone);

        console.log('🎭 Sentiment Check:', {
          aiAnalysisResult: !!aiAnalysisResult,
          detectedSentiment: detectedSentiment,
          sentimentTone: detectedSentiment?.tone,
          requiresHuman: detectedSentiment?.requiresHuman,
          requiresHumanDelivery: requiresHumanDelivery
        });

        if (requiresHumanDelivery) {
          const escalationReason = `Customer resolved automatically but requires human touch due to ${detectedSentiment?.tone} sentiment. Resolution ready for personal delivery.`;
          
          // Verify escalation analysis data before building data package
          console.log('🔍 ESCALATION DATA VERIFICATION:');
          console.log('🔍 escalationAnalysis exists:', !!escalationAnalysis);
          console.log('🔍 escalationAnalysis structure:', escalationAnalysis);
          console.log('🔍 automatedResolution exists:', !!resolutionResult);
          console.log('🔍 automatedResolution structure:', resolutionResult);
          
          const dataWithResolution = {
            ...data,
            automatedResolution: resolutionResult,
            escalationAnalysis: escalationAnalysis,
            humanDeliveryRequired: true,
            sentimentReason: `${detectedSentiment?.tone} sentiment detected (intensity: ${detectedSentiment?.intensity})`
          };
          
          console.log('🔍 FINAL DATA PACKAGE being passed to onEscalateToAgent:');
          console.log('🔍 dataWithResolution keys:', Object.keys(dataWithResolution));
          console.log('🔍 dataWithResolution.escalationAnalysis:', dataWithResolution.escalationAnalysis);
          console.log('🔍 dataWithResolution.automatedResolution:', dataWithResolution.automatedResolution);
          setResolution(resolutionResult);
          setFlowState('escalated_to_agent');
          await onEscalateToAgent(escalationReason, dataWithResolution, playerProfile);
        } else {
          console.log('✅ No human delivery required - showing resolution display');
          setResolution(resolutionResult);
          setFlowState('resolution_display');
        }
      } else {
        console.log('❌ Resolution failed - escalating to human agent');
        const escalationReason = resolutionResult.escalationReason || 'Automated resolution could not resolve this issue';
        const dataWithAnalysis = { ...data, escalationAnalysis: escalationAnalysis };
        setResolution(resolutionResult);
        setFlowState('escalated_to_agent');
        await onEscalateToAgent(escalationReason, dataWithAnalysis, playerProfile);
      }
    } catch (error) {
      setFlowState('escalated_to_agent');
      await onEscalateToAgent('Processing failed - escalating to human agent', data, playerProfile);
    }
  };

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
          
          {formData && (
            <div className="processing-details">
              <div className="detail-item">
                <span className="detail-label">Priority Level:</span>
                <span className="detail-value">{formData.urgencyLevel.charAt(0).toUpperCase() + formData.urgencyLevel.slice(1)} Priority (AI Selected)</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{formData.problemCategory ? formData.problemCategory.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'AI Analyzing...'}</span>
              </div>
            </div>
          )}
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
            margin: 0 0 24px 0;
            color: #64748b;
          }
          
          .processing-details {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0 32px 0;
            text-align: left;
          }
          
          .detail-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .detail-item:last-child {
            border-bottom: none;
          }
          
          .detail-label {
            font-weight: 600;
            color: #374151;
            font-size: 14px;
          }
          
          .detail-value {
            color: #8b5cf6;
            font-weight: 500;
            font-size: 14px;
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

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <button onClick={loadPlayerProfile}>Try Again</button>
        <button onClick={onReturnToTraditionalChat}>Use Traditional Chat Support</button>
      </div>
    );
  }

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
