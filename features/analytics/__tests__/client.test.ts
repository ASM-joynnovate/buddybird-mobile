import { createFanoutAnalyticsClient } from '../client';
import { registerEventTracker, trackEvent } from '../event-tracker';
import type { AnalyticsEvent } from '../events';
import type { AnalyticsProviderAdapter } from '../providers/types';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

function fixture() {
  const properties: Record<string, string | null> = {};
  const received: { name: string; species: string | null | undefined }[] = [];
  const provider: AnalyticsProviderAdapter = {
    name: 'test', supportsErrorReporting: true,
    init: jest.fn(async () => {}),
    setEnabled: jest.fn(async () => {}),
    setUserId: jest.fn(async () => {}),
    setUserProperty: jest.fn(async (key, value) => { properties[key] = value; }),
    logEvent: jest.fn(async (name) => { received.push({ name, species: properties.parrot_species }); }),
    setScreen: jest.fn(async () => { received.push({ name: 'screen_view', species: properties.parrot_species }); }),
    recordError: jest.fn(async () => {}),
    pauseSessionReplay: jest.fn(async () => {}), resumeSessionReplay: jest.fn(async () => {}),
  };
  return { provider, received, client: createFanoutAnalyticsClient({ providers: [provider] }) };
}

const foreground: AnalyticsEvent = { name: 'app_foreground', params: {} };

it.each(['profile-first', 'sdk-first'])('waits for initial properties with %s', async (order) => {
  const { client, provider, received } = fixture();
  const screen = client.setScreen('home');
  if (order === 'profile-first') client.initializeUserProperties({ parrot_species: 'budgie' });
  await client.init();
  const started = client.startCollection(true, () => 'uid');
  if (order === 'sdk-first') {
    await Promise.resolve();
    expect(provider.logEvent).not.toHaveBeenCalled();
    expect(provider.setScreen).not.toHaveBeenCalled();
    client.initializeUserProperties({ parrot_species: 'budgie' });
  }
  await started;
  await screen;
  expect(received).toEqual([{ name: 'screen_view', species: 'budgie' }]);
  expect(provider.setUserId).toHaveBeenCalledWith('uid');
});

it('serializes property updates with events without rewriting earlier events', async () => {
  const { client, received } = fixture();
  client.initializeUserProperties({ parrot_species: 'budgie' });
  const before = client.logEvent(foreground);
  const change = client.setUserProperties({ parrot_species: 'cockatiel' });
  const after = client.setScreen('profile');
  await client.startCollection(true, () => null);
  await Promise.all([before, change, after]);
  expect(received).toEqual([
    { name: 'app_foreground', species: 'budgie' },
    { name: 'screen_view', species: 'cockatiel' },
  ]);
});

it('waits for native property completion before subsequent events', async () => {
  const { client, provider } = fixture();
  client.initializeUserProperties({});
  await client.startCollection(true, () => null);
  const gate = deferred<void>();
  jest.mocked(provider.setUserProperty).mockImplementationOnce(() => gate.promise);
  const update = client.setUserProperty('parrot_species', 'budgie');
  const event = client.logEvent(foreground);
  await Promise.resolve();
  expect(provider.logEvent).not.toHaveBeenCalled();
  gate.resolve();
  await Promise.all([update, event]);
  expect(provider.logEvent).toHaveBeenCalledTimes(1);
});

it('preserves a deferred start before later events and does not block error reporting', async () => {
  const { client, provider, received } = fixture();
  client.initializeUserProperties({});
  await client.startCollection(true, () => null);
  const gate = deferred<AnalyticsEvent>();
  const first = client.logEvent(gate.promise);
  const second = client.logEvent(foreground);
  await client.recordError(new Error('native failure'));
  expect(provider.recordError).toHaveBeenCalledTimes(1);
  expect(received).toEqual([]);
  gate.resolve({ name: 'app_open', params: { cold_start: true } });
  await Promise.all([first, second]);
  expect(received.map((event) => event.name)).toEqual(['app_open', 'app_foreground']);
});

it('drops denied events without waiting for profile or deferred payloads', async () => {
  const { client, provider } = fixture();
  const pending = client.logEvent(deferred<AnalyticsEvent>().promise);
  await client.startCollection(false, () => null);
  await pending;
  await client.logEvent(foreground);
  expect(provider.logEvent).not.toHaveBeenCalled();
  expect(provider.setEnabled).toHaveBeenCalledWith(false);
});

