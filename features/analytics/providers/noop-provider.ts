import type { AnalyticsParams, AnalyticsProviderAdapter } from './types';

export class NoopProvider implements AnalyticsProviderAdapter {
  readonly name = 'noop';
  readonly supportsErrorReporting = false;

  async init(): Promise<void> {}
  async setUserId(_id: string | null): Promise<void> {}
  async setUserProperty(_key: string, _value: string | null): Promise<void> {}
  async logEvent(_name: string, _params: AnalyticsParams): Promise<void> {}
  async setScreen(_name: string, _screenClass?: string): Promise<void> {}
  async setEnabled(_enabled: boolean): Promise<void> {}
  async recordError(_error: Error, _context?: Record<string, string>): Promise<void> {}
}
