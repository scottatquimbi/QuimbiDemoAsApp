import { Message } from 'ai';
import { ReactNode } from 'react';

/**
 * Extends the Message type from the AI SDK with metadata capabilities
 */
export interface MessageWithMetadata extends Message {
  metadata?: {
    compensation?: any;
    sources?: any[];
  };
}

/**
 * External sources data for chat context
 */
export interface DiscordMessage {
  user: string;
  message: string;
}

export interface DiscordThread {
  threadName: string;
  userCount: number;
  messages: DiscordMessage[];
}

export interface RedditComment {
  user: string;
  comment: string;
}

export interface RedditPost {
  subreddit: string;
  title: string;
  body: string;
  upvotes: number;
  comments: RedditComment[];
}

export interface ExternalSource {
  discord?: DiscordThread;
  reddit?: RedditPost;
  articleTitle?: string;
  articleContent?: ReactNode;
}

/**
 * Available scenario types for the chat
 */
export type ScenarioType = 'guild_shop' | 'tutorial_crash' | 'alliance_event' | 'account_access' | 'new-player' | 'mid-tier' | 'high-spender';

/**
 * Chat-specific props and interfaces
 */
export interface ChatProps {
  gameId?: string;
  playerContext: PlayerContext;
}

/**
 * Simplified player context for chat component
 */
export interface PlayerContext {
  gameLevel: number;
  playerName: string;
  vipLevel: number;
  totalSpend: number;
  freeformContext?: string;
  playerId?: string;
} 