import { getApp } from '@react-native-firebase/app';
import {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
  setUserId as setAnalyticsUserId,
  setUserProperty,
} from '@react-native-firebase/analytics';
import {
  getCrashlytics,
  recordError,
  setAttribute,
  setCrashlyticsCollectionEnabled,
  setUserId as setCrashlyticsUserId,
} from '@react-native-firebase/crashlytics';

import { clampEventName, toFirebaseParams } from '../events';

import type { AnalyticsParams, AnalyticsProviderAdapter } from './types';

export class FirebaseProvider implements AnalyticsProviderAdapter {
  readonly name = 'firebase';
  readonly supportsErrorReporting = true;

  private readonly analytics = getAnalytics(getApp());
  private readonly crashlytics = getCrashlytics();

  async init(): Promise<void> {
    // Analytics는 ATT 동의 전까지 켜지 않는다(동의 후 setEnabled가 단일 진입점).
    // Crashlytics는 추적이 아닌 안정성 진단이라 전 사용자 대상 항상 활성화한다.
    await setCrashlyticsCollectionEnabled(this.crashlytics, true);
  }

  async setUserId(id: string | null): Promise<void> {
    await setAnalyticsUserId(this.analytics, id);
    await setCrashlyticsUserId(this.crashlytics, id ?? '');
  }

  async setUserProperty(key: string, value: string | null): Promise<void> {
    await setUserProperty(this.analytics, key, value);

    if (value !== null) {
      await setAttribute(this.crashlytics, key, value);
    }
  }

  async logEvent(name: string, params: AnalyticsParams): Promise<void> {
    await logEvent(this.analytics, clampEventName(name), toFirebaseParams(params));
  }

  async setScreen(name: string, screenClass?: string): Promise<void> {
    await logEvent(this.analytics, 'screen_view', {
      screen_name: name,
      screen_class: screenClass ?? name,
    });
  }

  async setEnabled(enabled: boolean): Promise<void> {
    // ATT 동의는 Analytics만 게이트한다. Crashlytics는 거부 시에도 유지(추적 아님).
    await setAnalyticsCollectionEnabled(this.analytics, enabled);
  }

  async recordError(error: Error, context?: Record<string, string>): Promise<void> {
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        await setAttribute(this.crashlytics, key, value);
      }
    }

    recordError(this.crashlytics, error);
  }
}
