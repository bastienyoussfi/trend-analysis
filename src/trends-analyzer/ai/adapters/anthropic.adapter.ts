import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIResponse, PerformancePrediction } from '../interfaces/ai-provider.interface';

@Injectable()
export class AnthropicAdapter implements AIProvider {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('app.ai.anthropic.apiKey');

    if (!apiKey) {
      throw new Error('Anthropic API key is not configured');
    }

    this.client = new Anthropic({ apiKey });
    this.model = this.configService.get<string>('app.ai.anthropic.model');
    this.maxTokens = this.configService.get<number>('app.ai.anthropic.maxTokens');
  }

  async analyzeContent(prompt: string, _context?: any): Promise<AIResponse> {
    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      const textContent = content.type === 'text' ? content.text : '';

      return {
        content: textContent,
        tokens: message.usage.input_tokens + message.usage.output_tokens,
        model: message.model,
        metadata: {
          id: message.id,
          stopReason: message.stop_reason,
        },
      };
    } catch (error) {
      throw new Error(`Anthropic API error: ${error.message}`);
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
    return 'anthropic';
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
