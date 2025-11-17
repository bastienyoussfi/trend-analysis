import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Analysis, GrowthTrend } from '../entities/analysis.entity';
import { Trend } from '../entities/trend.entity';
import { AIFactoryService } from '../ai/ai-factory.service';
import { PlatformFactoryService } from '../platforms/platform-factory.service';
import { TrendsCollectorService } from './trends-collector.service';
import { InsightsGeneratorService } from './insights-generator.service';
import { AnalyzeTrendsDto } from '../dto/analyze-trends.dto';
import { AnalysisResponseDto } from '../dto/analysis-response.dto';
import axios from 'axios';

@Injectable()
export class TrendsAnalyzerService {
  private readonly logger = new Logger(TrendsAnalyzerService.name);

  constructor(
    @InjectRepository(Analysis)
    private analysisRepository: Repository<Analysis>,
    @InjectRepository(Trend)
    private trendRepository: Repository<Trend>,
    private aiFactory: AIFactoryService,
    private platformFactory: PlatformFactoryService,
    private trendsCollector: TrendsCollectorService,
    private insightsGenerator: InsightsGeneratorService,
  ) {}

  async analyzeTrends(dto: AnalyzeTrendsDto): Promise<AnalysisResponseDto> {
    this.logger.log(`Analyzing trends for topic: ${dto.topic}`);

    // Check cache if enabled
    if (dto.useCache !== false) {
      const cached = await this.findRecentAnalysis(dto.topic, dto.platforms, 1);
      if (cached) {
        this.logger.log('Returning cached analysis');
        return this.buildResponseFromAnalysis(cached, true);
      }
    }

    // Collect data from platforms
    const platformData = await this.trendsCollector.collectTrendsData(dto.topic, dto.platforms);

    // Get AI provider
    const aiProvider = this.aiFactory.getProvider(dto.aiProvider);

    // Analyze with AI
    const prompt = this.buildAnalysisPrompt(dto.topic, platformData);
    const aiResponse = await aiProvider.analyzeContent(prompt, platformData);

    // Parse AI response and extract metrics
    const sentimentScore = this.extractSentimentScore(aiResponse.content);
    const predictedGrowth = this.extractGrowthTrend(aiResponse.content);

    // Save analysis to database
    const analysis = await this.saveAnalysis({
      topic: dto.topic,
      platforms: dto.platforms,
      aiProvider: aiProvider.getProviderName(),
      analysisText: aiResponse.content,
      sentimentScore,
      predictedGrowth,
      tokensUsed: aiResponse.tokens || 0,
      platformData,
    });

    // Generate insights
    await this.insightsGenerator.generateAndSaveInsights(analysis, platformData);

    // Build response
    const response = await this.buildResponseFromAnalysis(analysis, false);

    // Call webhook if provided
    if (dto.webhookUrl) {
      this.callWebhook(dto.webhookUrl, response).catch((err) =>
        this.logger.error(`Webhook failed: ${err.message}`),
      );
    }

    return response;
  }

  async getTrendHistory(topic: string, platform: string, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await this.trendRepository.find({
      where: {
        topic,
        platform: platform as any,
        detectedAt: Between(startDate, new Date()),
      },
      order: { detectedAt: 'ASC' },
    });

    return this.buildTrendHistory(trends);
  }

