import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trend, PlatformType } from '../entities/trend.entity';
import { PlatformFactoryService } from '../platforms/platform-factory.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TrendsCollectorService {
  private readonly logger = new Logger(TrendsCollectorService.name);

  constructor(
    @InjectRepository(Trend)
    private trendRepository: Repository<Trend>,
    private platformFactory: PlatformFactoryService,
    private configService: ConfigService,
  ) {}

  async collectTrendsData(topic: string, platforms: PlatformType[]) {
    this.logger.log(
      `Collecting trends data for topic: ${topic} from ${platforms.length} platforms`,
    );

    const platformData = await Promise.all(
      platforms.map(async (platformName) => {
        try {
          const strategy = this.platformFactory.getStrategy(platformName);

          // Fetch trending topics
          const trendingTopics = await strategy.fetchTrendingTopics(
            this.configService.get('app.analysis.maxTrendsPerPlatform', 10),
          );

          // Save trending topics to database
          await this.saveTrendingTopics(trendingTopics);

          // Fetch top posts for the specific topic
          const topPosts = await strategy.fetchTopPosts(
            topic,
            this.configService.get('app.analysis.maxPostsPerTrend', 20),
          );

          // Get optimal posting times
          const optimalTimes = await strategy.getOptimalPostingTimes();

          return {
            platform: platformName,
            trends: trendingTopics,
            posts: topPosts,
            optimalTimes,
          };
        } catch (error) {
          this.logger.error(`Failed to collect data from ${platformName}: ${error.message}`);
          return {
            platform: platformName,
            error: error.message,
            trends: [],
            posts: [],
            optimalTimes: [],
          };
        }
      }),
    );

    return platformData;
  }

  private async saveTrendingTopics(topics: any[]): Promise<void> {
    const trends = topics.map((topic) =>
      this.trendRepository.create({
        topic: topic.name,
        platform: topic.platform,
        volume: topic.volume,
        trendingScore: topic.volume / 10000, // Simple scoring
        detectedAt: topic.timestamp,
        metadata: topic.metadata,
      }),
    );

    await this.trendRepository.save(trends);
  }

  async getRecentTrends(platform?: PlatformType, limit = 20): Promise<Trend[]> {
    const query = this.trendRepository
      .createQueryBuilder('trend')
      .orderBy('trend.detectedAt', 'DESC')
      .take(limit);

    if (platform) {
      query.where('trend.platform = :platform', { platform });
    }

    return await query.getMany();
  }
}
