'use client';

import React, { useState } from 'react';
import { PlayerContext } from '../types/player';
import PlayerContextForm from './PlayerContextForm';
import { DiscordMessage, RedditComment, KnownIssueContent } from '../types/externalSources';
import KnownIssueCard from './KnownIssueCard';
import DiscordMessages from './DiscordMessages';
import RedditComments from './RedditComments';
import { ReactNode } from 'react';

interface ExternalContentData {
  discordMessages?: DiscordMessage[];
  redditComments?: RedditComment[];
  knownIssue?: KnownIssueContent | null;
}

interface PlayerContextSidebarProps {
  playerContext: PlayerContext;
  onUpdatePlayerName: (name: string) => void;
  onUpdatePreferredName?: (name: string) => void;
  onUpdateSessionDays?: (days: number) => void;
  onUpdateGameLevel: (level: number) => void;
  onUpdateVipLevel: (level: number) => void;
  onUpdateTotalSpend: (amount: number) => void;
  onUpdateFreeformContext: (context: string) => void;
  onUpdateLikelinessToChurn: (rate: number) => void;
  externalContent?: ExternalContentData | null;
  isLoadingExternalContent?: boolean;
  onRefreshDemo?: () => void;
}

/**
 * Component for displaying player context information and edit form
 */
export default function PlayerContextSidebar({
  playerContext,
  onUpdatePlayerName,
  onUpdatePreferredName,
  onUpdateSessionDays,
  onUpdateGameLevel,
  onUpdateVipLevel,
  onUpdateTotalSpend,
  onUpdateFreeformContext,
  onUpdateLikelinessToChurn,
  externalContent,
  isLoadingExternalContent = false,
  onRefreshDemo
}: PlayerContextSidebarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showExternalContent, setShowExternalContent] = useState(true);
  // Track expanded state for each section
  const [expandedSections, setExpandedSections] = useState({
    knowledgeBase: true,
    discord: true,
    reddit: true
  });
  
  const isSpender = playerContext.totalSpend && playerContext.totalSpend > 0;
  
  // Use the churn percentage from context instead of generating a random one
  const churnPercentage = playerContext.likelinessToChurn || 15;
  
  // Determine compensation rationale based on churn risk with updated thresholds
  const getCompensationRationale = () => {
    if (churnPercentage <= 10) {
      return "Low churn risk, standard compensation sufficient";
    } else if (churnPercentage <= 25) {
      return "Moderate churn risk, consider small bonus";
    } else {
      return "Higher churn risk, additional compensation recommended";
    }
  };
  
  // Check if we have any external content to show
  const hasExternalContent = externalContent && (
    (externalContent.discordMessages && externalContent.discordMessages.length > 0) || 
    (externalContent.redditComments && externalContent.redditComments.length > 0) ||
    externalContent.knownIssue
  );
  
  // Toggle section expanded state
  const toggleSection = (section: 'knowledgeBase' | 'discord' | 'reddit') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Chevron icon component that rotates based on expanded state
  const ChevronIcon = ({ expanded }: { expanded: boolean }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={`transition-transform duration-200 text-gray-500 ${expanded ? 'transform rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );
  
  return (
    <div className="w-96 h-full flex flex-col border-r border-gray-200 bg-white overflow-auto">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold text-gray-800">Player Context</h2>
          {/* Refresh Demo Button */}
          {onRefreshDemo && (
            <button
              type="button"
              onClick={onRefreshDemo}
              className="inline-flex items-center px-2 py-1 border border-green-300 shadow-sm text-xs leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              title="Refresh demo to start over"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Demo
            </button>
          )}
        </div>
        
        {/* Next Player Button */}
        <div className="flex space-x-2">
          <button
            type="button"
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Grab next ticket from queue"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
            Next Player
          </button>
          <button 
            type="button" 
            className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => setIsEditing(!isEditing)} 
            title={isEditing ? 'View player context' : 'Edit player context'}
          >
            {isEditing ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Support Agent Tools Section */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Support Agent Tools</h3>
        <div className="grid grid-cols-2 gap-2">
          {/* Ask AI Button */}
          <button
            type="button"
            className="flex flex-col items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Ask AI for clarification or research on player data and known game issues"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Ask AI</span>
          </button>

          {/* Ask Buddy Button */}
          <button
            type="button"
            className="flex flex-col items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="Ask a colleague for help via IM"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <span>Ask Buddy</span>
          </button>

          {/* Player History Button */}
          <button
            type="button"
            className="flex flex-col items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            title="View previous support tickets and player interactions"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Player History</span>
          </button>

          {/* Report Issue Button */}
          <button
            type="button"
            className="flex flex-col items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            title="Report incorrect AI response"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Report Issue</span>
          </button>
        </div>
      </div>

      {isEditing ? (
        <PlayerContextForm
          playerContext={playerContext}
          onUpdatePlayerName={onUpdatePlayerName}
          onUpdatePreferredName={onUpdatePreferredName}
          onUpdateSessionDays={onUpdateSessionDays}
          onUpdateGameLevel={onUpdateGameLevel}
          onUpdateVipLevel={onUpdateVipLevel}
          onUpdateTotalSpend={onUpdateTotalSpend}
          onUpdateFreeformContext={onUpdateFreeformContext}
          onUpdateLikelinessToChurn={onUpdateLikelinessToChurn}
        />
      ) : (
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">Profile Name</p>
            <p className="mt-1 text-sm text-gray-900">{playerContext.playerName || 'Anonymous'}</p>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">Likeliness To Churn</p>
            <div className="mt-1 flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    churnPercentage <= 10 ? 'bg-green-500' : 
                    churnPercentage <= 25 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} 
                  style={{ width: `${churnPercentage}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm text-gray-900">{churnPercentage}%</span>
            </div>
            <p className="mt-1 text-xs text-gray-500 italic">{getCompensationRationale()}</p>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">Preferred Name</p>
            <p className="mt-1 text-sm text-gray-900">{playerContext.preferredName || 'N/A'}</p>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">Session Days</p>
            <p className="mt-1 text-sm text-gray-900">{playerContext.sessionDays || 0} days</p>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="flex justify-between">
              <div className="w-1/2">
                <p className="text-sm font-medium text-gray-700">Game Level</p>
                <p className="mt-1 text-sm text-gray-900">{playerContext.gameLevel}</p>
              </div>
              <div className="w-1/2">
                <p className="text-sm font-medium text-gray-700">VIP Status</p>
                <p className="mt-1 text-sm text-gray-900">
                  {playerContext.vipLevel && playerContext.vipLevel > 0
                    ? `VIP Level ${playerContext.vipLevel}`
                    : 'Non-VIP'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium text-gray-700">Player Type</p>
            <p className="mt-1 text-sm text-gray-900">
              {isSpender ? `Paying Player ($${playerContext.totalSpend})` : 'Non-Paying Player'}
            </p>
          </div>
          
          {playerContext.freeformContext && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm font-medium text-gray-700">Additional Context</p>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                {playerContext.freeformContext}
              </p>
            </div>
          )}
          
          {/* External Content Section */}
          {hasExternalContent && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-indigo-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <h3 className="text-md font-medium text-gray-900">External Sources</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExternalContent(!showExternalContent)}
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-900 transition-colors"
                >
                  {showExternalContent ? (
                    <>
                      <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                      Hide
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                      Show
                    </>
                  )}
                </button>
              </div>
              
              {showExternalContent && (
                <div className="space-y-3">
                  {/* Knowledge Base Article */}
                  {externalContent?.knownIssue && (
                    <div className="border border-yellow-200 bg-yellow-50 rounded-md overflow-hidden shadow-sm">
                      <div 
                        className="flex items-center justify-between bg-yellow-100 px-3 py-2 cursor-pointer hover:bg-yellow-200 transition-colors"
                        onClick={() => toggleSection('knowledgeBase')}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-yellow-700 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                          </svg>
                          <p className="text-sm font-medium text-yellow-800">Knowledge Base</p>
                        </div>
                        <ChevronIcon expanded={expandedSections.knowledgeBase} />
                      </div>
                      {expandedSections.knowledgeBase && (
                        <div className="p-3">
                          <KnownIssueCard issue={externalContent.knownIssue} />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Discord Messages */}
                  {externalContent?.discordMessages && externalContent.discordMessages.length > 0 && (
                    <div className="border border-gray-200 bg-white rounded-md overflow-hidden shadow-sm">
                      <div 
                        className="flex items-center justify-between bg-gray-100 px-3 py-1.5 cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => toggleSection('discord')}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                          </svg>
                          <p className="text-sm font-medium text-gray-800">Discord Discussions</p>
                        </div>
                        <ChevronIcon expanded={expandedSections.discord} />
                      </div>
                      {expandedSections.discord && (
                        <div className="p-2">
                          <DiscordMessages messages={externalContent.discordMessages} />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Reddit Comments */}
                  {externalContent?.redditComments && externalContent.redditComments.length > 0 && (
                    <div className="border border-gray-200 bg-gray-50 rounded-md overflow-hidden shadow-sm">
                      <div 
                        className="flex items-center justify-between bg-gray-100 px-3 py-2 cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => toggleSection('reddit')}
                      >
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-600 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 8c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5z"></path>
                            <path d="M12 23c6.08 0 11-4.92 11-11s-4.92-11-11-11S1 5.92 1 12s4.92 11 11 11z"></path>
                          </svg>
                          <p className="text-sm font-medium text-gray-800">Reddit Comments</p>
                        </div>
                        <ChevronIcon expanded={expandedSections.reddit} />
                      </div>
                      {expandedSections.reddit && (
                        <div className="p-3">
                          <RedditComments comments={externalContent.redditComments} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {isLoadingExternalContent && (
                <div className="flex items-center justify-center py-4 bg-gray-50 rounded-md border border-gray-200 mt-2">
                  <div className="spinner h-4 w-4 rounded-full border-2 border-gray-300 border-t-indigo-600 animate-spin"></div>
                  <span className="ml-2 text-sm text-gray-600">Loading external content...</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 