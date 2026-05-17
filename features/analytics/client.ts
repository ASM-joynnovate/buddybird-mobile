import type { AnalyticsEvent } from './events';
import type { AnalyticsProviderAdapter } from './providers/types';

export interface AnalyticsClient {
  init(): Promise<void>;
  setUserId(id: string | null): Promise<void>;
  setUserProperty(key: string, value: string | null): Promise<void>;
  logEvent<E extends AnalyticsEvent>(event: E): Promise<void>;
  setScreen(name: string, screenClass?: string): Promise<void>;
  setEnabled(enabled: boolean): Promise<void>;
  recordError(error: Error, context?: Record<string, string>): Promise<void>;
}

export type ProviderFailureReporter = (providerName: string, operation: string, error: unknown) => void;

interface FanoutClientOptions {
  providers: readonly AnalyticsProviderAdapter[];
  onProviderFailure?: ProviderFailureReporter;
}

export function createFanoutAnalyticsClient(options: FanoutClientOptions): AnalyticsClient {
  const { providers, onProviderFailure } = options;

  async function run(operation: string, action: (provider: AnalyticsProviderAdapter) => Promise<void>): Promise<void> {
    await Promise.all(
      providers.map(async (provider) => {
        try {
          await action(provider);
        } catch (error: unknown) {
          if (onProviderFailure) {
            onProviderFailure(provider.name, operation, error);
          }
        }
      })
    );
  }

  return {
    async init() {
      await run('init', (provider) => provider.init());
    },
    async setUserId(id) {
      await run('setUserId', (provider) => provider.setUserId(id));
    },
    async setUserProperty(key, value) {
      await run('setUserProperty', (provider) => provider.setUserProperty(key, value));
    },
    async logEvent(event) {
      const params = (event.params ?? {}) as Record<string, never>;
      await run('logEvent', (provider) => provider.logEvent(event.name, params));
    },
    async setScreen(name, screenClass) {
      await run('setScreen', (provider) => provider.setScreen(name, screenClass));
    },
    async setEnabled(enabled) {
      await run('setEnabled', (provider) => provider.setEnabled(enabled));
    },
    async recordError(error, context) {
      await run('recordError', (provider) => provider.recordError(error, context));
    },
  };
}
