import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum PlatformType {
  TWITTER = 'twitter',
  INSTAGRAM = 'instagram',
  TIKTOK = 'tiktok',
  LINKEDIN = 'linkedin',
  YOUTUBE = 'youtube',
}

@Entity('trends')
@Index(['topic', 'platform', 'detectedAt'])
export class Trend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  topic: string;

  @Column({
    type: 'enum',
    enum: PlatformType,
  })
  @Index()
  platform: PlatformType;

  @Column({ type: 'int', default: 0 })
  volume: number;

  @Column({ type: 'float', default: 0 })
  trendingScore: number;

  @Column({ type: 'timestamp' })
  @Index()
  detectedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
