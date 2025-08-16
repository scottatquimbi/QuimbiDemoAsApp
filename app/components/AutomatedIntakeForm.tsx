'use client';

import React, { useState, useEffect } from 'react';

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

interface IntakeFormData {
  identityConfirmed: boolean;
  problemCategory: string;
  problemDescription: string;
  urgencyLevel: string;
  deviceInfo?: string;
  lastKnownWorking?: string;
  affectedFeatures: string[];
}

const PROBLEM_CATEGORIES = [
  { id: 'account_access', label: 'Account Access', description: 'Login, password, or locked account issues', autoResolvable: true },
  { id: 'missing_rewards', label: 'Missing Rewards', description: 'Daily rewards, event items, or missing purchases', autoResolvable: true },
  { id: 'purchase_issues', label: 'Billing & Purchases', description: 'Payment issues, missing items, or refunds', autoResolvable: true },
  { id: 'technical', label: 'Technical Issues', description: 'Crashes, performance, or connectivity problems', autoResolvable: true },
  { id: 'gameplay', label: 'Gameplay Issues', description: 'Game mechanics, bugs, or balance concerns', autoResolvable: false },
  { id: 'account_recovery', label: 'Account Recovery', description: 'Lost progress or account restoration', autoResolvable: false },
  { id: 'other', label: 'Other Issues', description: 'Complex problems requiring human review', autoResolvable: false }
];

const URGENCY_LEVELS = [
  { id: 'low', label: 'Low Priority', description: 'General inquiry or minor issue', color: '#8b5cf6' },
  { id: 'medium', label: 'Medium Priority', description: 'Affecting gameplay experience', color: '#8b5cf6' },
  { id: 'high', label: 'High Priority', description: 'Cannot access account or play', color: '#7c3aed' }
];

interface AutomatedIntakeFormProps {
  playerProfile: PlayerProfile;
  onSubmit: (formData: IntakeFormData) => void;
  onEscalate: (reason: string, formData?: IntakeFormData) => void;
}

