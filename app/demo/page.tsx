'use client';

import DemoScenarios from '@/app/components/DemoScenarios';
import Header from '@/app/components/Header';
import { useState, useEffect } from 'react';
import { initializeServices } from '@/lib/service-manager';

export default function DemoPage() {
  const [showAdminToggle] = useState(true);

  // Initialize Ollama service and model persistence on demo page load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demoScenario'); // Clear old scenario data
      
      // Initialize services in background
      const startServices = async () => {
        try {
          await initializeServices();
        } catch (error) {
          console.log('🦙 Service initialization error (non-critical):', error);
        }
      };
      
      // Initialize services with slight delay to allow app to fully load
      setTimeout(startServices, 1500);
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