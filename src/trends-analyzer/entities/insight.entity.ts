import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Analysis } from './analysis.entity';

export enum InsightType {
  BEST_TIME = 'best_time',
  HASHTAGS = 'hashtags',
  CONTENT_FORMAT = 'content_format',
  ENGAGEMENT_PATTERN = 'engagement_pattern',
  COMPETITOR_STRATEGY = 'competitor_strategy',
  AUDIENCE_SENTIMENT = 'audience_sentiment',
  TREND_PREDICTION = 'trend_prediction',
}

@Entity('insights')
@Index(['analysisId', 'insightType'])
export class Insight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  analysisId: string;

  @Column({
    type: 'enum',
    enum: InsightType,
  })
  insightType: InsightType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'float', default: 0.5 })
  confidenceScore: number;

  @Column({ type: 'boolean', default: true })
  actionable: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Analysis, (analysis) => analysis.insights, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'analysisId' })
  analysis: Analysis;
}
