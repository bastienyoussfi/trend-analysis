import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import {
  AIProvider,
  AIResponse,
  PerformancePrediction,
} from '../interfaces/ai-provider.interface';

@Injectable()
export class OpenAIAdapter implements AIProvider {
  private client: OpenAI;
  private model: string;
  private maxTokens: number;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('app.ai.openai.apiKey');

    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    this.client = new OpenAI({ apiKey });
    this.model = this.configService.get<string>('app.ai.openai.model');
    this.maxTokens = this.configService.get<number>('app.ai.openai.maxTokens');
  }

  async analyzeContent(prompt: string, context?: any): Promise<AIResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const message = completion.choices[0].message;

      return {
        content: message.content || '',
        tokens: completion.usage?.total_tokens || 0,
        model: completion.model,
        metadata: {
          id: completion.id,
          finishReason: completion.choices[0].finish_reason,
        },
      };
    } catch (error) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async generateInsights(data: any): Promise<AIResponse> {
    const prompt = this.buildInsightsPrompt(data);
    return this.analyzeContent(prompt, data);
  }

  async summarizeTrends(trends: any[]): Promise<string> {
    const prompt = `Summarize the following trends concisely (2-3 sentences):

${JSON.stringify(trends, null, 2)}

Focus on the most important patterns and emerging topics.`;

    const response = await this.analyzeContent(prompt);
    return response.content;
  }

  async predictPerformance(content: any, platform: string): Promise<PerformancePrediction> {
    const prompt = `Analyze this content for ${platform} and predict its performance:

Content: ${JSON.stringify(content)}

Provide a JSON response with:
1. score (0-100): Overall performance prediction
2. confidence (0-1): How confident you are in this prediction
3. factors: Key factors affecting performance (timing, contentType, hashtags, estimatedEngagement)
4. recommendations: Array of actionable recommendations

Return ONLY valid JSON, no additional text.`;

    const response = await this.analyzeContent(prompt);

    try {
      // Extract JSON from the response
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      // Fallback if JSON parsing fails
      return {
        score: 50,
        confidence: 0.5,
        factors: {},
        recommendations: ['Unable to parse AI response. Please try again.'],
      };
    }
  }

  getProviderName(): string {
    return 'openai';
  }

  private buildInsightsPrompt(data: any): string {
    return `Analyze the following social media trend data and generate actionable insights:

${JSON.stringify(data, null, 2)}

Please provide:
1. Key patterns observed across platforms
2. Optimal posting times and content formats
3. Hashtag recommendations
4. Sentiment analysis
5. Predicted trend direction (rising/declining/stable)
6. Specific, actionable recommendations

Format your response in clear, structured sections.`;
  }
}
