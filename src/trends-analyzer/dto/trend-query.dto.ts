import { IsString, IsOptional, IsEnum, IsInt, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { PlatformType } from '../entities/trend.entity';

export class TrendQueryDto {
  @IsString()
  topic: string;

  @IsOptional()
  @IsEnum(PlatformType)
  platform?: PlatformType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  @Type(() => Number)
  days?: number = 7;
}

export class ComparePlatformsDto {
  @IsString()
  topic: string;

  @IsArray()
  @IsEnum(PlatformType, { each: true })
  platforms: PlatformType[];
}

export class GetInsightsDto {
  @IsString()
  topic: string;

  @IsOptional()
  @IsEnum(PlatformType)
  platform?: PlatformType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  @Type(() => Number)
  days?: number = 7;
}
