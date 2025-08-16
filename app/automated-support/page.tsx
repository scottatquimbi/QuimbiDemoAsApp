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
    console.log('🚀 handleEscalateToAgent called with:', { reason, formData: !!formData, playerProfile: !!playerProfile });
    
    const problemDescription = formData?.problemDescription || 'No specific problem description provided';
    const problemCategory = formData?.problemCategory || 'issue';

    // Enhanced debugging for escalation data
    console.log('🔍 DEBUGGING: Analyzing formData structure...');
    console.log('🔍 FormData keys:', formData ? Object.keys(formData) : 'no formData');
    console.log('🔍 FormData escalationAnalysis:', (formData as any)?.escalationAnalysis);
    console.log('🔍 FormData automatedResolution:', (formData as any)?.automatedResolution);
    console.log('🔍 FormData humanDeliveryRequired:', (formData as any)?.humanDeliveryRequired);

    // Store escalation analysis data for chat handler - Enhanced logic
    if (formData && ((formData as any).escalationAnalysis || (formData as any).automatedResolution)) {
      console.log('📋 Storing escalation analysis data for chat handler');
      
      // Build escalation data with all available information
      const escalationData = {
        // Include escalation analysis if present
        ...(formData as any).escalationAnalysis,
        // Add automated resolution
        automatedResolution: (formData as any).automatedResolution,
        // Add original problem data
        problemDescription: problemDescription,
        escalationReason: reason,
        playerProfile: playerProfile,
        // Add any other escalation flags
        humanDeliveryRequired: (formData as any).humanDeliveryRequired,
        sentimentReason: (formData as any).sentimentReason
      };
      
      console.log('📋 Enhanced escalation data to store:', escalationData);
      localStorage.setItem('escalatedAnalysisData', JSON.stringify(escalationData));
      console.log('📋 Data stored in localStorage successfully');
      
      // Verify storage
      const storedData = localStorage.getItem('escalatedAnalysisData');
      console.log('📋 Verification - stored data exists:', !!storedData);
      if (storedData) {
        console.log('📋 Verification - stored data preview:', storedData.substring(0, 200) + '...');
      }
    } else {
      console.log('⚠️ No escalation analysis OR automated resolution data found in formData');
      console.log('⚠️ FormData structure:', formData);
    }

    const queryParams = new URLSearchParams({
      escalated: 'true',
      escalationReason: reason,
      problemDescription: problemDescription,
      problemCategory: problemCategory,
    });

    router.push(`/chat?${queryParams.toString()}`);
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
