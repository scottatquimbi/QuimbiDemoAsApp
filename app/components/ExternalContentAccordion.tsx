'use client';

import React, { useState } from 'react';
import { ExternalSources, KnownIssueContent, DiscordMessage, RedditComment } from '../types/externalSources';
import DiscordMessages from './DiscordMessages';
import RedditComments from './RedditComments';
import KnownIssueCard from './KnownIssueCard';
import { ReactNode } from 'react';

// Define a custom type for the transformed known issue content
interface TransformedKnownIssueContent {
  title: string;
  description: string;
  affectedVersions?: string;
  workaround?: string;
  fixVersion?: string;
}

// Define a new interface that matches the actual structure used
interface ExternalContentData {
  discordMessages?: DiscordMessage[];
  redditComments?: RedditComment[];
  knownIssue?: TransformedKnownIssueContent | KnownIssueContent | null;
}

interface ExternalContentAccordionProps {
  externalContent: ExternalContentData | null;
  isLoading?: boolean;
}

/**
 * Component for displaying external content in an expandable accordion with Discord/Reddit styling
 */
export default function ExternalContentAccordion({ 
  externalContent, 
  isLoading = false 
}: ExternalContentAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Check if we have any content to show
  const hasContent = externalContent && (
    (externalContent.discordMessages && externalContent.discordMessages.length > 0) || 
    (externalContent.redditComments && externalContent.redditComments.length > 0) ||
    externalContent.knownIssue
  );
  
  if (!hasContent && !isLoading) return null;

  return (
    <div className="external-content-accordion border rounded-md overflow-hidden mb-4 border-gray-300 text-sm">
      <div 
        className="accordion-header bg-gray-200 p-2 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <path fillRule="evenodd" clipRule="evenodd" d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM11 6C11 5.44772 10.5523 5 10 5C9.44772 5 9 5.44772 9 6V10C9 10.5523 9.44772 11 10 11C10.5523 11 11 10.5523 11 10V6ZM10 15C10.8284 15 11.5 14.3284 11.5 13.5C11.5 12.6716 10.8284 12 10 12C9.17157 12 8.5 12.6716 8.5 13.5C8.5 14.3284 9.17157 15 10 15Z" fill="#64748b"/>
          </svg>
          <h3 className="text-xs font-medium text-gray-700">Knowledge Base</h3>
        </div>
        <div className="expand-icon">
          {isExpanded ? (
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M14.7071 12.7071C14.3166 13.0976 13.6834 13.0976 13.2929 12.7071L10 9.41421L6.70711 12.7071C6.31658 13.0976 5.68342 13.0976 5.29289 12.7071C4.90237 12.3166 4.90237 11.6834 5.29289 11.2929L9.29289 7.29289C9.68342 6.90237 10.3166 6.90237 10.7071 7.29289L14.7071 11.2929C15.0976 11.6834 15.0976 12.3166 14.7071 12.7071Z" fill="#64748b"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M5.29289 7.29289C5.68342 6.90237 6.31658 6.90237 6.70711 7.29289L10 10.5858L13.2929 7.29289C13.6834 6.90237 14.3166 6.90237 14.7071 7.29289C15.0976 7.68342 15.0976 8.31658 14.7071 8.70711L10.7071 12.7071C10.3166 13.0976 9.68342 13.0976 9.29289 12.7071L5.29289 8.70711C4.90237 8.31658 4.90237 7.68342 5.29289 7.29289Z" fill="#64748b"/>
            </svg>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="accordion-content p-3 space-y-3 bg-gray-100">
          {isLoading ? (
            <div className="loading-state flex items-center justify-center py-4">
              <div className="spinner h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin"></div>
              <span className="ml-2 text-gray-600 text-xs">Loading knowledge base...</span>
            </div>
          ) : (
            <>
              {externalContent?.knownIssue && (
                <div className="known-issue-section">
                  <KnownIssueCard issue={
                    // Convert TransformedKnownIssueContent to KnownIssueContent if needed
                    'description' in externalContent.knownIssue 
                      ? {
                          title: externalContent.knownIssue.title,
                          content: externalContent.knownIssue.description
                        } 
                      : externalContent.knownIssue
                  } />
                </div>
              )}
              
              {externalContent?.discordMessages && externalContent.discordMessages.length > 0 && (
                <div className="discord-section">
                  <h4 className="text-xs font-medium text-gray-700 mb-1">Discord Discussions</h4>
                  <DiscordMessages messages={externalContent.discordMessages} />
                </div>
              )}
              
              {externalContent?.redditComments && externalContent.redditComments.length > 0 && (
                <div className="reddit-section">
                  <h4 className="text-xs font-medium text-gray-700 mb-1">Reddit Comments</h4>
                  <RedditComments comments={externalContent.redditComments} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
} 