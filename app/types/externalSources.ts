import { ReactNode } from 'react';

/**
 * Discord message structure
 */
export interface DiscordMessage {
  user: string;
  message: string;
}

/**
 * Discord thread structure
 */
export interface DiscordThread {
  threadName: string;
  userCount: number;
  messages: DiscordMessage[];
}

/**
 * Reddit comment structure
 */
export interface RedditComment {
  user: string;
  comment: string;
}

/**
 * Reddit post structure
 */
export interface RedditPost {
  subreddit: string;
  title: string;
  body: string;
  upvotes: number;
  comments: RedditComment[];
}

/**
 * Comprehensive external sources data structure
 */
export interface ExternalSources {
  articleTitle?: string;
  articleContent?: ReactNode;
  discord?: DiscordThread;
  reddit?: RedditPost;
}

/**
 * Known issue article content
 */
export interface KnownIssueContent {
  title: string;
  content: ReactNode;
  affectedVersions?: string;
  workaround?: string;
  fixVersion?: string;
} 