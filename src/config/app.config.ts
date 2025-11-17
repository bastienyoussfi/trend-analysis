import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,

  // AI Provider Configuration
  ai: {
    defaultProvider: process.env.AI_DEFAULT_PROVIDER || 'anthropic',
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022',
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS, 10) || 4096,
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 4096,
    },
  },

  // Platform API Configuration
  platforms: {
    twitter: {
      apiKey: process.env.TWITTER_API_KEY,
      apiSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
      bearerToken: process.env.TWITTER_BEARER_TOKEN,
    },
    instagram: {
      username: process.env.INSTAGRAM_USERNAME,
      password: process.env.INSTAGRAM_PASSWORD,
    },
  },

  // Analysis Configuration
  analysis: {
    cacheEnabled: process.env.CACHE_ENABLED !== 'false',
    cacheTtl: parseInt(process.env.ANALYSIS_CACHE_TTL, 10) || 3600, // 1 hour
    maxTrendsPerPlatform: parseInt(process.env.MAX_TRENDS_PER_PLATFORM, 10) || 10,
    maxPostsPerTrend: parseInt(process.env.MAX_POSTS_PER_TREND, 10) || 20,
  },
}));
