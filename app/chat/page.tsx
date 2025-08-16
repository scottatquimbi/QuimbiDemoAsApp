'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatWithContext from '@/app/components/ChatWithContext';
import ChatWithContextProduction from '@/app/components/ChatWithContextProduction';
import DemoRouter from '@/app/components/DemoRouter';
import Header from '@/app/components/Header';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';

export default function ChatPage() {
  const router = useRouter();
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
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const isEscalated = urlParams.get('escalated') === 'true';
        const escalationReason = urlParams.get('escalationReason') || '';
        const problemDescription = urlParams.get('problemDescription') || '';
        const problemCategory = urlParams.get('problemCategory') || 'issue';

        if (isEscalated) {
          if (problemDescription.trim()) {
            setInitialMessage(problemDescription);
          } else {
            setInitialMessage(`I need help with a ${problemCategory} issue. This was escalated from automated support because it requires human assistance.`);
          }
          setFreeformContext(escalationReason);
        }

        const scenarioData = localStorage.getItem('demoScenario');
        if (scenarioData) {
          const scenarioParsed = JSON.parse(scenarioData);
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
          
          setPlayerLevel(level || 1);
          setVipLevel(vip || 0);
          setPlayerName(name || '');
          setTotalSpend(spend !== undefined ? spend : (spender ? 50 : 0));
          
          if (!isEscalated) {
            const demoInitial = preloadedIssue || (preloadedMessages ? preloadedMessages[0] : undefined);
            setInitialMessage(demoInitial);
            setFreeformContext(systemContext);
          }
          
          const newKey = `${name || 'default'}-${level}-${Date.now()}`;
          setScenarioKey(newKey);
        } else if (!isEscalated) {
          router.push('/demo');
        }
      } catch (err) {
        console.error('Error loading demo scenario data:', err);
      }
      
      setIsLoading(false);
    }
  }, []);

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