  private async findRecentAnalysis(
    topic: string,
    platforms: string[],
    hoursOld = 1,
  ): Promise<Analysis | null> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursOld);

    const analysis = await this.analysisRepository.findOne({
      where: {
        topic,
        analyzedAt: Between(cutoffDate, new Date()),
      },
      relations: ['insights', 'posts'],
      order: { analyzedAt: 'DESC' },
    });

    return analysis;
  }

  private async saveAnalysis(data: any): Promise<Analysis> {
    const analysis = this.analysisRepository.create({
      topic: data.topic,
      platforms: data.platforms,
      aiProvider: data.aiProvider,
      analysisText: data.analysisText,
      sentimentScore: data.sentimentScore,
      predictedGrowth: data.predictedGrowth,
      tokensUsed: data.tokensUsed,
      analyzedAt: new Date(),
      metadata: {
        platformDataSummary: data.platformData?.map((pd: any) => ({
          platform: pd.platform,
          trendCount: pd.trends?.length || 0,
          postCount: pd.posts?.length || 0,
        })),
      },
    });

    return await this.analysisRepository.save(analysis);
  }

  private buildAnalysisPrompt(topic: string, platformData: any[]): string {
    return `Analyze the following social media trend data for the topic: "${topic}"

Platform Data:
${JSON.stringify(platformData, null, 2)}

Please provide a comprehensive analysis including:
1. Overall trend summary and key insights
2. Sentiment analysis (positive/negative/neutral with a score from -1 to 1)
3. Growth prediction (rising/declining/stable/viral)
4. Platform-specific observations
5. Content patterns and themes
6. Audience engagement patterns
7. Actionable recommendations

Format your response in a clear, structured manner.`;
  }

  private extractSentimentScore(analysisText: string): number {
    // Simple extraction - look for sentiment indicators
    // In production, you might want more sophisticated parsing
    const lowerText = analysisText.toLowerCase();

    if (lowerText.includes('very positive') || lowerText.includes('highly positive')) {
      return 0.8;
    } else if (lowerText.includes('positive')) {
      return 0.5;
    } else if (lowerText.includes('neutral')) {
      return 0.0;
    } else if (lowerText.includes('negative')) {
      return -0.5;
    } else if (lowerText.includes('very negative')) {
      return -0.8;
    }

    return 0.0;
  }

  private extractGrowthTrend(analysisText: string): GrowthTrend {
    const lowerText = analysisText.toLowerCase();

    if (lowerText.includes('viral') || lowerText.includes('explosive growth')) {
      return GrowthTrend.VIRAL;
    } else if (lowerText.includes('rising') || lowerText.includes('growing')) {
      return GrowthTrend.RISING;
    } else if (lowerText.includes('declining') || lowerText.includes('decreasing')) {
      return GrowthTrend.DECLINING;
    }

    return GrowthTrend.STABLE;
  }

  private async buildResponseFromAnalysis(
    analysis: Analysis,
    fromCache: boolean,
  ): Promise<AnalysisResponseDto> {
    // Load relations if not already loaded
    if (!analysis.insights) {
      analysis = await this.analysisRepository.findOne({
        where: { id: analysis.id },
        relations: ['insights', 'posts'],
      });
    }

    return {
      topic: analysis.topic,
      analysis: {
        summary: analysis.analysisText,
        sentiment: analysis.sentimentScore || 0,
        predictedGrowth: analysis.predictedGrowth || GrowthTrend.STABLE,
        confidence: 0.85, // You can calculate this based on data quality
      },
      insights:
        analysis.insights?.map((insight) => ({
          type: insight.insightType,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidenceScore,
          actionable: insight.actionable,
          metadata: insight.metadata,
        })) || [],
      analyzedAt: analysis.analyzedAt,
      fromCache,
    };
  }

  private buildTrendHistory(trends: Trend[]) {
    const timeline = trends.map((trend) => ({
      date: trend.detectedAt.toISOString().split('T')[0],
      volume: trend.volume,
      sentiment: 0.5, // You can enhance this with actual sentiment data
    }));

    return {
      timeline,
      trend: this.calculateGrowthTrend(trends),
      growthRate: this.calculateGrowthRate(trends),
    };
  }

  private calculateGrowthTrend(trends: Trend[]): GrowthTrend {
    if (trends.length < 2) return GrowthTrend.STABLE;

    const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
    const secondHalf = trends.slice(Math.floor(trends.length / 2));

    const firstAvg = firstHalf.reduce((sum, t) => sum + t.volume, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, t) => sum + t.volume, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.5) return GrowthTrend.VIRAL;
    if (change > 0.1) return GrowthTrend.RISING;
    if (change < -0.1) return GrowthTrend.DECLINING;
    return GrowthTrend.STABLE;
  }

  private calculateGrowthRate(trends: Trend[]): number {
    if (trends.length < 2) return 0;

    const firstVolume = trends[0].volume;
    const lastVolume = trends[trends.length - 1].volume;

    return (lastVolume - firstVolume) / firstVolume;
  }

  private async callWebhook(url: string, data: any): Promise<void> {
    try {
      await axios.post(url, data, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      });
      this.logger.log(`Webhook called successfully: ${url}`);
    } catch (error) {
      this.logger.error(`Webhook failed: ${error.message}`);
      throw error;
    }
  }
}
