/**
 * Service Manager - Handles Ollama service lifecycle and model persistence
 */

export class ServiceManager {
  private static instance: ServiceManager;
  private isInitialized = false;
  private modelWarmupInterval: NodeJS.Timeout | null = null;
  private readonly WARMUP_INTERVAL = 10 * 60 * 1000; // 10 minutes

  private constructor() {}

  public static getInstance(): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager();
    }
    return ServiceManager.instance;
  }

  /**
   * Initialize the service manager and start background services
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      
      // Start model persistence system
      await this.startModelPersistence();
      
      // Warmup model for immediate use
      await this.warmupModel();
      
      // Start background warmup interval
      this.startBackgroundWarmup();
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('🦙 ServiceManager initialization failed:', error);
      return false;
    }
  }

  /**
   * Start the model persistence system
   */
  private async startModelPersistence(): Promise<void> {
    try {
      const response = await fetch('/api/model-persistence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' })
      });
      
      if (!response.ok) {
        console.log('🦙 Model persistence start failed, continuing...');
      }
    } catch (error) {
      console.log('🦙 Model persistence error (non-critical):', error);
    }
  }

  /**
   * Warmup the model with a lightweight request
   */
  private async warmupModel(): Promise<void> {
    try {
      const response = await fetch('/api/chat-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: 'ping' }],
          stream: false
        })
      });
      
      if (!response.ok) {
        console.log('🦙 Model warmup failed');
      }
    } catch (error) {
      console.log('🦙 Model warmup error:', error);
    }
  }

  /**
   * Start background warmup to keep model active
   */
  private startBackgroundWarmup(): void {
    if (this.modelWarmupInterval) {
      clearInterval(this.modelWarmupInterval);
    }

    this.modelWarmupInterval = setInterval(async () => {
      await this.warmupModel();
    }, this.WARMUP_INTERVAL);
  }

  /**
   * Stop background services
   */
  public cleanup(): void {
    if (this.modelWarmupInterval) {
      clearInterval(this.modelWarmupInterval);
      this.modelWarmupInterval = null;
    }
    
    this.isInitialized = false;
  }

  /**
   * Check if services are running
   */
  public async getServiceStatus(): Promise<{
    ollama: boolean;
    persistence: boolean;
    model: boolean;
  }> {
    try {
      // Check Ollama service
      const ollamaResponse = await fetch('/api/chat-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: 'status' }] 
        })
      });
      
      // Check persistence system
      const persistenceResponse = await fetch('/api/model-persistence', {
        method: 'GET'
      });
      
      return {
        ollama: ollamaResponse.ok,
        persistence: persistenceResponse.ok,
        model: ollamaResponse.ok // Assume model is loaded if Ollama responds
      };
    } catch (error) {
      console.log('🦙 Service status check error:', error);
      return {
        ollama: false,
        persistence: false,
        model: false
      };
    }
  }

  /**
   * Restart services if needed
   */
  public async restart(): Promise<boolean> {
    console.log('🦙 Restarting services...');
    this.cleanup();
    return await this.initialize();
  }
}

// Export singleton instance
export const serviceManager = ServiceManager.getInstance();

/**
 * Initialize services when imported (for use in components)
 */
export async function initializeServices(): Promise<boolean> {
  return await serviceManager.initialize();
}

/**
 * Get current service status
 */
export async function getServiceStatus() {
  return await serviceManager.getServiceStatus();
}