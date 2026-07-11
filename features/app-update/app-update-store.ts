import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

/**
 * 플랫폼별 스토어 페이지를 연다. Android 는 런타임 applicationId 로 `market://` 링크를
 * 구성하고, iOS 는 app.config `extra.iosAppStoreId` 로 `itms-apps://` 링크를 구성한다.
 * 네이티브 스킴이 열리지 않으면 https 웹 URL 로 폴백한다.
 */
export async function openStorePage(): Promise<void> {
  const target = resolveStoreTarget();
  if (!target) {
    console.warn('[app-update.openStorePage]', 'no store target for this platform/config');
    return;
  }

  try {
    const canOpenNative = await Linking.canOpenURL(target.nativeUrl);
    await Linking.openURL(canOpenNative ? target.nativeUrl : target.webUrl);
  } catch (error: unknown) {
    console.warn('[app-update.openStorePage]', error);
  }
}

interface StoreTarget {
  nativeUrl: string;
  webUrl: string;
}

function resolveStoreTarget(): StoreTarget | null {
  if (Platform.OS === 'android') {
    const packageName = Application.applicationId;
    if (!packageName) return null;

    return {
      nativeUrl: `market://details?id=${packageName}`,
      webUrl: `https://play.google.com/store/apps/details?id=${packageName}`,
    };
  }

  if (Platform.OS === 'ios') {
    const appStoreId = readIosAppStoreId();
    if (!appStoreId) return null;

    return {
      nativeUrl: `itms-apps://apps.apple.com/app/id${appStoreId}`,
      webUrl: `https://apps.apple.com/app/id${appStoreId}`,
    };
  }

  return null;
}

function readIosAppStoreId(): string | null {
  const value = Constants.expoConfig?.extra?.iosAppStoreId;
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}
