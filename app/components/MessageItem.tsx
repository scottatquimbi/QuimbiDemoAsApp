'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageWithMetadata } from '../types/chat';

interface MessageItemProps {
  message: MessageWithMetadata;
  isLast?: boolean;
}

/**
 * Component for rendering an individual chat message
 */
export default function MessageItem({ message, isLast = false }: MessageItemProps) {
  // Determine if message is from the agent or the player
  const isAgent = message.role === 'assistant';
  const isPlayer = message.role === 'user';
  
  return (
    <div className={`flex items-start mb-4 ${isAgent ? 'justify-end' : 'justify-start'}`}>
      {/* Player Avatar - Only show for player messages */}
      {isPlayer && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      
      {/* Message Content */}
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
          isAgent
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-tr-none'
            : 'bg-gray-100 text-gray-800 border border-gray-200 rounded-tl-none'
        }`}
      >
        <ReactMarkdown 
          className={`prose prose-sm max-w-none ${
            isAgent ? 'prose-invert' : 'prose-gray'
          }`}
        >
          {message.content}
        </ReactMarkdown>
      </div>
      
      {/* Agent Avatar - Only show for agent messages */}
      {isAgent && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ml-2 border border-blue-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
          </svg>
        </div>
      )}
    </div>
  );
} 