import { getApp } from '@react-native-firebase/app';
import {
  getAnalytics,
  logEvent,
  logScreenView,
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

  private readonly analytics = getAnalytics(getApp());
  private readonly crashlytics = getCrashlytics();

  async init(): Promise<void> {
    await setAnalyticsCollectionEnabled(this.analytics, true);
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
    await logScreenView(this.analytics, {
      screen_name: name,
      screen_class: screenClass ?? name,
    });
  }

  async setEnabled(enabled: boolean): Promise<void> {
    await setAnalyticsCollectionEnabled(this.analytics, enabled);
    await setCrashlyticsCollectionEnabled(this.crashlytics, enabled);
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
