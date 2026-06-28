import * as Clarity from '@microsoft/react-native-clarity';

import { clampEventName } from '../events';

import type { AnalyticsParams, AnalyticsProviderAdapter } from './types';

export interface ClarityProviderConfig {
  projectId: string;
  logLevel?: Clarity.LogLevel;
}

export class ClarityProvider implements AnalyticsProviderAdapter {
  readonly name = 'clarity';
  // Clarity는 자체 에러 캡처 미지원 — recordError는 의도된 no-op(아래)이며 Crashlytics에 위임한다.
  readonly supportsErrorReporting = false;
  private readonly config: ClarityProviderConfig;
  private initialized = false;
  private enabled = true;

  constructor(config: ClarityProviderConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    Clarity.initialize(this.config.projectId, {
      logLevel: this.config.logLevel ?? Clarity.LogLevel.None,
    });

    // initialize는 즉시 캡처를 시작하므로 ATT 동의 전까지 일시정지한다.
    // 동의 후 setEnabled(true) → resume()으로 재개(resume은 pause된 경우에만 동작).
    this.enabled = false;
    void Clarity.pause().catch((err: unknown) => {
      console.warn('[analytics.clarity.init]', err);
    });

    this.initialized = true;
  }

  async setUserId(id: string | null): Promise<void> {
    if (!this.initialized || !this.enabled) {
      return;
    }

    if (id !== null) {
      Clarity.setCustomUserId(id);
    }
  }

  async setUserProperty(key: string, value: string | null): Promise<void> {
    if (!this.initialized || !this.enabled || value === null) {
      return;
    }

    Clarity.setCustomTag(key, value);
  }

  async logEvent(name: string, params: AnalyticsParams): Promise<void> {
    if (!this.initialized || !this.enabled) {
      return;
    }

    const safeName = clampEventName(name);
    Clarity.sendCustomEvent(safeName);

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }

      const tagValue = Array.isArray(value) ? value.join(',') : String(value);
      Clarity.setCustomTag(`${safeName}.${key}`, tagValue);
    }
  }

  async setScreen(name: string, _screenClass?: string): Promise<void> {
    if (!this.initialized || !this.enabled) {
      return;
    }

    Clarity.setCurrentScreenName(name);
  }

  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;

    if (!this.initialized) {
      return;
    }

    if (enabled) {
      Clarity.resume();
    } else {
      Clarity.pause();
    }
  }

  async recordError(_error: Error, _context?: Record<string, string>): Promise<void> {
    // Clarity는 자체 에러 캡처 미지원. Crashlytics에 위임.
  }
}
