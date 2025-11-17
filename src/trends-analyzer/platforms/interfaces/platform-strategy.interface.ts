import { PlatformType } from '../../entities/trend.entity';

export interface TrendingTopic {
  name: string;
  volume: number;
  platform: PlatformType;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PlatformPost {
  id: string;
  content: string;
  author: string;
  platform: PlatformType;
  engagementMetrics: EngagementMetrics;
  postedAt: Date;
  metadata?: Record<string, any>;
}

export interface EngagementMetrics {
  likes: number;
  shares: number;
  comments: number;
  views?: number;
  engagementRate?: number;
  viralityScore?: number;
}

export interface TimeSlot {
  day: string;
  hour: number;
  engagementScore: number;
}

export interface PlatformStrategy {
  /**
   * Fetch trending topics from the platform
   */
  fetchTrendingTopics(limit?: number): Promise<TrendingTopic[]>;

  /**
   * Fetch top posts for a specific topic
   */
  fetchTopPosts(topic: string, limit?: number): Promise<PlatformPost[]>;

  /**
   * Analyze engagement for a specific post
   */
  analyzeEngagement(postId: string): Promise<EngagementMetrics>;

  /**
   * Get optimal posting times based on platform data
   */
  getOptimalPostingTimes(): Promise<TimeSlot[]>;

  /**
   * Get the platform name
   */
  getPlatformName(): PlatformType;
}
