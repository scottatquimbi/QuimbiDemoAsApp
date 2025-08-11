'use client';

import { useState } from 'react';

export default function DebugAutomatedPage() {
  const [clickCount, setClickCount] = useState(0);
  const [testData, setTestData] = useState<any>(null);

  const handleTestClick = () => {
    console.log('🔥 Test button clicked!', new Date().toISOString());
    setClickCount(prev => prev + 1);
  };

  const testAutomatedResolution = async () => {
    console.log('🧪 Testing automated resolution API...');
    try {
      const response = await fetch('/api/test-automated-resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      console.log('✅ API Response:', data);
      setTestData(data);
    } catch (error) {
      console.error('❌ API Error:', error);
      setTestData({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const testPlayerProfile = async () => {
    console.log('👤 Testing player profile API...');
    try {
      const response = await fetch('/api/players?playerId=lannister-gold');
      const data = await response.json();
      console.log('✅ Player Profile:', data);
      setTestData({ playerProfile: data });
    } catch (error) {
      console.error('❌ Player Profile Error:', error);
      setTestData({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>🔧 Automated Support Debug Page</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Click Test</h2>
        <button 
          onClick={handleTestClick}
          style={{ 
            padding: '1rem 2rem', 
            backgroundColor: '#3b82f6', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔥 Test Click (Clicked: {clickCount} times)
        </button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>API Tests</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button 
            onClick={testAutomatedResolution}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#16a34a', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🤖 Test Automated Resolution
          </button>
          
          <button 
            onClick={testPlayerProfile}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#f59e0b', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            👤 Test Player Profile
          </button>
        </div>
        
        {testData && (
          <div style={{ 
            backgroundColor: '#f3f4f6', 
            padding: '1rem', 
            borderRadius: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            maxHeight: '400px',
            overflow: 'auto'
          }}>
            {JSON.stringify(testData, null, 2)}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Navigation Tests</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a 
            href="/automated-support" 
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#6366f1', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '6px'
            }}
          >
            🚀 Go to Automated Support
          </a>
          
          <a 
            href="/demo" 
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#8b5cf6', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '6px'
            }}
          >
            🎮 Go to Demo Page
          </a>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#fef3c7', 
        padding: '1rem', 
        borderRadius: '8px',
        marginTop: '2rem'
      }}>
        <h3>🔍 What to Check:</h3>
        <ol>
          <li><strong>Click the test button above</strong> - Does the counter increase?</li>
          <li><strong>Open browser console (F12)</strong> - Do you see console logs?</li>
          <li><strong>Test the APIs</strong> - Do they return data?</li>
          <li><strong>Try navigation links</strong> - Do they load the pages?</li>
        </ol>
      </div>
    </div>
  );
}