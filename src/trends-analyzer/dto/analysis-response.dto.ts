import { GrowthTrend } from '../entities/analysis.entity';
import { InsightType } from '../entities/insight.entity';

export class AnalysisResponseDto {
  topic: string;
  analysis: {
    summary: string;
    sentiment: number;
    predictedGrowth: GrowthTrend;
    confidence: number;
  };
  insights: InsightDto[];
  comparedToLastWeek?: {
    volumeChange: string;
    sentimentChange: string;
  };
  analyzedAt: Date;
  fromCache: boolean;
}

export class InsightDto {
  type: InsightType;
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  metadata?: Record<string, any>;
}

export class TrendHistoryResponseDto {
  topic: string;
  platform?: string;
  timeline: TimelineDataPoint[];
  trend: GrowthTrend;
  growthRate: number;
}

export class TimelineDataPoint {
  date: string;
  volume: number;
  sentiment: number;
}

export class PlatformComparisonDto {
  topic: string;
  comparison: PlatformComparisonItem[];
  recommendation: string;
}

export class PlatformComparisonItem {
  platform: string;
  volume: number;
  engagement: string;
  bestContentType: string;
  optimalPostingTime?: {
    day: string;
    hour: number;
  };
}
