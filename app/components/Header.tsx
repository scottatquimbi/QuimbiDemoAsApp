'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  showAdminToggle?: boolean;
  showSidebarToggle?: boolean;
  sidebarVisible?: boolean;
  onToggleSidebar?: () => void;
}

export default function Header({ 
  showAdminToggle = true,
  showSidebarToggle = false,
  sidebarVisible = false,
  onToggleSidebar = () => {}
}: HeaderProps) {
  const pathname = usePathname();
  const isAdminPage = pathname === '/admin';
  const isHomePage = pathname === '/';
  const isChatPage = pathname === '/chat';
  const isDemoPage = pathname === '/demo';
  
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `}</style>
      <header className="border-b border-gray-100 p-4 bg-white/80 backdrop-blur-sm sticky top-0 z-50" style={{fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'}}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            {showSidebarToggle && (
              <button 
                onClick={onToggleSidebar} 
                className="p-2 rounded-lg hover:bg-gray-50 transition-all duration-200 text-slate-600 hover:text-slate-800"
                aria-label={sidebarVisible ? "Hide player context" : "Show player context"}
              >
                {sidebarVisible ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </button>
            )}
            
            <Link href="/" className="flex items-center group">
              <Image 
                src="/Logo-blue.svg" 
                alt="Game of Thrones Support Logo" 
                width={120} 
                height={120}
                className="transition-transform duration-200 group-hover:scale-105"
              />
            
              {/* Only show titles on non-home pages */}
              {!isHomePage && (
                <h1 className="text-xl font-semibold ml-6 text-slate-800 tracking-tight">
                  {isAdminPage ? 'Admin Dashboard' : 
                   isDemoPage ? 'Demo Scenarios' : 
                   isChatPage ? 'Game Support' :
                   'Game of Thrones Support'}
                </h1>
              )}
            </Link>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Home button on all pages except home */}
            {!isHomePage && (
              <Link 
                href="/" 
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                Home
              </Link>
            )}
            
            {/* Admin page shows Back to Chat button */}
            {isAdminPage && (
              <Link 
                href="/chat" 
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                Back to Chat
              </Link>
            )}
            
            {/* Chat page shows Back to Scenarios button and possibly Admin button */}
            {isChatPage && (
              <>
                <Link 
                  href="/demo" 
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                >
                  Back to Scenarios
                </Link>
                {showAdminToggle && (
                  <Link 
                    href="/admin" 
                    className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-all duration-200 font-medium"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
            
            {/* Demo page and any other page may show Admin button */}
            {!isHomePage && !isAdminPage && !isChatPage && showAdminToggle && (
              <Link 
                href="/admin" 
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-all duration-200 font-medium"
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
} 