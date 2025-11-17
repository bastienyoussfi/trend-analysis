import { IsString, IsArray, IsOptional, IsEnum, IsBoolean, IsUrl } from 'class-validator';
import { PlatformType } from '../entities/trend.entity';

export class AnalyzeTrendsDto {
  @IsString()
  topic: string;

  @IsArray()
  @IsEnum(PlatformType, { each: true })
  platforms: PlatformType[];

  @IsOptional()
  @IsString()
  aiProvider?: string;

  @IsOptional()
  @IsBoolean()
  useCache?: boolean;

  @IsOptional()
  @IsUrl()
  webhookUrl?: string;
}
