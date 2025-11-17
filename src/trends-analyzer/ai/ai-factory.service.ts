import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider } from './interfaces/ai-provider.interface';

@Injectable()
export class AIFactoryService {
  private providers: Map<string, AIProvider>;

  constructor(
    @Inject('AI_PROVIDERS') providers: AIProvider[],
    private configService: ConfigService,
  ) {
    this.providers = new Map();
    providers.forEach((provider) => {
      this.providers.set(provider.getProviderName(), provider);
    });
  }

  /**
   * Get an AI provider by name, or return the default provider if none specified
   */
  getProvider(providerName?: string): AIProvider {
    const name = providerName || this.configService.get<string>('app.ai.defaultProvider');

    if (!this.providers.has(name)) {
      const availableProviders = Array.from(this.providers.keys()).join(', ');
      throw new Error(
        `AI Provider '${name}' not found. Available providers: ${availableProviders}`,
      );
    }

    return this.providers.get(name);
  }

  /**
   * Get all available AI provider names
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is available
   */
  hasProvider(providerName: string): boolean {
    return this.providers.has(providerName);
  }
}
