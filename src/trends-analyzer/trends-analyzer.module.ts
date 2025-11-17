import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Entities
import { Trend } from './entities/trend.entity';
import { Analysis } from './entities/analysis.entity';
import { PlatformPost } from './entities/platform-post.entity';
import { Insight } from './entities/insight.entity';

// Controllers
import { TrendsAnalyzerController } from './controllers/trends-analyzer.controller';

// Services
import { TrendsAnalyzerService } from './services/trends-analyzer.service';
import { TrendsCollectorService } from './services/trends-collector.service';
import { InsightsGeneratorService } from './services/insights-generator.service';

// AI Providers
import { AIFactoryService } from './ai/ai-factory.service';
import { AnthropicAdapter } from './ai/adapters/anthropic.adapter';
import { OpenAIAdapter } from './ai/adapters/openai.adapter';

// Platform Strategies
import { PlatformFactoryService } from './platforms/platform-factory.service';
import { TwitterStrategy } from './platforms/strategies/twitter.strategy';
import { InstagramStrategy } from './platforms/strategies/instagram.strategy';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Trend, Analysis, PlatformPost, Insight])],
  controllers: [TrendsAnalyzerController],
  providers: [
    // Core Services
    TrendsAnalyzerService,
    TrendsCollectorService,
    InsightsGeneratorService,

    // AI Providers
    AnthropicAdapter,
    OpenAIAdapter,
    {
      provide: 'AI_PROVIDERS',
      useFactory: (anthropic: AnthropicAdapter, openai: OpenAIAdapter) => {
        return [anthropic, openai];
      },
      inject: [AnthropicAdapter, OpenAIAdapter],
    },
    AIFactoryService,

    // Platform Strategies
    TwitterStrategy,
    InstagramStrategy,
    {
      provide: 'PLATFORM_STRATEGIES',
      useFactory: (twitter: TwitterStrategy, instagram: InstagramStrategy) => {
        return [twitter, instagram];
      },
      inject: [TwitterStrategy, InstagramStrategy],
    },
    PlatformFactoryService,
  ],
  exports: [TrendsAnalyzerService],
})
export class TrendsAnalyzerModule {}
