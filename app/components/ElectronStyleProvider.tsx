'use client';

import { useEffect } from 'react';

// Type declaration for Electron API
declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      platform: string;
      getAppVersion: () => Promise<string>;
      showMessageBox: (options: any) => Promise<any>;
      showOpenDialog: (options: any) => Promise<any>;
      showSaveDialog: (options: any) => Promise<any>;
      onNavigateTo: (callback: any) => void;
      onNewChat: (callback: any) => void;
      onCheckOllamaStatus: (callback: any) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

export default function ElectronStyleProvider() {
  useEffect(() => {
    // Only add the class after hydration on the client side
    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
      document.body.classList.add('electron-app');
    }
  }, []);

  return null; // This component doesn't render anything
}