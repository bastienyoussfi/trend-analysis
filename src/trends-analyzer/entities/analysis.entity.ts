import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { PlatformPost } from './platform-post.entity';
import { Insight } from './insight.entity';

export enum GrowthTrend {
  RISING = 'rising',
  DECLINING = 'declining',
  STABLE = 'stable',
  VIRAL = 'viral',
}

@Entity('analyses')
@Index(['topic', 'analyzedAt'])
export class Analysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  topic: string;

  @Column({ type: 'simple-array' })
  platforms: string[];

  @Column({ type: 'varchar', length: 100 })
  aiProvider: string;

  @Column({ type: 'text' })
  analysisText: string;

  @Column({ type: 'float', nullable: true })
  sentimentScore: number;

  @Column({
    type: 'enum',
    enum: GrowthTrend,
    nullable: true,
  })
  predictedGrowth: GrowthTrend;

  @Column({ type: 'int', default: 0 })
  tokensUsed: number;

  @Column({ type: 'timestamp' })
  @Index()
  analyzedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => PlatformPost, (post) => post.analysis)
  posts: PlatformPost[];

  @OneToMany(() => Insight, (insight) => insight.analysis)
  insights: Insight[];
}