it('continues after a failed deferred payload', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const { client, received } = fixture();
  const gate = deferred<AnalyticsEvent>();
  const failed = client.logEvent(gate.promise);
  gate.reject(new Error('read failed'));
  client.initializeUserProperties({});
  await client.startCollection(true, () => null);
  await failed;
  await client.logEvent(foreground);
  expect(received.map((event) => event.name)).toEqual(['app_foreground']);
  expect(warning).toHaveBeenCalled();
  warning.mockRestore();
});

it('bounds pending events while preserving later property changes', async () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const { client, received, provider } = fixture();
  const events = Array.from({ length: 201 }, () => client.logEvent(foreground));
  const update = client.setUserProperties({ parrot_species: 'cockatiel' });
  client.initializeUserProperties({ parrot_species: 'budgie' });
  await client.startCollection(true, () => null);
  await Promise.all([...events, update]);
  expect(received).toHaveLength(200);
  expect(provider.setUserProperty).toHaveBeenLastCalledWith('parrot_species', 'cockatiel');
  expect(warning).toHaveBeenCalledTimes(1);
  warning.mockRestore();
});

it('routes module events through the same startup queue, including pre-registration events', async () => {
  const { client, received } = fixture();
  trackEvent(foreground);
  const unregister = registerEventTracker(client);
  trackEvent({ name: 'app_background', params: { session_duration_ms: 1 } });
  expect(received).toEqual([]);
  client.initializeUserProperties({ parrot_species: 'budgie' });
  await client.startCollection(true, () => null);
  await client.logEvent(foreground);
  unregister();
  expect(received.map((event) => event.name)).toEqual(['app_foreground', 'app_background', 'app_foreground']);
  expect(received.every((event) => event.species === 'budgie')).toBe(true);
});

it('continues applying species after an unrelated property fails', async () => {
  const { client, provider, received } = fixture();
  jest.mocked(provider.setUserProperty).mockRejectedValueOnce(new Error('name failed'));
  client.initializeUserProperties({ parrot_name: 'Bird', parrot_species: 'budgie' });
  await client.startCollection(true, () => null);
  await client.logEvent(foreground);
  expect(received).toEqual([{ name: 'app_foreground', species: 'budgie' }]);
});

it('uses the UID restored during initial property application for the first event', async () => {
  const { client, provider } = fixture();
  const gate = deferred<void>();
  let uid: string | null = null;
  jest.mocked(provider.setUserProperty).mockImplementationOnce(() => gate.promise);
  client.initializeUserProperties({ parrot_species: 'budgie' });
  const start = client.startCollection(true, () => uid);
  const event = client.logEvent(foreground);
  await Promise.resolve();
  uid = 'restored-uid';
  gate.resolve();
  await start;
  await event;
  expect(provider.setUserId).toHaveBeenLastCalledWith('restored-uid');
  expect(jest.mocked(provider.setUserId).mock.invocationCallOrder.at(-1))
    .toBeLessThan(jest.mocked(provider.logEvent).mock.invocationCallOrder[0]);
});

it('refreshes a late offline UID before dispatching an event', async () => {
  const { client, provider } = fixture();
  let uid: string | null = null;
  client.initializeUserProperties({});
  await client.startCollection(true, () => uid);
  uid = 'online-uid';
  await client.logEvent(foreground);
  expect(provider.setUserId).toHaveBeenLastCalledWith('online-uid');
  expect(jest.mocked(provider.setUserId).mock.invocationCallOrder.at(-1))
    .toBeLessThan(jest.mocked(provider.logEvent).mock.invocationCallOrder[0]);
});

it('releases a cancelled start reservation without sending it', async () => {
  const { client, received } = fixture();
  client.initializeUserProperties({});
  await client.startCollection(true, () => null);
  const prepared = deferred<AnalyticsEvent | null>();
  const cancelled = client.logEvent(prepared.promise);
  const next = client.logEvent(foreground);
  prepared.resolve(null);
  await Promise.all([cancelled, next]);
  expect(received.map((event) => event.name)).toEqual(['app_foreground']);
});
