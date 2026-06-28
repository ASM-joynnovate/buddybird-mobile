import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform, type AppStateStatus } from 'react-native';

export const CONSENT_STORAGE_KEY = '@buddybird/analytics-consent';

export type ConsentState = 'unknown' | 'granted' | 'denied' | 'not_applicable';

export class ConsentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConsentError';
  }
}

export async function persistConsent(state: ConsentState): Promise<void> {
  await AsyncStorage.setItem(CONSENT_STORAGE_KEY, state);
}

export async function ensureTrackingConsent(): Promise<ConsentState> {
  if (Platform.OS !== 'ios') {
    const state: ConsentState = 'not_applicable';
    await persistConsent(state);
    return state;
  }

  const { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } = await import(
    'expo-tracking-transparency'
  );
  const current = await getTrackingPermissionsAsync();
  const resolvedCurrent = mapStatus(current.status);

  if (resolvedCurrent !== 'unknown') {
    await persistConsent(resolvedCurrent);
    return resolvedCurrent;
  }

  // iOS는 앱 scene이 active가 아니면 ATT 다이얼로그를 표시하지 않고 completion을 즉시
  // 호출한다(UI 없음). cold launch 시 splash 해제와 경합하므로 request 전에 active를 보장한다.
  await waitForActiveState();
  const requested = await requestTrackingPermissionsAsync();
  const resolved = mapStatus(requested.status);
  await persistConsent(resolved === 'unknown' ? 'denied' : resolved);
  return resolved === 'unknown' ? 'denied' : resolved;
}

export function consentAllowsCollection(state: ConsentState): boolean {
  return state === 'granted' || state === 'not_applicable';
}

/**
 * AppState가 'active'가 될 때까지 기다린다(이미 active면 즉시 resolve). ATT 프롬프트는
 * scene이 active일 때만 노출되므로 request 직전 게이트로 사용한다. 단일 caller
 * (ensureTrackingConsent) 전용이라 shared로 추출하지 않는다(SHARED-MODULES §1).
 */
function waitForActiveState(): Promise<void> {
  if (AppState.currentState === 'active') {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active') {
        subscription.remove();
        resolve();
      }
    });
  });
}

function mapStatus(status: string): ConsentState {
  if (status === 'granted') {
    return 'granted';
  }

  if (status === 'denied') {
    return 'denied';
  }

  return 'unknown';
}
