import ollama from 'ollama';



/**
 * Optimized model configuration - llama3.1 only as requested
 * Use llama3.1 for all tasks to keep model loaded and warm
 */
export const OLLAMA_MODELS = {
  // All tasks use llama3.1 to maintain loaded model
  QWEN_CODER: 'llama3.1:8b',          // Use llama3.1 instead of qwen
  
  // Chat models - use llama3.1 for natural conversation
  LLAMA_CHAT: 'llama3.1:8b',          // Main chat model
  LLAMA_FAST: 'llama3.1:8b',          // Same model for consistency
  
  // Task-specific optimization - all use llama3.1 for persistence
  ISSUE_DETECTION: 'llama3.1:8b',     // Use llama3.1 instead of qwen
  SENTIMENT_ANALYSIS: 'llama3.1:8b',  // Simple classification, use chat model
  COMPENSATION_REASONING: 'llama3.1:8b', // Use llama3.1 instead of qwen
  MAIN_CHAT: 'llama3.1:8b'            // Use llama3.1 instead of qwen
} as const;

/**
 * Default options for Ollama generation
 */
const DEFAULT_OPTIONS = {
  temperature: 0.4,
  top_p: 0.8,
  top_k: 40,
  num_predict: 2048,
};

/**
 * Ollama client wrapper that mimics the Gemini generateText interface
 */
export class OllamaClient {
  private host: string;

  constructor(host = 'http://127.0.0.1:11434') {
    this.host = host;
  }

  /**
   * Generate text using specified Ollama model
   * @param model Model name to use
   * @param prompt The prompt to send
   * @param options Generation options
   * @returns Generated text response
   */
  async generateText(
    model: string,
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      topK?: number;
    } = {}
  ): Promise<string> {
    try {
      console.log(`🦙 Ollama: Generating with ${model}...`);
      
      const ollamaOptions = {
        ...DEFAULT_OPTIONS,
        temperature: options.temperature ?? DEFAULT_OPTIONS.temperature,
        top_p: options.topP ?? DEFAULT_OPTIONS.top_p,
        top_k: options.topK ?? DEFAULT_OPTIONS.top_k,
        num_predict: options.maxTokens ?? DEFAULT_OPTIONS.num_predict,
      };

      const response = await ollama.generate({
        model,
        prompt,
        stream: false,
        options: ollamaOptions,
      });

      console.log(`🦙 Ollama: Generated ${response.response.length} characters`);
      return response.response;
    } catch (error) {
      console.error(`🦙 Ollama Error with model ${model}:`, error);
      
      // Fallback to a lighter model if the requested one fails
      if (model !== OLLAMA_MODELS.LLAMA_FAST) {
        console.log(`🦙 Ollama: Falling back to ${OLLAMA_MODELS.LLAMA_FAST}...`);
        return this.generateText(OLLAMA_MODELS.LLAMA_FAST, prompt, options);
      }
      
      throw error;
    }
  }

  /**
   * Check if a model is available locally
   * @param modelName Model to check
   * @returns Promise<boolean>
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await ollama.list();
      return models.models.some(model => model.name === modelName);
    } catch (error) {
      console.error('🦙 Ollama: Error checking model availability:', error);
      return false;
    }
  }

  /**
   * List all available models
   * @returns Promise<string[]>
   */
  async listModels(): Promise<string[]> {
    try {
      const models = await ollama.list();
      return models.models.map(model => model.name);
    } catch (error) {
      console.error('🦙 Ollama: Error listing models:', error);
      return [];
    }
  }

  /**
   * Pull a model if it's not available locally
   * @param modelName Model to pull
   */
  async ensureModel(modelName: string): Promise<void> {
    const isAvailable = await this.isModelAvailable(modelName);
    
    if (!isAvailable) {
      console.log(`🦙 Ollama: Pulling model ${modelName}...`);
      await ollama.pull({ model: modelName });
      console.log(`🦙 Ollama: Successfully pulled ${modelName}`);
    }
  }
}

// Create default client instance
export const ollamaClient = new OllamaClient();

/**
 * Generate text using the best model for issue detection and analysis
 * @param prompt The prompt to analyze
 * @param options Generation options
 * @returns Generated response
 */
export async function generateAnalysisText(
  prompt: string,
  options: Parameters<OllamaClient['generateText']>[2] = {}
): Promise<string> {
  return ollamaClient.generateText(OLLAMA_MODELS.ISSUE_DETECTION, prompt, {
    temperature: 0.2, // Lower temperature for more consistent analysis
    ...options
  });
}

/**
 * Generate text using the best model for chat responses
 * @param prompt The chat prompt
 * @param options Generation options
 * @returns Generated response
 */
export async function generateChatText(
  prompt: string,
  options: Parameters<OllamaClient['generateText']>[2] = {}
): Promise<string> {
  return ollamaClient.generateText(OLLAMA_MODELS.MAIN_CHAT, prompt, options);
}

/**
 * Generate text using the fastest model for simple tasks
 * @param prompt The prompt
 * @param options Generation options
 * @returns Generated response
 */
export async function generateFastText(
  prompt: string,
  options: Parameters<OllamaClient['generateText']>[2] = {}
): Promise<string> {
  return ollamaClient.generateText(OLLAMA_MODELS.SENTIMENT_ANALYSIS, prompt, options);
}

/**
 * Health check for Ollama service
 * @returns Promise<boolean>
 */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    await ollama.list();
    return true;
  } catch (error) {
    console.error('🦙 Ollama: Health check failed:', error);
    return false;
  }
}
