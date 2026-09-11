import { AppState } from 'react-native';
import { AppOpenTracker } from '@/components/app/app-open-tracker';
import { OnboardingAbandonTracker } from '@/components/onboarding/onboarding-abandon-tracker';
import { analyticsOutboxStore } from '../event-outbox';
import { createElement, useEffect, type ReactElement } from 'react';

import { AnalyticsProvider, useAnalytics } from '../analytics-context';
import { ProfileProvider, useProfile } from '@/features/profile/profile-context';
import { loadStoredProfile, saveStoredProfile } from '@/features/profile/profile-storage';
import type { ParrotProfile } from '@/features/profile/profile-types';
import { FirebaseProvider } from '../providers/firebase-provider';
import { ensureTrackingConsent } from '../consent';

jest.mock('react-native', () => ({ Platform: { OS: 'android' }, AppState: { currentState: 'active', addEventListener: jest.fn(() => ({ remove: jest.fn() })) } }));
jest.mock('expo-router', () => ({ usePathname: () => '/onboarding' }));
jest.mock('@/features/auth/auth-context', () => ({ useOptionalAuth: () => ({ uid: 'uid', isInitializing: false }) }));
jest.mock('@/features/auth/auth-identity', () => ({ getCurrentUid: () => 'uid' }));
jest.mock('@/features/shared/expo-extra', () => ({ readExtraString: () => null }));
jest.mock('@/features/profile/profile-storage', () => ({ loadStoredProfile: jest.fn(), saveStoredProfile: jest.fn() }));
jest.mock('../event-outbox', () => ({ analyticsOutboxStore: { load: jest.fn(async () => []), write: jest.fn(async () => {}) } }));
jest.mock('../word-metrics-storage', () => ({ applySessionDeltas: jest.fn() }));
jest.mock('../consent', () => ({ ensureTrackingConsent: jest.fn(), consentAllowsCollection: (value: string) => value === 'granted' }));
jest.mock('../providers/clarity-provider', () => ({ ClarityProvider: jest.fn() }));
jest.mock('../providers/firebase-provider', () => ({ FirebaseProvider: jest.fn() }));

const { act, create } = jest.requireActual<{
  act: (callback: () => void | Promise<void>) => Promise<void>;
  create: (element: ReactElement) => { update: (element: ReactElement) => void; unmount: () => void };
}>('react-test-renderer');

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

let api: { analytics: ReturnType<typeof useAnalytics>; profile: ReturnType<typeof useProfile> };
function Probe({ screen }: { screen: string }) {
  const analytics = useAnalytics();
  api = { analytics, profile: useProfile() };
  useEffect(() => { analytics.setScreen(screen); }, [analytics.setScreen, screen]);
  return null;
}
const tree = (screen = 'home', lifecycle = false) => createElement(AnalyticsProvider, null,
  createElement(ProfileProvider, null, createElement(Probe, { screen }),
    lifecycle ? createElement(AppOpenTracker) : null, lifecycle ? createElement(OnboardingAbandonTracker) : null));
const profile = (species: string): ParrotProfile => ({
  id: 'p1', name: 'Bird', species, birthDate: null,
  createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
});

let properties: Record<string, string | null>;
let events: { name: string; species: string | null | undefined }[];
const adapter = {
  name: 'firebase', supportsErrorReporting: true,
  init: jest.fn(async () => {}), setEnabled: jest.fn(async () => {}),
  setUserId: jest.fn(async () => {}),
  setUserProperty: jest.fn(async (key: string, value: string | null) => { properties[key] = value; }),
  logEvent: jest.fn(async (name: string) => { events.push({ name, species: properties.parrot_species }); }),
  setScreen: jest.fn(async () => { events.push({ name: 'screen_view', species: properties.parrot_species }); }),
  recordError: jest.fn(async () => {}),
  pauseSessionReplay: jest.fn(async () => {}), resumeSessionReplay: jest.fn(async () => {}),
};
const globalRef = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean;
  ErrorUtils: { getGlobalHandler: () => (error: Error, fatal: boolean) => void; setGlobalHandler: (handler: (error: Error, fatal: boolean) => void) => void };
};
const originalErrorUtils = globalRef.ErrorUtils;
let handler: (error: Error, fatal: boolean) => void;
let originalHandler: typeof handler;
let renderer: ReturnType<typeof create> | undefined;

beforeEach(() => {
  jest.clearAllMocks();
  properties = {};
  events = [];
  globalRef.IS_REACT_ACT_ENVIRONMENT = true;
  originalHandler = jest.fn();
  handler = originalHandler;
  globalRef.ErrorUtils = { getGlobalHandler: () => handler, setGlobalHandler: (next) => { handler = next; } };
  jest.mocked(FirebaseProvider).mockImplementation(() => adapter as unknown as FirebaseProvider);
  jest.mocked(ensureTrackingConsent).mockResolvedValue('granted');
  jest.mocked(saveStoredProfile).mockResolvedValue(undefined);
});

