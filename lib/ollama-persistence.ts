import { ollamaClient, OLLAMA_MODELS } from './ollama';

/**
 * Model persistence manager to keep llama3.1 loaded
 */
class ModelPersistenceManager {
  private keepAliveInterval: NodeJS.Timeout | null = null;
  private isModelLoaded = false;
  private readonly KEEP_ALIVE_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MODEL_NAME = OLLAMA_MODELS.LLAMA_CHAT;

  /**
   * Start keeping the model alive with periodic pings
   */
  startKeepAlive() {
    if (this.keepAliveInterval) {
      console.log('🦙 Model keep-alive already running');
      return;
    }

    console.log(`🦙 Starting keep-alive for ${this.MODEL_NAME}`);
    this.keepAliveInterval = setInterval(async () => {
      try {
        await this.pingModel();
      } catch (error) {
        console.log('🦙 Keep-alive ping failed:', error);
      }
    }, this.KEEP_ALIVE_INTERVAL);

    this.isModelLoaded = true;
  }

  /**
   * Stop the keep-alive mechanism
   */
  stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
      this.isModelLoaded = false;
      console.log('🦙 Model keep-alive stopped');
    }
  }

  /**
   * Send a minimal request to keep the model loaded
   */
  private async pingModel() {
    try {
      await ollamaClient.generateText(this.MODEL_NAME, 'ping', {
        maxTokens: 1,
        temperature: 0.1
      });
      console.log('🦙 Model keep-alive ping successful');
    } catch (error) {
      console.error('🦙 Model keep-alive ping failed:', error);
      throw error;
    }
  }

  /**
   * Check if model persistence is active
   */
  isActive(): boolean {
    return this.isModelLoaded && this.keepAliveInterval !== null;
  }

  /**
   * Ensure model is loaded and start persistence
   */
  async ensureModelLoaded() {
    if (!this.isActive()) {
      console.log('🦙 Ensuring model is loaded and starting persistence...');
      
      // First make sure the model is loaded with a test request
      try {
        await ollamaClient.generateText(this.MODEL_NAME, 'ready', {
          maxTokens: 5,
          temperature: 0.1
        });
        console.log('🦙 Model loaded successfully');
        
        // Start keep-alive to maintain the loaded state
        this.startKeepAlive();
      } catch (error) {
        console.error('🦙 Failed to load model:', error);
        throw error;
      }
    }
  }
}

// Create singleton instance
export const modelPersistence = new ModelPersistenceManager();

/**
 * Initialize model persistence after first automated support use
 */
export async function initializeModelPersistence() {
  try {
    await modelPersistence.ensureModelLoaded();
    console.log('🦙 Model persistence initialized');
  } catch (error) {
    console.error('🦙 Failed to initialize model persistence:', error);
    throw error;
  }
}

/**
 * Check if model persistence is running
 */
export function isModelPersistenceActive(): boolean {
  return modelPersistence.isActive();
}