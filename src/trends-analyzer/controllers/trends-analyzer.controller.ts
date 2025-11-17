import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { TrendsAnalyzerService } from '../services/trends-analyzer.service';
import { TrendsCollectorService } from '../services/trends-collector.service';
import { AnalyzeTrendsDto } from '../dto/analyze-trends.dto';
import { TrendQueryDto, GetInsightsDto } from '../dto/trend-query.dto';
import { PlatformType } from '../entities/trend.entity';

@Controller('trends')
export class TrendsAnalyzerController {
  constructor(
    private readonly trendsAnalyzerService: TrendsAnalyzerService,
    private readonly trendsCollectorService: TrendsCollectorService,
  ) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  async analyzeTrends(@Body() dto: AnalyzeTrendsDto) {
    return await this.trendsAnalyzerService.analyzeTrends(dto);
  }

  @Get('trending')
  async getTrendingTopics(
    @Query('platform') platform?: PlatformType,
    @Query('limit') limit?: number,
  ) {
    const trends = await this.trendsCollectorService.getRecentTrends(
      platform,
      limit ? parseInt(limit as any, 10) : 20,
    );

    return {
      platform: platform || 'all',
      count: trends.length,
      trends: trends.map((t) => ({
        topic: t.topic,
        platform: t.platform,
        volume: t.volume,
        score: t.trendingScore,
        detectedAt: t.detectedAt,
      })),
    };
  }

  @Get('history')
  async getTrendHistory(@Query() query: TrendQueryDto) {
    const history = await this.trendsAnalyzerService.getTrendHistory(
      query.topic,
      query.platform,
      query.days || 7,
    );

    return {
      topic: query.topic,
      platform: query.platform || 'all',
      period: `${query.days || 7} days`,
      ...history,
    };
  }

  @Get('insights')
  async getInsights(@Query() query: GetInsightsDto) {
    // This could be expanded to query insights from the database
    return {
      topic: query.topic,
      platform: query.platform,
      message: 'Insights endpoint - implement based on your needs',
    };
  }

  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Social Trends Analyzer',
    };
  }
}
