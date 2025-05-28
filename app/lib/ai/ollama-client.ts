/**
 * Ollama API Client for Romanian ID Processing PWA
 * Provides a TypeScript wrapper for Ollama API interactions
 * Supports Qwen2.5-VL model for vision-language processing
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

// Types for Ollama API
export interface OllamaConfig {
  host: string;
  port: number;
  timeout: number;
  model: string;
}

export interface OllamaGenerateOptions {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stop?: string[];
  num_ctx?: number;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  images?: string[]; // Base64 encoded images
  stream?: boolean;
  options?: OllamaGenerateOptions | undefined;
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaModelInfo {
  name: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  modified_at: string;
}

export interface OllamaListResponse {
  models: OllamaModelInfo[];
}

export interface OllamaHealthResponse {
  status: 'ok' | 'error';
  message?: string;
}

export interface OllamaError {
  error: string;
  details?: string;
}

// Default configuration
const DEFAULT_CONFIG: OllamaConfig = {
  host: process.env.OLLAMA_HOST || 'localhost',
  port: parseInt(process.env.OLLAMA_PORT || '11434'),
  timeout: parseInt(process.env.AI_PROCESSING_TIMEOUT || '30000'),
  model: process.env.OLLAMA_MODEL || 'qwen2.5vl:7b',
};

/**
 * Ollama API Client Class
 * Handles all interactions with the local Ollama service
 */
export class OllamaClient {
  private client: AxiosInstance;
  private config: OllamaConfig;

  constructor(config?: Partial<OllamaConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.client = axios.create({
      baseURL: `http://${this.config.host}:${this.config.port}`,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      config => {
        console.log(`[Ollama] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      error => {
        console.error('[Ollama] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error(
          '[Ollama] Response error:',
          error.response?.data || error.message
        );
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Handle and format errors from Ollama API
   */
  private handleError(error: any): Error {
    if (error.response?.data?.error) {
      return new Error(`Ollama API Error: ${error.response.data.error}`);
    }

    if (error.code === 'ECONNREFUSED') {
      return new Error(
        `Cannot connect to Ollama service at ${this.config.host}:${this.config.port}. ` +
          'Please ensure Ollama is running.'
      );
    }

    if (error.code === 'ETIMEDOUT') {
      return new Error(
        `Request to Ollama timed out after ${this.config.timeout}ms. ` +
          'The model might be loading or the request is too complex.'
      );
    }

    return new Error(`Ollama Client Error: ${error.message}`);
  }

  /**
   * Check if Ollama service is healthy and responsive
   */
  async healthCheck(): Promise<OllamaHealthResponse> {
    try {
      await this.client.get('/');
      return { status: 'ok' };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List all available models
   */
  async listModels(): Promise<OllamaModelInfo[]> {
    try {
      const response: AxiosResponse<OllamaListResponse> =
        await this.client.get('/api/tags');
      return response.data.models;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check if a specific model is available
   */
  async isModelAvailable(modelName?: string): Promise<boolean> {
    try {
      const models = await this.listModels();
      const targetModel = modelName || this.config.model;
      return models.some(model => model.name === targetModel);
    } catch (error) {
      console.error('[Ollama] Error checking model availability:', error);
      return false;
    }
  }

  /**
   * Generate text response from prompt
   */
  async generate(
    request: Omit<OllamaGenerateRequest, 'model'>
  ): Promise<OllamaGenerateResponse> {
    try {
      const fullRequest: OllamaGenerateRequest = {
        ...request,
        model: this.config.model,
        stream: false, // Always use non-streaming for simplicity
      };

      const response: AxiosResponse<OllamaGenerateResponse> =
        await this.client.post('/api/generate', fullRequest);

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate response with image input (vision capabilities)
   */
  async generateWithImage(
    prompt: string,
    imageBase64: string,
    options?: OllamaGenerateOptions
  ): Promise<OllamaGenerateResponse> {
    const requestData: Omit<OllamaGenerateRequest, 'model'> = {
      prompt,
      images: [imageBase64],
    };

    if (options) {
      requestData.options = options;
    }

    return this.generate(requestData);
  }

  /**
   * Generate response with multiple images
   */
  async generateWithImages(
    prompt: string,
    imagesBase64: string[],
    options?: OllamaGenerateOptions
  ): Promise<OllamaGenerateResponse> {
    const requestData: Omit<OllamaGenerateRequest, 'model'> = {
      prompt,
      images: imagesBase64,
    };

    if (options) {
      requestData.options = options;
    }

    return this.generate(requestData);
  }

  /**
   * Process Romanian ID document with optimized settings
   */
  async processRomanianID(
    imageBase64: string,
    extractionPrompt?: string
  ): Promise<OllamaGenerateResponse> {
    const defaultPrompt = `
Analyze this Romanian ID document image and extract all visible information in JSON format.
Please extract the following fields if visible:
- nume (full name)
- cnp (personal numeric code)
- data_nasterii (date of birth)
- locul_nasterii (place of birth)
- domiciliul (address)
- seria_si_numarul (ID series and number)
- data_eliberarii (issue date)
- eliberat_de (issuing authority)
- valabil_pana_la (validity date)

Return the response as valid JSON with Romanian field names.
If a field is not visible or unclear, use null as the value.
`;

    return this.generateWithImage(
      extractionPrompt || defaultPrompt,
      imageBase64,
      {
        temperature: 0.1, // Low temperature for consistent extraction
        top_p: 0.9,
        max_tokens: 2048,
        num_ctx: 4096, // Larger context for document processing
      }
    );
  }

  /**
   * Test the model with a simple prompt
   */
  async testModel(): Promise<{
    success: boolean;
    response?: string;
    error?: string;
  }> {
    try {
      const response = await this.generate({
        prompt:
          'Hello! Please respond with "Model is working correctly" to confirm you are functioning.',
        options: {
          temperature: 0.1,
          max_tokens: 50,
        },
      });

      return {
        success: true,
        response: response.response,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): OllamaConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OllamaConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update axios instance baseURL if host or port changed
    if (newConfig.host || newConfig.port) {
      this.client.defaults.baseURL = `http://${this.config.host}:${this.config.port}`;
    }

    // Update timeout if changed
    if (newConfig.timeout) {
      this.client.defaults.timeout = this.config.timeout;
    }
  }

  /**
   * Get model performance metrics from last response
   */
  getPerformanceMetrics(response: OllamaGenerateResponse): {
    totalDuration: number;
    loadDuration: number;
    promptEvalDuration: number;
    evalDuration: number;
    tokensPerSecond: number;
  } | null {
    if (
      !response.total_duration ||
      !response.eval_count ||
      !response.eval_duration
    ) {
      return null;
    }

    return {
      totalDuration: response.total_duration / 1000000, // Convert to ms
      loadDuration: (response.load_duration || 0) / 1000000,
      promptEvalDuration: (response.prompt_eval_duration || 0) / 1000000,
      evalDuration: response.eval_duration / 1000000,
      tokensPerSecond:
        response.eval_count / (response.eval_duration / 1000000000), // tokens/second
    };
  }
}

// Export a default instance
export const ollamaClient = new OllamaClient();

// Export utility functions
export const createOllamaClient = (
  config?: Partial<OllamaConfig>
): OllamaClient => {
  return new OllamaClient(config);
};

export default OllamaClient;
