'use client';

import { useEffect, useState } from 'react';
import ChatWithContext from '@/app/components/ChatWithContext';
import ChatWithContextProduction from '@/app/components/ChatWithContextProduction';
import DemoRouter from '@/app/components/DemoRouter';
import Header from '@/app/components/Header';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

export default function ChatPage() {
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerName, setPlayerName] = useState('');
  const [vipLevel, setVipLevel] = useState(0);
  const [totalSpend, setTotalSpend] = useState(0);
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
  const [freeformContext, setFreeformContext] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdminToggle, setShowAdminToggle] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [scenarioKey, setScenarioKey] = useState<string>('');

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  useEffect(() => {
    console.log('🔄 Chat page useEffect triggered');
    
    // Check if we're in a browser environment before accessing localStorage
    if (typeof window !== 'undefined') {
      try {
        // Check for escalated cases from automated support
        const urlParams = new URLSearchParams(window.location.search);
        const isEscalated = urlParams.get('escalated') === 'true';
        console.log('🔄 isEscalated:', isEscalated);
        
        let escalatedCaseData = null;
        if (isEscalated) {
          const escalatedCaseDataStr = localStorage.getItem('escalatedCase');
          console.log('🔄 Escalated case localStorage data:', escalatedCaseDataStr);
          
          if (escalatedCaseDataStr) {
            escalatedCaseData = JSON.parse(escalatedCaseDataStr);
            console.log('🔄 Loading escalated case:', escalatedCaseData);
            
            // Use the user's actual problem description as the initial message
            const problemDescription = escalatedCaseData.formData?.problemDescription || '';
            console.log('🔄 Extracted problem description:', problemDescription);
            
            // Use the user's actual typed description as the first message
            if (problemDescription.trim()) {
              console.log('🔄 Setting initialMessage to problem description');
              setInitialMessage(problemDescription);
            } else {
              const problemCategory = escalatedCaseData.formData?.problemCategory || 'issue';
              const fallbackMessage = `I need help with a ${problemCategory} issue. This was escalated from automated support because it requires human assistance.`;
              console.log('🔄 Setting initialMessage to fallback:', fallbackMessage);
              setInitialMessage(fallbackMessage);
            }
            
            // Clear the escalated case data
            localStorage.removeItem('escalatedCase');
          } else {
            console.log('🔄 No escalated case data found in localStorage');
          }
        } else {
          console.log('🔄 Not an escalated case (escalated param not true)');
        }
        
        const scenarioData = localStorage.getItem('demoScenario');
        console.log('🔄 Demo scenario localStorage data:', scenarioData);
        
        if (scenarioData) {
          const scenarioParsed = JSON.parse(scenarioData);
          console.log('🔄 Demo scenario full parsed object:', scenarioParsed);
          
          const { 
            playerLevel: level, 
            playerVip: vip, 
            playerName: name, 
            isSpender: spender,
            totalSpend: spend,
            preloadedIssue,
            preloadedMessages,
            freeformContext: systemContext
          } = scenarioParsed;
          
          console.log('🔄 Demo scenario extracted values:', {
            level, vip, name, spender, spend, preloadedIssue, preloadedMessages, systemContext
          });
          
          setPlayerLevel(level || 1);
          setVipLevel(vip || 0);
          setPlayerName(name || '');
          setTotalSpend(spend !== undefined ? spend : (spender ? 50 : 0));
          
          // For escalated cases, preserve the initial message from escalated case data
          if (!escalatedCaseData) {
            console.log('🔄 No escalated case data, using demo scenario initial message');
            const demoInitial = preloadedIssue || (preloadedMessages ? preloadedMessages[0] : undefined);
            console.log('🔄 Demo initial message would be:', demoInitial);
            setInitialMessage(demoInitial);
          } else {
            console.log('🔄 Escalated case exists, preserving escalated initial message');
          }
          
          // Use freeform context from demo scenario (which includes problem description for escalated cases)
          console.log('🔄 Setting freeform context from demo scenario:', systemContext);
          setFreeformContext(systemContext);
          
          // Create a unique key to force component remounting when scenario changes
          const newKey = `${name || 'default'}-${level}-${Date.now()}`;
          setScenarioKey(newKey);
          console.log('🔄 New demo scenario loaded, forcing component remount with key:', newKey);
        } else {
          console.log('🔄 No demo scenario data found');
        }
      } catch (err) {
        console.error('🔄 Error loading demo scenario data:', err);
      }
      
      console.log('🔄 Setting isLoading to false');
      setIsLoading(false);
    }
  }, []);
  
  // Redirect to demo page if accessed directly without scenario data
  useEffect(() => {
    if (!isLoading && typeof window !== 'undefined' && !localStorage.getItem('demoScenario')) {
      window.location.href = '/demo';
    }
  }, [isLoading]);

  // Debug logging before render
  console.log('🔄 Chat page rendering with state:', {
    playerLevel,
    playerName,
    vipLevel,
    totalSpend,
    initialMessage,
    freeformContext,
    scenarioKey,
    isLoading
  });
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }
  
  return (
    <main className="flex flex-col h-screen bg-white overflow-hidden">
      <Header 
        showAdminToggle={showAdminToggle} 
        showSidebarToggle={true}
        sidebarVisible={showSidebar}
        onToggleSidebar={toggleSidebar}
      />
      
      <div className="flex-grow overflow-hidden h-[calc(100vh-4rem)]">
        <DemoRouter
          key={scenarioKey} // Force remount when scenario changes
          demoComponent={ChatWithContext}
          productionComponent={ChatWithContextProduction}
          componentProps={{
            initialGameLevel: playerLevel,
            initialPlayerName: playerName,
            initialVipLevel: vipLevel,
            initialTotalSpend: totalSpend,
            showDebugPanel: false,
            showSidebar: showSidebar,
            onToggleSidebar: toggleSidebar,
            forceLiveChat: true,
            initialFreeformContext: freeformContext,
            demoInitialMessage: initialMessage
          }}
        />
      </div>
    </main>
  );
} 