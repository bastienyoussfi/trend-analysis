import { Injectable, Inject } from '@nestjs/common';
import { PlatformStrategy } from './interfaces/platform-strategy.interface';
import { PlatformType } from '../entities/trend.entity';

@Injectable()
export class PlatformFactoryService {
  private platforms: Map<PlatformType, PlatformStrategy>;

  constructor(@Inject('PLATFORM_STRATEGIES') strategies: PlatformStrategy[]) {
    this.platforms = new Map();
    strategies.forEach((strategy) => {
      this.platforms.set(strategy.getPlatformName(), strategy);
    });
  }

  /**
   * Get a platform strategy by name
   */
  getStrategy(platformName: PlatformType): PlatformStrategy {
    if (!this.platforms.has(platformName)) {
      const availablePlatforms = Array.from(this.platforms.keys()).join(', ');
      throw new Error(
        `Platform '${platformName}' not found. Available platforms: ${availablePlatforms}`,
      );
    }

    return this.platforms.get(platformName);
  }

  /**
   * Get multiple platform strategies
   */
  getStrategies(platformNames: PlatformType[]): PlatformStrategy[] {
    return platformNames.map((name) => this.getStrategy(name));
  }

  /**
   * Get all available platform names
   */
  getAvailablePlatforms(): PlatformType[] {
    return Array.from(this.platforms.keys());
  }

  /**
   * Check if a platform is available
   */
  hasPlatform(platformName: PlatformType): boolean {
    return this.platforms.has(platformName);
  }
}
