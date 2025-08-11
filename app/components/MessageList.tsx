'use client';

import React, { useRef, useEffect } from 'react';
import { MessageWithMetadata } from '../types/chat';
import MessageItem from './MessageItem';
import LoadingIndicator from './LoadingIndicator';

interface MessageListProps {
  messages: MessageWithMetadata[];
  isResponseStreaming: boolean;
}

/**
 * Component for rendering a list of chat messages
 */
export default function MessageList({ messages, isResponseStreaming }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
      <div className="flex-1 overflow-y-auto p-6 space-y-6 font-inter">
        {messages.map((message, i) => (
          <MessageItem 
            key={i} 
            message={message} 
            isLast={i === messages.length - 1} 
          />
        ))}
        
        <div ref={messagesEndRef} />
      </div>
  );
} 