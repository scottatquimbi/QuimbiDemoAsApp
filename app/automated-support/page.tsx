'use client';

import { useState } from 'react';
import AutomatedSupportFlow from '@/app/components/AutomatedSupportFlow';
import Header from '@/app/components/Header';
import { useRouter } from 'next/navigation';

interface IntakeFormData {
  identityConfirmed: boolean;
  problemCategory: string;
  problemDescription: string;
  urgencyLevel: string;
  deviceInfo?: string;
  lastKnownWorking?: string;
  affectedFeatures: string[];
}

export default function AutomatedSupportPage() {
  const router = useRouter();

  const handleEscalateToAgent = async (reason: string, formData?: IntakeFormData, playerProfile?: any) => {
    console.log('🔄 Escalating to human agent:', reason);
    console.log('🔄 Form data received:', formData);
    console.log('🔄 Player profile received:', playerProfile);
    
    // Store escalation data for the traditional chat system
    if (formData) {
      const escalationData = {
        reason,
        formData,
        timestamp: new Date().toISOString()
      };
      console.log('🔄 Storing escalation data:', escalationData);
      localStorage.setItem('escalatedCase', JSON.stringify(escalationData));
    } else {
      console.log('⚠️ No form data to store for escalation');
    }
    
    // Extract problem description and automated resolution from form data
    const problemDescription = formData?.problemDescription || 'No specific problem description provided';
    const automatedResolution = (formData as any)?.automatedResolution;
    const humanDeliveryRequired = (formData as any)?.humanDeliveryRequired;
    const sentimentReason = (formData as any)?.sentimentReason;
    
    // Run immediate analysis on the problem for the agent
    let analysisResults = null;
    if (formData?.problemDescription && playerProfile) {
      console.log('🔄 Running immediate problem analysis for agent...');
      try {
        const playerContext = {
          gameLevel: playerProfile.game_level,
          vipLevel: playerProfile.vip_level,
          isSpender: playerProfile.is_spender,
          playerId: playerProfile.player_id,
          accountStatus: playerProfile.account_status,
          lockReason: playerProfile.lock_reason,
          freeformContext: `VIP ${playerProfile.vip_level} player in Kingdom #${playerProfile.kingdom_id}. Member of ${playerProfile.alliance_name}. Total spend: $${playerProfile.total_spend}. ${playerProfile.session_days} days active. ${playerProfile.account_status === 'locked' ? `ACCOUNT STATUS: LOCKED (${playerProfile.lock_reason}). ` : ''}ESCALATED FROM AUTOMATED SUPPORT: ${reason}. ORIGINAL PROBLEM: "${problemDescription}"${humanDeliveryRequired ? `\n\n--- AUTOMATED RESOLUTION AVAILABLE ---\nIssue was automatically resolved but customer requires human touch due to ${sentimentReason}.\n\nResolution Category: ${automatedResolution?.resolution?.category}\nResolution Actions: ${automatedResolution?.resolution?.actions?.join('; ')}\nCompensation: ${automatedResolution?.resolution?.compensation?.description || 'None'}\nTimeline: ${automatedResolution?.resolution?.timeline}\nInstructions: ${automatedResolution?.resolution?.followUpInstructions}\n\nAgent should deliver this resolution personally with empathy.` : ''}`
        };

        // Call the analysis API
        const analysisResponse = await fetch('/api/analyze-player-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: formData.problemDescription,
            playerContext: playerContext
          })
        });

        if (analysisResponse.ok) {
          analysisResults = await analysisResponse.json();
          console.log('🔄 Problem analysis completed:', analysisResults);
          console.log('🔄 DEBUG INFO FROM API:', analysisResults.__debug);
          console.log('🔄 ISSUE DETECTED:', analysisResults.issueDetected);
          console.log('🔄 FULL ANALYSIS RESULT:', JSON.stringify(analysisResults, null, 2));
          
          // Store the analysis results for the chat system to use immediately
          localStorage.setItem('escalatedAnalysisData', JSON.stringify(analysisResults));
          console.log('🔄 Stored escalated analysis data for immediate three-part response');
        } else {
          console.log('🔄 Problem analysis failed, continuing without analysis');
        }
      } catch (error) {
        console.log('🔄 Problem analysis error (non-critical):', error);
      }
    }
    
    // IMPORTANT: Set demo scenario data to prevent redirect to /demo
    // Use real player profile data if available
    const demoScenarioData = playerProfile ? {
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
      freeformContext: `VIP ${playerProfile.vip_level} player in Kingdom #${playerProfile.kingdom_id}. Member of ${playerProfile.alliance_name}. Total spend: $${playerProfile.total_spend}. ${playerProfile.session_days} days active. ESCALATED FROM AUTOMATED SUPPORT: ${reason}. ORIGINAL PROBLEM: "${problemDescription}"${humanDeliveryRequired ? `\n\n--- AUTOMATED RESOLUTION AVAILABLE ---\nIssue was automatically resolved but customer requires human touch due to ${sentimentReason}.\n\nResolution Category: ${automatedResolution?.resolution?.category}\nResolution Actions: ${automatedResolution?.resolution?.actions?.join('; ')}\nCompensation: ${automatedResolution?.resolution?.compensation?.description || 'None'}\nTimeline: ${automatedResolution?.resolution?.timeline}\nInstructions: ${automatedResolution?.resolution?.followUpInstructions}\n\nAgent should deliver this resolution personally with empathy.` : ''}${analysisResults && analysisResults.issueDetected ? `\n\n--- AUTOMATED ANALYSIS ---\nIssue Type: ${analysisResults.issue?.issueType || 'Unknown'}\nPlayer Impact: ${analysisResults.issue?.playerImpact || 'Unknown'}\nSentiment: ${analysisResults.sentiment?.tone || 'Unknown'} (urgency: ${analysisResults.sentiment?.urgency || 'Unknown'})\nRecommended Compensation: ${analysisResults.compensation?.tier || 'None'}\nAnalysis: ${analysisResults.issue?.description || 'No analysis available'}\nRequires Human Review: ${analysisResults.compensation?.requiresHumanReview ? 'Yes' : 'No'}` : ''}`
    } : {
      // Fallback for cases without player profile
      playerLevel: 1,
      playerVip: 0,
      playerName: 'EscalatedUser',
      isSpender: false,
      totalSpend: 0,
      sessionDays: 1,
      kingdomId: 1,
      allianceName: 'Support',
      playerId: 'escalated-user',
      preloadedMessages: [],
      playerMessages: [],
      agentMessages: [],
      freeformContext: `ESCALATED FROM AUTOMATED SUPPORT: ${reason}. ORIGINAL PROBLEM: "${problemDescription}"${humanDeliveryRequired ? `\n\n--- AUTOMATED RESOLUTION AVAILABLE ---\nIssue was automatically resolved but customer requires human touch due to ${sentimentReason}.\n\nResolution Category: ${automatedResolution?.resolution?.category}\nResolution Actions: ${automatedResolution?.resolution?.actions?.join('; ')}\nCompensation: ${automatedResolution?.resolution?.compensation?.description || 'None'}\nTimeline: ${automatedResolution?.resolution?.timeline}\nInstructions: ${automatedResolution?.resolution?.followUpInstructions}\n\nAgent should deliver this resolution personally with empathy.` : ''}${analysisResults && analysisResults.issueDetected ? `\n\n--- AUTOMATED ANALYSIS ---\nIssue Type: ${analysisResults.issue?.issueType || 'Unknown'}\nPlayer Impact: ${analysisResults.issue?.playerImpact || 'Unknown'}\nSentiment: ${analysisResults.sentiment?.tone || 'Unknown'} (urgency: ${analysisResults.sentiment?.urgency || 'Unknown'})\nRecommended Compensation: ${analysisResults.compensation?.tier || 'None'}\nAnalysis: ${analysisResults.issue?.description || 'No analysis available'}\nRequires Human Review: ${analysisResults.compensation?.requiresHumanReview ? 'Yes' : 'No'}` : ''}`
    };
    
    console.log('🔄 Setting demo scenario data to prevent redirect');
    localStorage.setItem('demoScenario', JSON.stringify(demoScenarioData));
    
    console.log('🔄 Analysis completed, redirecting directly to /chat?escalated=true');
    // Redirect immediately - the purple waiting screen has already been shown
    router.push('/chat?escalated=true');
  };

  const handleReturnToTraditionalChat = () => {
    router.push('/chat');
  };

  return (
    <main className="bg-gray-50" style={{ minHeight: 'auto', height: 'auto' }}>
      <Header showAdminToggle={false} />
      
      <div className="automated-support-container">
        <AutomatedSupportFlow
          onEscalateToAgent={handleEscalateToAgent}
          onReturnToTraditionalChat={handleReturnToTraditionalChat}
        />
      </div>

      <style jsx global>{`
        body {
          overflow-y: auto !important;
          height: auto !important;
        }
      `}</style>
      
      <style jsx>{`
        .automated-support-container {
          /* Remove height constraints to allow natural scrolling */
        }
      `}</style>
    </main>
  );
}