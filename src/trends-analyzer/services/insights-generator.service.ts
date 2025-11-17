import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Insight, InsightType } from '../entities/insight.entity';
import { Analysis } from '../entities/analysis.entity';
import { AIFactoryService } from '../ai/ai-factory.service';

@Injectable()
export class InsightsGeneratorService {
  private readonly logger = new Logger(InsightsGeneratorService.name);

  constructor(
    @InjectRepository(Insight)
    private insightRepository: Repository<Insight>,
    private aiFactory: AIFactoryService,
  ) {}

  async generateAndSaveInsights(analysis: Analysis, platformData: any[]): Promise<Insight[]> {
    this.logger.log(`Generating insights for analysis: ${analysis.id}`);

    const insights: Insight[] = [];

    // Generate different types of insights
    try {
      // Best posting time insight
      const timeInsights = this.extractPostingTimeInsights(platformData, analysis.id);
      insights.push(...timeInsights);

      // Hashtag insights
      const hashtagInsights = this.extractHashtagInsights(platformData, analysis.id);
      insights.push(...hashtagInsights);

      // Content format insights
      const formatInsights = this.extractContentFormatInsights(platformData, analysis.id);
      insights.push(...formatInsights);

      // Engagement pattern insights
      const engagementInsights = this.extractEngagementPatternInsights(platformData, analysis.id);
      insights.push(...engagementInsights);

      // Save all insights
      await this.insightRepository.save(insights);

      this.logger.log(`Generated ${insights.length} insights`);
      return insights;
    } catch (error) {
      this.logger.error(`Failed to generate insights: ${error.message}`);
      return [];
    }
  }

  private extractPostingTimeInsights(platformData: any[], analysisId: string): Insight[] {
    const insights: Insight[] = [];

    platformData.forEach((data) => {
      if (data.optimalTimes && data.optimalTimes.length > 0) {
        const bestTime = data.optimalTimes.reduce((prev, curr) =>
          curr.engagementScore > prev.engagementScore ? curr : prev,
        );

        insights.push(
          this.insightRepository.create({
            analysisId,
            insightType: InsightType.BEST_TIME,
            title: `Optimal Posting Time for ${data.platform}`,
            description: `Best engagement on ${bestTime.day} at ${bestTime.hour}:00 with ${(bestTime.engagementScore * 100).toFixed(1)}% engagement score`,
            confidenceScore: bestTime.engagementScore,
            actionable: true,
            metadata: {
              platform: data.platform,
              day: bestTime.day,
              hour: bestTime.hour,
              score: bestTime.engagementScore,
            },
          }),
        );
      }
    });

    return insights;
  }

  private extractHashtagInsights(platformData: any[], analysisId: string): Insight[] {
    const insights: Insight[] = [];
    const hashtagPattern = /#\w+/g;

    platformData.forEach((data) => {
      if (data.posts && data.posts.length > 0) {
        const hashtagCounts: Map<string, number> = new Map();

        // Count hashtags from top posts
        data.posts.forEach((post) => {
          const hashtags = post.content.match(hashtagPattern) || [];
          hashtags.forEach((tag) => {
            hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
          });
        });

        // Get top 5 hashtags
        const topHashtags = Array.from(hashtagCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([tag]) => tag);

        if (topHashtags.length > 0) {
          insights.push(
            this.insightRepository.create({
              analysisId,
              insightType: InsightType.HASHTAGS,
              title: `Popular Hashtags on ${data.platform}`,
              description: `Top performing hashtags: ${topHashtags.join(', ')}`,
              confidenceScore: 0.75,
              actionable: true,
              metadata: {
                platform: data.platform,
                hashtags: topHashtags,
              },
            }),
          );
        }
      }
    });

    return insights;
  }

  private extractContentFormatInsights(platformData: any[], analysisId: string): Insight[] {
    const insights: Insight[] = [];

    platformData.forEach((data) => {
      if (data.posts && data.posts.length > 0) {
        // Analyze content formats
        const formats = {
          hasMedia: 0,
          hasLinks: 0,
          hasHashtags: 0,
          longForm: 0,
          shortForm: 0,
        };

        data.posts.forEach((post) => {
          if (post.metadata?.hasMedia) formats.hasMedia++;
          if (post.content.includes('http')) formats.hasLinks++;
          if (post.content.includes('#')) formats.hasHashtags++;
          if (post.content.length > 280) formats.longForm++;
          else formats.shortForm++;
        });

        // Determine best format
        let bestFormat = 'mixed content';
        let confidence = 0.6;

        if (formats.hasMedia / data.posts.length > 0.7) {
          bestFormat = 'visual content (images/videos)';
          confidence = 0.85;
        } else if (formats.longForm / data.posts.length > 0.6) {
          bestFormat = 'long-form text posts';
          confidence = 0.75;
        }

        insights.push(
          this.insightRepository.create({
            analysisId,
            insightType: InsightType.CONTENT_FORMAT,
            title: `Best Content Format for ${data.platform}`,
            description: `Top performing posts use ${bestFormat}`,
            confidenceScore: confidence,
            actionable: true,
            metadata: {
              platform: data.platform,
              format: bestFormat,
              stats: formats,
            },
          }),
        );
      }
    });

    return insights;
  }

  private extractEngagementPatternInsights(platformData: any[], analysisId: string): Insight[] {
    const insights: Insight[] = [];

    platformData.forEach((data) => {
      if (data.posts && data.posts.length > 0) {
        // Calculate average engagement
        const totalEngagement = data.posts.reduce((sum, post) => {
          const metrics = post.engagementMetrics;
          return sum + (metrics.likes || 0) + (metrics.shares || 0) + (metrics.comments || 0);
        }, 0);

        const avgEngagement = totalEngagement / data.posts.length;

        // Find engagement patterns
        const avgLikes = data.posts.reduce((sum, p) => sum + p.engagementMetrics.likes, 0) / data.posts.length;
        const avgShares = data.posts.reduce((sum, p) => sum + p.engagementMetrics.shares, 0) / data.posts.length;
        const avgComments = data.posts.reduce((sum, p) => sum + p.engagementMetrics.comments, 0) / data.posts.length;

        let pattern = 'balanced engagement';
        if (avgLikes > avgShares * 5 && avgLikes > avgComments * 5) {
          pattern = 'like-driven engagement';
        } else if (avgShares > avgLikes && avgShares > avgComments) {
          pattern = 'share-driven engagement (high virality potential)';
        } else if (avgComments > avgLikes * 0.3) {
          pattern = 'conversation-driven engagement';
        }

        insights.push(
          this.insightRepository.create({
            analysisId,
            insightType: InsightType.ENGAGEMENT_PATTERN,
            title: `Engagement Pattern on ${data.platform}`,
            description: `Content shows ${pattern}. Average engagement: ${avgEngagement.toFixed(0)} interactions per post`,
            confidenceScore: 0.8,
            actionable: true,
            metadata: {
              platform: data.platform,
              pattern,
              avgEngagement,
              breakdown: {
                likes: avgLikes,
                shares: avgShares,
                comments: avgComments,
              },
            },
          }),
        );
      }
    });

    return insights;
  }
}
