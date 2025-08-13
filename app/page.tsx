"use client";
import Link from 'next/link';
import Header from './components/Header';
import { useState } from 'react';

export default function Home() {
  const [showAdminToggle] = useState(true);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>
      <main className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50 text-slate-800">
        <Header showAdminToggle={showAdminToggle} />
        
        <div className="flex-grow flex flex-col items-center justify-center px-6">
          <div className="text-center space-y-12 max-w-2xl">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl font-bold text-slate-800 tracking-tight leading-tight">
                Game of Thrones
                <span className="block bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  AI Support
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 leading-relaxed font-medium">
                Experience intelligent customer support powered by local AI. 
                <span className="block mt-2">Context-aware responses with smart compensation detection.</span>
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link 
                href="/demo"
                className="group relative inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 text-lg min-w-[160px]"
              >
                <span className="relative z-10">Try Demo</span>
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              
              <Link 
                href="/chat"
                className="group inline-flex items-center justify-center px-8 py-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-300 hover:border-indigo-300 hover:bg-white hover:shadow-md text-lg min-w-[160px]"
              >
                Live Chat
                <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </Link>
            </div>
            
            <div className="pt-8">
              <div className="flex items-center justify-center space-x-8 text-sm text-slate-500">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Ollama Local AI</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Smart Compensation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Context Aware</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
