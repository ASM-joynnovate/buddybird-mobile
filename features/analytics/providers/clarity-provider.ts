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

    // native SDK 가 (백그라운드 타임아웃 후 복귀 등으로) 새 세션을 시작할 때 pause
    // 상태가 유지된다는 보장이 없어, 세션 시작 시점마다 목표 상태를 재천명한다 (BB-276).
    Clarity.setOnSessionStartedCallback(() => {
      this.syncCaptureState().catch((err: unknown) => {
        console.warn('[analytics] clarity capture sync on session start failed', err);
      });
    });

    this.initialized = true;
    await this.syncCaptureState();
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
    await this.syncCaptureState();
  }

  async pauseSessionReplay(): Promise<void> {
    this.sessionReplayPaused = true;
    await this.syncCaptureState();
  }

  async resumeSessionReplay(): Promise<void> {
    this.sessionReplayPaused = false;
    await this.syncCaptureState();
  }

  async recordError(_error: Error, _context?: Record<string, string>): Promise<void> {
    // Clarity는 자체 에러 캡처 미지원. Crashlytics에 위임.
  }

  /**
   * 캡처 on/off 의 단일 결정 지점. consent(enabled)와 세션 pause 를 함께 반영해
   * 호출 순서·초기화 시점과 무관하게 native 상태를 목표 상태로 수렴시킨다 —
   * consent-off 상태는 세션 resume 이 뒤집을 수 없다 (BB-276).
   * reject 는 fanout 의 onProviderFailure 로 전파되도록 await 한다.
   */
  private async syncCaptureState(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    const shouldCapture = this.enabled && !this.sessionReplayPaused;

    if (shouldCapture) {
      // resume 은 "이전에 pause 된 경우에만" 재개라, 이미 캡처 중이면 false 를
      // 반환할 수 있어 결과를 경고로 다루지 않는다 (실패해도 크래시 위험 아님).
      await Clarity.resume();
      return;
    }

    const applied = await Clarity.pause();
    if (!applied) {
      // pause 실패는 BB-276 크래시 경로가 살아있다는 뜻 — 침묵시키지 않는다.
      console.warn('[analytics] clarity pause was not applied');
    }
  }
}
