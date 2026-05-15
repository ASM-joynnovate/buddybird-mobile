import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

import { clampEventName, toFirebaseParams } from '../events';

import type { AnalyticsParams, AnalyticsProviderAdapter } from './types';

export class FirebaseProvider implements AnalyticsProviderAdapter {
  readonly name = 'firebase';

  async init(): Promise<void> {
    await analytics().setAnalyticsCollectionEnabled(true);
    await crashlytics().setCrashlyticsCollectionEnabled(true);
  }

  async setUserId(id: string | null): Promise<void> {
    await analytics().setUserId(id);
    await crashlytics().setUserId(id ?? '');
  }

  async setUserProperty(key: string, value: string | null): Promise<void> {
    await analytics().setUserProperty(key, value);

    if (value !== null) {
      await crashlytics().setAttribute(key, value);
    }
  }

  async logEvent(name: string, params: AnalyticsParams): Promise<void> {
    await analytics().logEvent(clampEventName(name), toFirebaseParams(params));
  }

  async setScreen(name: string, screenClass?: string): Promise<void> {
    await analytics().logScreenView({
      screen_name: name,
      screen_class: screenClass ?? name,
    });
  }

  async setEnabled(enabled: boolean): Promise<void> {
    await analytics().setAnalyticsCollectionEnabled(enabled);
    await crashlytics().setCrashlyticsCollectionEnabled(enabled);
  }

  async recordError(error: Error, context?: Record<string, string>): Promise<void> {
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        await crashlytics().setAttribute(key, value);
      }
    }

    await crashlytics().recordError(error);
  }
}
