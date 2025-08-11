/**
 * Models for the Game Support RAG system
 */

/**
 * Represents a resource retrieved from the game knowledge base
 */
export interface GameResource {
  id: string | number;
  content: string;
  metadata?: {
    source?: string;
    chunk_index?: number;
    chunk_id?: string;
    title?: string;
    game_id?: string;
    category?: string;
    url?: string;
    [key: string]: any;
  };
  title?: string;
  game_id?: string;
  category?: string;
  url?: string;
  embedding?: number[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Player context passed to the chat API
 */
export interface PlayerContext {
  gameLevel: number;
  playerName?: string;
  vipLevel?: number;
  isSpender?: boolean;
  totalSpend?: number;
  alliance?: string;
  lastActive?: string;
  lastPurchase?: {
    amount: number;
    date: string;
    item: string;
  };
  recentIssues?: Array<{
    date: string;
    issue: string;
    resolution: string;
  }>;
  freeformContext?: string; // Additional context about the player in free text form
}

/**
 * Compensation tiers for player issues
 */
export enum CompensationTier {
  P0 = 'P0', // Critical - Complete loss of account/progress or major financial issues
  P1 = 'P1', // Severe - Significant progress loss or payment issues
  P2 = 'P2', // Moderate - Temporary gameplay disruption or minor progress loss
  P3 = 'P3', // Minor - Brief inconvenience with minimal impact
  P4 = 'P4', // Minimal - Informational query, no impact
  P5 = 'P5'  // User error - Education needed, no compensation
}

/**
 * Recommended compensation based on issue severity
 */
export interface CompensationRecommendation {
  tier: CompensationTier;
  description: string;
  resources?: {
    gold?: number;
    resources?: string;
    items?: string[];
  };
  vipPoints?: number;
  additionalNotes?: string;
}

/**
 * Supported game progression stages
 */
export enum GameStage {
  NewRecruit = 'New Recruit',     // Levels 1-5
  BuddingLord = 'Budding Lord',   // Levels 6-10
  StrategicRuler = 'Strategic Ruler', // Levels 11-15
  KingdomRises = 'Kingdom Rises',  // Levels 16-20
  HighCouncil = 'High Council',   // Levels 21-25
  WardenRealm = 'Warden of the Realm', // Levels 26-30
  IronThrone = 'Iron Throne'      // Top VIP
}

/**
 * Determines the game stage based on player level
 * @param level Player's current game level
 * @returns The corresponding game stage
 */
export function getGameStage(level: number): GameStage {
  if (level <= 5) return GameStage.NewRecruit;
  if (level <= 10) return GameStage.BuddingLord;
  if (level <= 15) return GameStage.StrategicRuler;
  if (level <= 20) return GameStage.KingdomRises;
  if (level <= 25) return GameStage.HighCouncil;
  if (level <= 30) return GameStage.WardenRealm;
  return GameStage.IronThrone;
}

/**
 * Types of player support questions
 */
export enum SupportType {
  Gameplay = 'gameplay',
  Technical = 'technical',
  Account = 'account'
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Game {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
} 