export default function AutomatedIntakeForm({ playerProfile, onSubmit, onEscalate }: AutomatedIntakeFormProps) {
  const [formData, setFormData] = useState<IntakeFormData>({
    identityConfirmed: false,
    problemCategory: '',
    problemDescription: '',
    urgencyLevel: 'medium',
    affectedFeatures: []
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showIdentityVerification, setShowIdentityVerification] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false); // Prevent race condition
  
  const selectedCategory = PROBLEM_CATEGORIES.find(cat => cat.id === formData.problemCategory);
  const canAutoResolve = selectedCategory?.autoResolvable || aiAnalysis?.autoResolvable || false;
  const isSubmitDisabled = !formData.problemDescription.trim() || isProcessing || isAnalyzing;

  const handleIdentityConfirmation = (confirmed: boolean) => {
    setFormData(prev => ({ ...prev, identityConfirmed: confirmed }));
    setShowIdentityVerification(false);
    if (!confirmed) {
      onEscalate('Identity verification failed - requires human agent');
      return;
    }
    setCurrentStep(2);
  };

  // Dependency-based escalation handler with proper sequential operations
  const handleEscalationPath = async (formData: IntakeFormData, aiAnalysis: any) => {
    try {
      
      // Step 4.1: Prevent race condition - check if already submitted
      if (hasSubmitted) {
        return;
      }
      
      // Step 4.2: Set processing state (depends on race condition check)
      setHasSubmitted(true);
      setIsProcessing(true);
      
      // Step 4.3: Prepare escalation data (depends on processing state)
      
      // Step 4.4: Add escalation flags and data (depends on Step 4.3)
      (formData as any).sequentialEscalation = true;
      (formData as any).aiAnalysisResult = aiAnalysis;
      (formData as any).escalationPlayerContext = {
        player_name: playerProfile.player_name,
        game_level: playerProfile.game_level,
        vip_level: playerProfile.vip_level,
        total_spend: playerProfile.total_spend,
        kingdom_id: playerProfile.kingdom_id,
        alliance_name: playerProfile.alliance_name,
        is_spender: playerProfile.is_spender,
        session_days: playerProfile.session_days
      };
      
      // Step 4.5: Pass to AutomatedSupportFlow (depends on Step 4.4)
      
      // Pass to AutomatedSupportFlow which will handle the dependency-based processing
      onSubmit(formData);
      
    } catch (error) {
      setIsProcessing(false);
      setHasSubmitted(false);
      // Fall back to regular escalation
      onEscalate('Escalation processing failed - routing to human agent', formData);
    }
  };

  const analyzeWithAI = async (description: string) => {
    if (description.trim().length < 10) {
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch('/api/analyze-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemDescription: description,
          playerId: playerProfile.player_id,
          playerContext: {
            gameLevel: playerProfile.game_level,
            vipLevel: playerProfile.vip_level,
            isSpender: playerProfile.is_spender
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        setAiAnalysis(result.analysis);
        
        // Handle different routing decisions
        if (result.analysis.routeDecision === 'automated') {
          // Auto-select the top category and urgency level
          const topCategory = result.analysis.suggestedCategories[0];
          const suggestedUrgency = result.analysis.suggestedUrgency || 'medium';
          
          setFormData(prev => ({ 
            ...prev, 
            problemCategory: topCategory.id,
            urgencyLevel: suggestedUrgency
          }));
          
          
          // Special handling for account lock with email verification
          if (result.analysis.accountLocked && result.analysis.requiresEmailVerification) {
            // Route to email verification flow
          }
        } else if (result.analysis.routeDecision === 'human') {
          // BUSINESS LOGIC: Always attempt automated resolution first, even if sentiment suggests human attention
          // If automated resolution succeeds AND user is upset, pass the resolution to human agent for personal delivery
          
          // Set suggested category if available and continue to automated resolution
          if (!formData.problemCategory && result.analysis.suggestedCategories.length > 0) {
            const suggestedCategory = result.analysis.suggestedCategories[0].id;
            setFormData(prev => ({ ...prev, problemCategory: suggestedCategory }));
            formData.problemCategory = suggestedCategory;
          }
          
          // Store sentiment info for later use in escalation if needed
          (formData as any).detectedSentiment = result.analysis.sentiment;
          
          // Sequential flow: Handle escalation path with proper processing order
          
          // Call the sequential escalation handler
          handleEscalationPath(formData, result.analysis);
          return; // Exit early to prevent showing the button UI
        } else {
          // Show category suggestions for user to choose
          setShowCategorySuggestions(true);
        }
      } else if (result.fallback) {
        // Use fallback analysis
        setAiAnalysis(result.fallback);
        setShowCategorySuggestions(true);
      }
    } catch (error) {
      console.error('🚨 AI Analysis failed:', error);
      // Fall back to manual category selection
      setShowCategorySuggestions(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCategorySelection = (categoryId: string) => {
    setFormData(prev => ({ ...prev, problemCategory: categoryId }));
    setShowCategorySuggestions(false);
  };

  const handleSubmit = async () => {
    if (!formData.problemDescription.trim()) {
      return;
    }

    // If we haven't analyzed the description yet, do it now
    if (!aiAnalysis && !formData.problemCategory) {
      await analyzeWithAI(formData.problemDescription);
      return; // Analysis will handle the flow
    }

    setIsProcessing(true);
    
    // Check if category is auto-resolvable IMMEDIATELY - don't wait for AI analysis
    const selectedCategoryData = PROBLEM_CATEGORIES.find(cat => cat.id === formData.problemCategory);
    const isAutoResolvable = selectedCategoryData?.autoResolvable ?? canAutoResolve;
    
    // If NOT auto-resolvable, immediately escalate (no delay)
    if (!isAutoResolvable) {
      const categoryLabel = selectedCategoryData?.label || aiAnalysis?.suggestedCategories?.[0]?.id || 'unknown';
      onEscalate(`Complex issue requiring human review: ${categoryLabel}`, formData);
      return;
    }
    
    // Direct submission for auto-resolvable cases
    
    // Prevent race condition - check if already submitted
    if (hasSubmitted) {
      setIsProcessing(false);
      return;
    }
    setHasSubmitted(true);
    
    onSubmit(formData);
    setIsProcessing(false);
  };

  const urgencyLevel = URGENCY_LEVELS.find(level => level.id === formData.urgencyLevel);

  return (
    <div className="intake-container">
      <div className="welcome-header">
        <h1>Automated Support</h1>
        <div className="player-info">
          <div className="player-name">{playerProfile.player_name}</div>
          <div className="player-details">
            <span>Level {playerProfile.game_level}</span>
            <span>VIP {playerProfile.vip_level}</span>
            <span>Kingdom {playerProfile.kingdom_id}</span>
          </div>
        </div>
      </div>

      {showIdentityVerification && (
        <div className="identity-verification">
          <h3>Identity Verification</h3>
          <p>To protect your account, please confirm the following details:</p>
          <div className="verification-details">
            <div className="detail-item">
              <span className="label">Alliance</span>
              <span className="value">{playerProfile.alliance_name}</span>
            </div>
            <div className="detail-item">
              <span className="label">Total Spend</span>
              <span className="value">${playerProfile.total_spend.toFixed(2)}</span>
            </div>
            <div className="detail-item">
              <span className="label">Account Age</span>
              <span className="value">{playerProfile.session_days} days</span>
            </div>
          </div>
          <div className="verification-buttons">
            <button className="confirm-button" onClick={() => handleIdentityConfirmation(true)}>
              Confirm Identity
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="problem-intake">
          <div className="step-header">
            <h3>Describe Your Issue</h3>
            <p>Tell us what's happening and our AI will suggest the best way to help you</p>
          </div>

          <div className="form-section">
            <label className="form-label">What's the problem?</label>
            <textarea
              className="problem-description"
              placeholder="Describe your issue in detail. For example: 'I can't log into my account after changing devices' or 'I completed a battle but didn't receive my rewards'..."
              value={formData.problemDescription}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, problemDescription: e.target.value }));
                
                // Clear any existing timeout to prevent analysis during typing
                if ((window as any).descriptionTimeout) {
                  clearTimeout((window as any).descriptionTimeout);
                }
              }}
              rows={4}
            />
            
            {isAnalyzing && (
              <div className="ai-analysis-status">
                <div className="analysis-spinner"></div>
                <span>AI is analyzing your issue...</span>
              </div>
            )}
          </div>

          {showCategorySuggestions && aiAnalysis && (
            <div className="form-section">
              <label className="form-label">AI Suggestions</label>
              <div className="ai-suggestions">
                <p className="suggestion-intro">Based on your description, this looks like:</p>
                <div className="category-suggestions">
                  {aiAnalysis.suggestedCategories.map((suggestion: any, index: number) => {
                    const category = PROBLEM_CATEGORIES.find(cat => cat.id === suggestion.id);
                    if (!category) return null;
                    
                    return (
                      <div
                        key={category.id}
                        className={`suggestion-card ${formData.problemCategory === category.id ? 'selected' : ''} ${category.autoResolvable ? 'auto-resolvable' : 'manual-review'}`}
                        onClick={() => handleCategorySelection(category.id)}
                      >
                        <div className="suggestion-content">
                          <div className="suggestion-header">
                            <span className="category-label">{category.label}</span>
                            <div className="confidence-score">
                              {Math.round(suggestion.confidence * 100)}% match
                            </div>
                          </div>
                          <p className="category-description">{category.description}</p>
                          <p className="ai-reasoning">{suggestion.reasoning}</p>
                          <div className="resolution-badge">
                            {category.autoResolvable ? 'Automated Resolution' : 'Human Agent Required'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="suggestion-actions">
                  <button 
                    className="different-issue-btn"
                    onClick={() => {
                      setShowCategorySuggestions(false);
                      setAiAnalysis(null);
                      onEscalate('None of the AI suggestions match - routing to human agent', formData);
                    }}
                  >
                    None of these match - talk to a human
                  </button>
                </div>
              </div>
            </div>
          )}

{/* Priority is automatically set by AI - not shown on intake form, only on processing screen */}

          {canAutoResolve && (
            <div className="auto-resolution-notice">
              <div className="notice-content">
                <div className="notice-text">
                  {aiAnalysis?.accountLocked ? (
                    <>
                      <strong>🔐 Account Security Verification</strong>
                      <p>Your account is locked for security. We can unlock it with email verification.</p>
                    </>
                  ) : (
                    <>
                      <strong>Automated Resolution Available</strong>
                      <p>This issue type can typically be resolved automatically within seconds.</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button 
              className={`submit-button ${canAutoResolve ? 'auto-resolve' : 'escalate'}`}
              onClick={handleSubmit}
              disabled={!formData.problemDescription.trim() || isProcessing || isAnalyzing}
            >
              {isProcessing ? (
                <>
                  <div className="loading-spinner"></div>
                  Processing...
                </>
              ) : (
                <>
                  {canAutoResolve ? 'Get Automated Resolution' : 'Submit for Review'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .intake-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 32px;
          background: #ffffff;
          font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, sans-serif;
          /* Force scrollable layout */
          min-height: auto;
          height: auto;
        }

        .welcome-header {
          margin-bottom: 48px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .welcome-header h1 {
          margin: 0 0 12px 0;
          font-size: 32px;
          font-weight: 600;
          color: #1e293b;
          letter-spacing: -0.025em;
        }

        .player-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .player-name {
          font-size: 18px;
          font-weight: 500;
          color: #475569;
        }

        .player-details {
          display: flex;
          gap: 24px;
          font-size: 14px;
          color: #64748b;
        }

        .player-details span {
          font-weight: 500;
        }

        .identity-verification {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 32px;
          margin-bottom: 48px;
        }

        .identity-verification h3 {
          margin: 0 0 8px 0;
          color: #1e293b;
          font-size: 20px;
          font-weight: 600;
        }

        .identity-verification p {
          margin: 0 0 24px 0;
          color: #64748b;
          font-size: 15px;
        }

        .verification-details {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .label {
          font-weight: 500;
          color: #475569;
          font-size: 14px;
        }

        .value {
          font-weight: 600;
          color: #1e293b;
          font-size: 14px;
        }

        .verification-buttons {
          display: flex;
          gap: 16px;
          margin-top: 24px;
        }

        .confirm-button {
          flex: 1;
          padding: 14px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #8b5cf6;
          color: white;
        }

        .confirm-button:hover {
          background: #7c3aed;
          transform: translateY(-1px);
        }

        .problem-intake {
          margin-bottom: 48px;
        }

        .step-header {
          margin-bottom: 48px;
        }

        .step-header h3 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
          letter-spacing: -0.025em;
        }

        .step-header p {
          margin: 0;
          color: #64748b;
          font-size: 16px;
        }

        .form-section {
          margin-bottom: 40px;
        }

        .form-label {
          display: block;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 16px;
          font-size: 16px;
        }

        .category-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        .category-card {
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }

        .category-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
          transform: translateY(-1px);
        }

        .category-card.selected {
          border-color: #3b82f6;
          background: #f8fafc;
          box-shadow: 0 0 0 1px #3b82f6;
        }

        .category-content {
          width: 100%;
        }

        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .category-label {
          font-weight: 600;
          color: #1e293b;
          font-size: 16px;
        }

        .category-description {
          color: #64748b;
          font-size: 14px;
          margin: 0;
          line-height: 1.5;
        }

        .resolution-badge {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          flex-shrink: 0;
        }

        .resolution-badge.auto {
          background: #dcfce7;
          color: #166534;
        }

        .resolution-badge.manual {
          background: #f3f4f6;
          color: #6b21a8;
        }

        .problem-description {
          width: 100%;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 15px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          resize: vertical;
          min-height: 120px;
          transition: all 0.2s ease;
        }

        .problem-description:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .problem-description::placeholder {
          color: #94a3b8;
        }

        .urgency-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .urgency-option {
          padding: 20px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }

        .urgency-option:hover {
          border-color: #3b82f6;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
        }

        .urgency-option.selected {
          border-color: #3b82f6;
          background: #f8fafc;
          box-shadow: 0 0 0 1px #3b82f6;
        }

        .urgency-content {
          width: 100%;
        }

        .urgency-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .urgency-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .urgency-label {
          font-weight: 600;
          color: #1e293b;
          font-size: 15px;
        }

        .urgency-description {
          color: #64748b;
          font-size: 14px;
          margin: 0;
          line-height: 1.4;
        }

        .auto-selected-urgency {
          margin-bottom: 20px;
        }

        .urgency-display {
          padding: 20px;
          border: 2px solid #8b5cf6;
          border-radius: 8px;
          background: #f5f3ff;
          pointer-events: none;
        }

        .urgency-display .urgency-label {
          color: #6b21a8;
          font-weight: 600;
        }

        .urgency-display .urgency-description {
          color: #7c3aed;
        }

        .auto-resolution-notice {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 32px;
        }

        .notice-content {
          display: flex;
          align-items: flex-start;
        }

        .notice-text strong {
          color: #065f46;
          display: block;
          margin-bottom: 6px;
          font-size: 15px;
          font-weight: 600;
        }

        .notice-text p {
          margin: 0;
          color: #047857;
          font-size: 14px;
          line-height: 1.5;
        }

        .form-actions {
          margin-top: 48px;
        }

        .submit-button {
          width: 100%;
          padding: 16px 32px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .submit-button.auto-resolve {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }

        .submit-button.auto-resolve:hover:not(:disabled) {
          background: linear-gradient(135deg, #7c3aed 0%, #6b21a8 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(139, 92, 246, 0.25);
        }

        .submit-button.escalate {
          background: linear-gradient(135deg, #7c3aed 0%, #6b21a8 100%);
          color: white;
        }

        .submit-button.escalate:hover:not(:disabled) {
          background: linear-gradient(135deg, #6b21a8 0%, #581c87 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(124, 58, 237, 0.25);
        }

        .submit-button:disabled {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: #e9d5ff;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
          opacity: 0.6;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .ai-analysis-status {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
          padding: 12px 16px;
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          color: #0369a1;
          font-size: 14px;
          font-weight: 500;
        }

        .analysis-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #bae6fd;
          border-top-color: #0369a1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .ai-suggestions {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          padding: 20px;
        }

        .suggestion-intro {
          margin: 0 0 16px 0;
          color: #065f46;
          font-weight: 500;
          font-size: 15px;
        }

        .category-suggestions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .suggestion-card {
          background: white;
          border: 2px solid #d1fae5;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .suggestion-card:hover {
          border-color: #8b5cf6;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.1);
        }

        .suggestion-card.selected {
          border-color: #8b5cf6;
          background: #f5f3ff;
          box-shadow: 0 0 0 1px #8b5cf6;
        }

        .suggestion-content {
          width: 100%;
        }

        .suggestion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .confidence-score {
          background: #8b5cf6;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }

        .ai-reasoning {
          color: #7c3aed;
          font-size: 13px;
          font-style: italic;
          margin: 8px 0;
          line-height: 1.4;
        }

        .suggestion-actions {
          display: flex;
          justify-content: center;
        }

        .different-issue-btn {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .different-issue-btn:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}