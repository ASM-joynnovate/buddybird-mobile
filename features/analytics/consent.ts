import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const CONSENT_STORAGE_KEY = '@buddybird/analytics-consent';

export type ConsentState = 'unknown' | 'granted' | 'denied' | 'not_applicable';

export class ConsentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConsentError';
  }
}

export async function loadStoredConsent(): Promise<ConsentState> {
  const raw = await AsyncStorage.getItem(CONSENT_STORAGE_KEY);

  if (raw === 'granted' || raw === 'denied' || raw === 'not_applicable' || raw === 'unknown') {
    return raw;
  }

  return 'unknown';
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

  const requested = await requestTrackingPermissionsAsync();
  const resolved = mapStatus(requested.status);
  await persistConsent(resolved === 'unknown' ? 'denied' : resolved);
  return resolved === 'unknown' ? 'denied' : resolved;
}

export function consentAllowsCollection(state: ConsentState): boolean {
  return state === 'granted' || state === 'not_applicable';
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