afterEach(async () => {
  if (renderer) await act(async () => renderer!.unmount());
  renderer = undefined;
  globalRef.ErrorUtils = originalErrorUtils;
});

it('waits for profile restore without clearing species or delaying global error reporting', async () => {
  const stored = deferred<ParrotProfile | null>();
  jest.mocked(loadStoredProfile).mockReturnValue(stored.promise);
  await act(async () => { renderer = create(tree()); });
  expect(api.analytics.isReady).toBe(false);
  expect(adapter.setUserProperty).not.toHaveBeenCalled();
  expect(events).toEqual([]);
  await act(async () => { handler(new Error('early error'), false); });
  expect(adapter.recordError).toHaveBeenCalledTimes(1);
  expect(events).toEqual([]);
  await act(async () => { stored.resolve(profile('budgie')); });
  expect(events).toEqual([
    { name: 'screen_view', species: 'budgie' },
    { name: 'app_error', species: 'budgie' },
  ]);
});

it('applies edited species before its event and avoids property writes on screen changes', async () => {
  jest.mocked(loadStoredProfile).mockResolvedValue(profile('budgie'));
  await act(async () => { renderer = create(tree()); });
  adapter.setUserProperty.mockClear();
  for (const screen of ['words', 'profile', 'home']) {
    await act(async () => { renderer!.update(tree(screen)); });
  }
  expect(adapter.setUserProperty).not.toHaveBeenCalled();
  expect(events.filter((event) => event.name === 'screen_view')).toHaveLength(4);
  await act(async () => { await api.profile.updateProfile(profile('cockatiel')); });
  expect(events.at(-1)).toEqual({ name: 'profile_updated', species: 'cockatiel' });
});

it('applies a new profile before creation events without making save wait for analytics', async () => {
  jest.mocked(loadStoredProfile).mockResolvedValue(null);
  await act(async () => { renderer = create(tree()); });
  const applied = deferred<void>();
  adapter.setUserProperty.mockImplementationOnce(() => applied.promise);
  await act(async () => {
    await api.profile.saveProfile(profile('budgie'));
    api.analytics.track({ name: 'profile_created', params: { parrot_name: 'Bird', parrot_species: 'budgie' } });
  });
  expect(api.profile.profile?.species).toBe('budgie');
  expect(events.some((event) => event.name === 'profile_created')).toBe(false);
  await act(async () => { applied.resolve(); });
  expect(events.at(-1)).toEqual({ name: 'profile_created', species: 'budgie' });
});

it('does not install global handlers after unmount during initialization', async () => {
  const initialized = deferred<void>();
  adapter.init.mockImplementationOnce(() => initialized.promise);
  jest.mocked(loadStoredProfile).mockResolvedValue(null);
  await act(async () => { renderer = create(tree()); });
  await act(async () => { renderer!.unmount(); });
  renderer = undefined;
  expect(handler).toBe(originalHandler);
  await act(async () => { initialized.resolve(); });
  expect(handler).toBe(originalHandler);
  expect(adapter.setEnabled).not.toHaveBeenCalled();
});


it('retains events when consent lookup fails and recovers on foreground', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.mocked(ensureTrackingConsent).mockRejectedValueOnce(new Error('storage unavailable'));
  jest.mocked(loadStoredProfile).mockResolvedValue(profile('B'));
  await act(async () => { renderer = create(tree()); });
  expect(events).toEqual([]);
  expect(api.analytics.consent).toBe('unknown');
  expect(jest.mocked(analyticsOutboxStore.write).mock.calls.flatMap(([, deleted]) => deleted)).toEqual([]);
  await act(async () => {
    for (const [, listener] of jest.mocked(AppState.addEventListener).mock.calls) listener('active');
  });
  expect(events).toEqual([{ name: 'screen_view', species: 'B' }]);
  warning.mockRestore();
});

it('records app and onboarding lifecycle events while SDK initialization is pending', async () => {
  const initialized = deferred<void>();
  adapter.init.mockImplementationOnce(() => initialized.promise);
  jest.mocked(loadStoredProfile).mockResolvedValue(null);
  await act(async () => { renderer = create(tree('welcome', true)); });
  await act(async () => {
    for (const [, listener] of jest.mocked(AppState.addEventListener).mock.calls) listener('background');
  });
  expect(events).toEqual([]);
  const recorded = jest.mocked(analyticsOutboxStore.write).mock.calls.flatMap(([entries]) =>
    entries.flatMap((entry) => entry.command.kind === 'event' ? [entry.command.name] : []));
  expect(recorded).toEqual(expect.arrayContaining(['app_open', 'app_background', 'onboarding_abandoned']));
  await act(async () => { initialized.resolve(); });
  expect(events.map((event) => event.name)).toEqual(['screen_view', 'app_open', 'app_background', 'onboarding_abandoned']);
});
