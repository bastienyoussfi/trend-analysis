import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';

// Configuration
import databaseConfig from './config/database.config';
import cacheConfig from './config/cache.config';
import appConfig from './config/app.config';

// Modules
import { TrendsAnalyzerModule } from './trends-analyzer/trends-analyzer.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, cacheConfig, appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get('database'),
    }),

    // Cache
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get('cache'),
    }),

    // Scheduler (for future scheduled analysis)
    ScheduleModule.forRoot(),

    // Feature Modules
    TrendsAnalyzerModule,
  ],
})
export class AppModule {}
