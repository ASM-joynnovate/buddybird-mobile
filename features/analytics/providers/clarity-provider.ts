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
  // 세션 화면의 캡처·직렬화가 힙 소진 OOM 을 유발해 화면 단위로 캡처를 멈춘다 (BB-276).
  private sessionReplayPaused = false;

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

    if (!enabled) {
      Clarity.pause();
    } else if (!this.sessionReplayPaused) {
      // 세션 화면에서 캡처가 멈춰 있는 동안에는 consent 허용이 와도 재개하지 않는다.
      Clarity.resume();
    }
  }

  async pauseSessionReplay(): Promise<void> {
    this.sessionReplayPaused = true;

    if (this.initialized && this.enabled) {
      Clarity.pause();
    }
  }

  async resumeSessionReplay(): Promise<void> {
    this.sessionReplayPaused = false;

    // consent-off(enabled=false)면 pause 상태를 유지해야 하므로 재개하지 않는다.
    if (this.initialized && this.enabled) {
      Clarity.resume();
    }
  }

  async recordError(_error: Error, _context?: Record<string, string>): Promise<void> {
    // Clarity는 자체 에러 캡처 미지원. Crashlytics에 위임.
  }
}
