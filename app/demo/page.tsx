'use client';

import DemoScenarios from '@/app/components/DemoScenarios';
import Header from '@/app/components/Header';
import { useState, useEffect } from 'react';

export default function DemoPage() {
  const [showAdminToggle] = useState(true);

  // Clear any persisted demo state when returning to demo selection and warmup llama3.1
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🔄 Demo selection page loaded - clearing any persisted state');
      localStorage.removeItem('demoScenario'); // Clear old scenario data
      
      // Warmup llama3.1 model for faster first use
      console.log('🦙 Warming up llama3.1 model...');
      fetch('/api/chat-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: 'warmup' }] 
        })
      }).then(response => {
        if (response.ok) {
          console.log('🦙 llama3.1 model warmed up successfully');
        } else {
          console.log('🦙 Model warmup failed, but continuing...');
        }
      }).catch(error => {
        console.log('🦙 Model warmup error (non-critical):', error);
      });
    }
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header showAdminToggle={showAdminToggle} />
      <div className="flex-1">
        <DemoScenarios />
      </div>
    </main>
  );
} 