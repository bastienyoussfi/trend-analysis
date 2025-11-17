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
import { PlatformType } from './trend.entity';

@Entity('platform_posts')
@Index(['analysisId', 'platform'])
export class PlatformPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  analysisId: string;

  @Column({
    type: 'enum',
    enum: PlatformType,
  })
  platform: PlatformType;

  @Column({ type: 'varchar', length: 255 })
  postId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  author: string;

  @Column({ type: 'jsonb', nullable: true })
  engagementMetrics: {
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
    engagementRate?: number;
  };

  @Column({ type: 'timestamp' })
  postedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Analysis, (analysis) => analysis.posts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'analysisId' })
  analysis: Analysis;
}
