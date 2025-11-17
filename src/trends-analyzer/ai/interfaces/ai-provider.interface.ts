export interface AIResponse {
  content: string;
  tokens?: number;
  model?: string;
  metadata?: Record<string, any>;
}

export interface TrendAnalysisPrompt {
  topic: string;
  platformData: any[];
  historicalData?: any;
}

export interface PerformancePrediction {
  score: number;
  confidence: number;
  factors: {
    timing?: string;
    contentType?: string;
    hashtags?: string[];
    estimatedEngagement?: {
      likes: number;
      shares: number;
      comments: number;
    };
  };
  recommendations: string[];
}

export interface AIProvider {
  /**
   * Analyze content and trends from multiple platforms
   */
  analyzeContent(prompt: string, context?: any): Promise<AIResponse>;

  /**
   * Generate actionable insights from trend data
   */
  generateInsights(data: any): Promise<AIResponse>;

  /**
   * Summarize trends into a concise format
   */
  summarizeTrends(trends: any[]): Promise<string>;

  /**
   * Predict how content will perform on a specific platform
   */
  predictPerformance(content: any, platform: string): Promise<PerformancePrediction>;

  /**
   * Get the name of this AI provider
   */
  getProviderName(): string;
}
