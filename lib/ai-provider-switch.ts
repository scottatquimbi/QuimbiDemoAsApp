/**
 * AI Provider Switch - Ollama-only provider
 * 
 * This utility provides a unified interface for Ollama-based AI operations.
 * Gemini support has been removed to simplify the architecture.
 */

import { PlayerContext } from './models';

import { analyzePlayerMessage as analyzePlayerMessageOriginal } from './compensation';

// Ollama imports  
import { 
  analyzePlayerMessage as analyzePlayerMessageOllama,
  detectIssue as detectIssueOllama,
  analyzeSentiment as analyzeSentimentOllama
} from './compensation-local';
import { 
  generateChatText as generateChatTextOllama,
  generateAnalysisText as generateAnalysisTextOllama,
  checkOllamaHealth,
  OLLAMA_MODELS
} from './ollama';

/**
 * Configuration for AI provider
 */
export interface AIProviderConfig {
  ollamaHealthCheckTimeout: number;
}

/**
 * Get AI provider configuration from environment variables
 */
export function getAIProviderConfig(): AIProviderConfig {
  return {
    ollamaHealthCheckTimeout: parseInt(process.env.OLLAMA_HEALTH_TIMEOUT || '5000')
  };
}

/**
 * Ollama-based AI provider with health checking
 */
export class AIProvider {
  private config: AIProviderConfig;
  private ollamaHealthy: boolean | null = null;
  private lastHealthCheck: number = 0;
  private healthCheckInterval: number = 30000; // 30 seconds

  constructor(config?: Partial<AIProviderConfig>) {
    this.config = { ...getAIProviderConfig(), ...config };
  }

  /**
   * Check if Ollama is healthy (with caching)
   */
  private async checkOllamaHealthCached(): Promise<boolean> {
    const now = Date.now();
    
    // Use cached result if recent (but allow more frequent checks during startup)
    const cacheTimeout = this.ollamaHealthy === false ? 5000 : this.healthCheckInterval; // Shorter cache for failed checks
    if (this.ollamaHealthy !== null && (now - this.lastHealthCheck) < cacheTimeout) {
      return this.ollamaHealthy;
    }
    
    try {
      this.ollamaHealthy = await Promise.race([
        checkOllamaHealth(),
        new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), this.config.ollamaHealthCheckTimeout)
        )
      ]);
      this.lastHealthCheck = now;
      if (this.ollamaHealthy) {
        console.log('🔄 Ollama health check: ✅ Healthy');
      }
    } catch (error) {
      this.ollamaHealthy = false;
      this.lastHealthCheck = now;
      // Don't log health check failures as errors during startup
    }
    
    return this.ollamaHealthy;
  }

  /**
   * Check if Ollama is available and healthy
   */
  private async isOllamaAvailable(): Promise<boolean> {
    return await this.checkOllamaHealthCached();
  }

  /**
   * Analyze player message using Ollama
   */
  async analyzePlayerMessage(message: string, playerContext: PlayerContext) {
    const ollamaAvailable = await this.isOllamaAvailable();
    
    if (!ollamaAvailable) {
      throw new Error('Ollama is not available. Please ensure Ollama is running.');
    }
    
    try {
      console.log('🦙 Using Ollama for player message analysis');
      return await analyzePlayerMessageOllama(message, playerContext);
    } catch (error) {
      console.error('❌ Error with Ollama analysis:', error);
      throw error;
    }
  }

  /**
   * Detect issues using Ollama
   */
  async detectIssue(message: string) {
    const ollamaAvailable = await this.isOllamaAvailable();
    
    if (!ollamaAvailable) {
      throw new Error('Ollama is not available. Please ensure Ollama is running.');
    }
    
    try {
      console.log('🦙 Using Ollama for issue detection');
      return await detectIssueOllama(message);
    } catch (error) {
      console.error('❌ Error with Ollama issue detection:', error);
      throw error;
    }
  }

  /**
   * Analyze sentiment using Ollama
   */
  async analyzeSentiment(message: string) {
    const ollamaAvailable = await this.isOllamaAvailable();
    
    if (!ollamaAvailable) {
      throw new Error('Ollama is not available. Please ensure Ollama is running.');
    }
    
    try {
      console.log('🦙 Using Ollama for sentiment analysis');
      return await analyzeSentimentOllama(message);
    } catch (error) {
      console.error('❌ Error with Ollama sentiment analysis:', error);
      throw error;
    }
  }

  /**
   * Generate chat text using Ollama
   */
  async generateChatText(prompt: string, options: any = {}) {
    try {
      const ollamaAvailable = await this.isOllamaAvailable();
      
      if (!ollamaAvailable) {
        throw new Error('Ollama is not available - it may still be starting up. Please wait a moment and try again.');
      }
      
      console.log('🦙 Using Ollama for chat text generation');
      return await generateChatTextOllama(prompt, options);
    } catch (error) {
      console.log('🦙 Ollama chat generation failed (may be starting up):', error);
      throw error;
    }
  }

  /**
   * Get current provider status
   */
  async getProviderStatus() {
    const config = this.config;
    const ollamaHealthy = await this.checkOllamaHealthCached();
    
    return {
      config,
      ollamaHealthy,
      effectiveProvider: 'ollama',
      models: {
        ollama: OLLAMA_MODELS
      }
    };
  }
}

// Create default provider instance
export const defaultAIProvider = new AIProvider();

// Convenience functions that use the default provider
export const analyzePlayerMessage = (message: string, playerContext: PlayerContext) => 
  defaultAIProvider.analyzePlayerMessage(message, playerContext);

export const detectIssue = (message: string) => 
  defaultAIProvider.detectIssue(message);

export const analyzeSentiment = (message: string) => 
  defaultAIProvider.analyzeSentiment(message);

export const generateChatText = (prompt: string, options?: any) => 
  defaultAIProvider.generateChatText(prompt, options);

export const getProviderStatus = () => 
  defaultAIProvider.getProviderStatus();

/**
 * Utility function to create AI provider with custom timeout
 */
export function createAIProvider(ollamaHealthCheckTimeout = 5000): AIProvider {
  return new AIProvider({
    ollamaHealthCheckTimeout
  });
}