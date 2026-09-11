import { createFanoutAnalyticsClient, type AnalyticsClient } from '../client';
import type { AnalyticsOutboxEntry, AnalyticsOutboxStore } from '../event-outbox';
import type { AnalyticsProviderAdapter } from '../providers/types';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
function disk() {
  let records: readonly AnalyticsOutboxEntry[] = [];
  const store: AnalyticsOutboxStore = {
    load: jest.fn(async () => clone(records)),
    write: jest.fn(async (changed, removedIds) => {
      const merged = new Map(records.map((entry) => [entry.id, entry]));
      changed.forEach((entry) => merged.set(entry.id, clone(entry)));
      removedIds.forEach((id) => merged.delete(id));
      records = [...merged.values()].sort((a, b) => a.order - b.order);
    }),
  };
  return { store, read: () => records };
}
function adapter(name = 'firebase') {
  const properties: Record<string, string | null> = {};
  let uid: string | null = null;
  const events: { name: string; species: string | null | undefined; uid: string | null }[] = [];
  const provider: AnalyticsProviderAdapter = {
    name, supportsErrorReporting: true,
    init: jest.fn(async () => {}), setEnabled: jest.fn(async () => {}),
    setUserProperty: jest.fn(async (key, value) => { properties[key] = value; }),
    setUserId: jest.fn(async (id) => { uid = id; }),
    logEvent: jest.fn(async (event) => { events.push({ name: event, species: properties.parrot_species, uid }); }),
    setScreen: jest.fn(async () => {}), recordError: jest.fn(async () => {}),
    pauseSessionReplay: jest.fn(async () => {}), resumeSessionReplay: jest.fn(async () => {}),
  };
  return { provider, events, properties, uid: () => uid };
}
const clients: AnalyticsClient[] = [];
function makeClient(store: AnalyticsOutboxStore, ...providers: AnalyticsProviderAdapter[]) {
  const client = createFanoutAnalyticsClient({ providers, outboxStore: store });
  clients.push(client);
  return client;
}
async function settle() { await jest.advanceTimersByTimeAsync(0); }
let warning: jest.SpyInstance;
beforeEach(() => {
  jest.useFakeTimers();
  warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  clients.splice(0).forEach((client) => client.dispose());
  warning.mockRestore();
  jest.useRealTimers();
});

it('retains events across restart with A then B properties and finishes with B', async () => {
  const storage = disk();
  const failed = adapter();
  jest.mocked(failed.provider.init).mockRejectedValue(new Error('SDK unavailable'));
  const first = makeClient(storage.store, failed.provider);
  first.initializeUserProperties({ parrot_species: 'A' });
  void first.startCollection(true, () => 'uid');
  void first.logEvent({ name: 'app_foreground', params: {} });
  void first.setUserProperties({ parrot_species: 'B' });
  void first.logEvent({ name: 'app_background', params: { session_duration_ms: 1 } });
  await settle();
  expect(storage.read().filter((entry) => entry.command.kind === 'event')).toHaveLength(2);
  expect(failed.events).toEqual([]);
  first.dispose();

  const recovered = adapter();
  const second = makeClient(storage.store, recovered.provider);
  second.initializeUserProperties({ parrot_species: 'B' });
  void second.startCollection(true, () => 'uid');
  const current = second.logEvent({ name: 'app_open', params: { cold_start: true } });
  await current;
  await settle();
  expect(recovered.events.map(({ name, species }) => ({ name, species }))).toEqual([
    { name: 'app_foreground', species: 'A' },
    { name: 'app_background', species: 'B' },
    { name: 'app_open', species: 'B' },
  ]);
  expect(recovered.properties.parrot_species).toBe('B');
  expect(storage.read()).toEqual([]);
});

it('does not let delayed A property completion overwrite newer B or C', async () => {
  const storage = disk();
  const sdk = adapter();
  const client = makeClient(storage.store, sdk.provider);
  client.initializeUserProperties({ parrot_species: 'initial' });
  await client.startCollection(true, () => null);
  const gate = deferred<void>();
  jest.mocked(sdk.provider.setUserProperty).mockImplementationOnce(async (key, value) => {
    await gate.promise;
    sdk.properties[key] = value;
  });
  const a = client.setUserProperties({ parrot_species: 'A' });
  const eventA = client.logEvent({ name: 'app_foreground', params: {} });
  await settle();
  const b = client.setUserProperties({ parrot_species: 'B' });
  const eventB = client.logEvent({ name: 'app_open', params: { cold_start: true } });
  const c = client.setUserProperties({ parrot_species: 'C' });
  await settle();
  expect(sdk.events).toEqual([]);
  gate.resolve();
  await Promise.all([a, eventA, b, eventB, c]);
  await settle();
  expect(sdk.events.map((event) => event.species)).toEqual(['A', 'B']);
  expect(sdk.properties.parrot_species).toBe('C');
});

it('restores the latest UID after replaying a stale queued identity update', async () => {
  const storage = disk();
  const failed = adapter();
  jest.mocked(failed.provider.init).mockRejectedValue(new Error('SDK unavailable'));
  const first = makeClient(storage.store, failed.provider);
  first.initializeUserProperties({});
  void first.startCollection(true, () => 'A');
  void first.setUserId('A');
  await settle();
  first.dispose();
  const recovered = adapter();
  const second = makeClient(storage.store, recovered.provider);
  second.initializeUserProperties({});
  await second.startCollection(true, () => 'B');
  await settle();
  expect(recovered.uid()).toBe('B');
});

it('retries only the failed provider after restart', async () => {
  const storage = disk();
  const good = adapter('firebase');
  const bad = adapter('clarity');
  jest.mocked(bad.provider.logEvent).mockRejectedValue(new Error('unavailable'));
  const first = makeClient(storage.store, good.provider, bad.provider);
  first.initializeUserProperties({});
  await first.startCollection(true, () => null);
  void first.logEvent({ name: 'app_foreground', params: {} });
  await settle();
  expect(good.events).toHaveLength(1);
  expect(storage.read()[0].delivered).toEqual(['firebase']);
  first.dispose();
  const second = makeClient(storage.store, good.provider, adapter('clarity').provider);
  second.initializeUserProperties({});
  await second.startCollection(true, () => null);
  await settle();
  expect(good.events).toHaveLength(1);
  expect(storage.read()).toEqual([]);
});

it('preserves a record on SDK failure and retries automatically in order', async () => {
  const storage = disk();
  const sdk = adapter();
  jest.mocked(sdk.provider.logEvent).mockRejectedValueOnce(new Error('temporary failure'));
  const client = makeClient(storage.store, sdk.provider);
  client.initializeUserProperties({});
  await client.startCollection(true, () => null);
  const first = client.logEvent({ name: 'app_foreground', params: {} });
  const second = client.logEvent({ name: 'app_open', params: { cold_start: true } });
  await settle();
  expect(sdk.events).toEqual([]);
  expect(storage.read()).toHaveLength(2);
  await jest.advanceTimersByTimeAsync(1000);
  await Promise.all([first, second]);
  expect(sdk.events.map((event) => event.name)).toEqual(['app_foreground', 'app_open']);
  expect(storage.read()).toEqual([]);
});

it('clears recovered records after consent denial without waiting for SDK initialization', async () => {
  const storage = disk();
  const first = makeClient(storage.store, adapter().provider);
  first.initializeUserProperties({ parrot_species: 'A' });
  void first.logEvent({ name: 'app_foreground', params: {} });
  await settle();
  first.dispose();
  const sdk = adapter();
  jest.mocked(sdk.provider.init).mockReturnValue(deferred<void>().promise);
  const second = makeClient(storage.store, sdk.provider);
  await second.startCollection(false, () => null);
  expect(storage.read()).toEqual([]);
  expect(sdk.events).toEqual([]);
});

it('does not dispatch before durable storage succeeds', async () => {
  const storage = disk();
  const originalWrite = jest.mocked(storage.store.write).getMockImplementation()!;
  jest.mocked(storage.store.write).mockImplementation(async (records) => {
    if (records.some((entry) => entry.command.kind === 'event')) throw new Error('disk unavailable');
  });
  const sdk = adapter();
  const client = makeClient(storage.store, sdk.provider);
  client.initializeUserProperties({});
  await client.startCollection(true, () => null);
  const event = client.logEvent({ name: 'app_foreground', params: {} });
  await settle();
  expect(sdk.events).toEqual([]);
  jest.mocked(storage.store.write).mockImplementation(originalWrite);
  client.retryPending();
  await event;
  expect(sdk.events).toHaveLength(1);
  expect(storage.read()).toEqual([]);
});

it('preserves historical UID A while retaining current UID B after restart', async () => {
  const storage = disk();
  const sdk = adapter();
  jest.mocked(sdk.provider.init).mockRejectedValue(new Error('unavailable'));
  const first = makeClient(storage.store, sdk.provider);
  first.initializeUserProperties({});
  void first.startCollection(true, () => 'A');
  void first.logEvent({ name: 'app_foreground', params: {} });
  await settle();
  first.dispose();
  const recovered = adapter();
  const second = makeClient(storage.store, recovered.provider);
  second.initializeUserProperties({});
  void second.startCollection(true, () => 'B');
  await second.logEvent({ name: 'app_open', params: { cold_start: true } });
  expect(recovered.events.map((event) => event.uid)).toEqual(['A', 'B']);
  expect(recovered.uid()).toBe('B');
});

it('restores latest B even when replaying historical A fails', async () => {
  const storage = disk();
  const failed = adapter();
  jest.mocked(failed.provider.init).mockRejectedValue(new Error('unavailable'));
  const first = makeClient(storage.store, failed.provider);
  first.initializeUserProperties({ parrot_species: 'A' });
  void first.startCollection(true, () => 'uid-A');
  void first.logEvent({ name: 'app_foreground', params: {} });
  await settle();
  first.dispose();
  const sdk = adapter();
  jest.mocked(sdk.provider.logEvent).mockRejectedValue(new Error('still unavailable'));
  const second = makeClient(storage.store, sdk.provider);
  second.initializeUserProperties({ parrot_species: 'B' });
  await second.startCollection(true, () => 'uid-B');
  await settle();
  expect(sdk.properties.parrot_species).toBe('B');
  expect(sdk.uid()).toBe('uid-B');
  expect(storage.read()).toHaveLength(1);
});

it('waits for an old instance write before restoring into a new instance', async () => {
  const storage = disk();
  const gate = deferred<void>();
  const originalWrite = jest.mocked(storage.store.write).getMockImplementation()!;
  jest.mocked(storage.store.write).mockImplementationOnce(async (changed, removed) => {
    await gate.promise;
    await originalWrite(changed, removed);
  });
  const first = makeClient(storage.store, adapter().provider);
  first.initializeUserProperties({ parrot_species: 'A' });
  void first.logEvent({ name: 'app_foreground', params: {} });
  void first.logEvent({ name: 'app_background', params: { session_duration_ms: 1 } });
  await settle();
  first.dispose();
  const sdk = adapter();
  const second = makeClient(storage.store, sdk.provider);
  second.initializeUserProperties({ parrot_species: 'B' });
  void second.startCollection(true, () => null);
  const b = second.logEvent({ name: 'app_open', params: { cold_start: true } });
  await settle();
  expect(sdk.events).toEqual([]);
  gate.resolve();
  await b;
  expect(sdk.events.map((event) => event.name)).toEqual(['app_foreground', 'app_background', 'app_open']);
  expect(sdk.events.map((event) => event.species)).toEqual(['A', 'A', 'B']);
  expect(storage.read()).toEqual([]);
});

it('writes changed records instead of repeatedly serializing the whole backlog', async () => {
  const storage = disk();
  const sdk = adapter();
  const client = makeClient(storage.store, sdk.provider);
  client.initializeUserProperties({});
  const events = Array.from({ length: 100 }, () => client.logEvent({ name: 'app_foreground', params: {} }));
  await client.startCollection(true, () => null);
  await Promise.all(events);
  const writtenEntries = jest.mocked(storage.store.write).mock.calls.reduce((total, [records]) => total + records.length, 0);
  expect(writtenEntries).toBeLessThanOrEqual(500);
  expect(sdk.events).toHaveLength(100);
});

it('waits transitively for old SDK mutations while saving new events during replacement', async () => {
  const storage = disk();
  const gate = deferred<void>();
  const native = { species: '' };
  const old = adapter();
  jest.mocked(old.provider.setUserProperty).mockImplementation(async (_key, value) => {
    await gate.promise;
    native.species = value ?? '';
  });
  const first = makeClient(storage.store, old.provider);
  first.initializeUserProperties({ parrot_species: 'A' });
  void first.startCollection(true, () => null);
  await settle();
  makeClient(storage.store, adapter().provider); // A→B→C 교체에서 B는 아직 복원하지 않음.
  const sdk = adapter();
  jest.mocked(sdk.provider.setUserProperty).mockImplementation(async (_key, value) => { native.species = value ?? ''; });
  const third = makeClient(storage.store, sdk.provider);
  third.initializeUserProperties({ parrot_species: 'B' });
  void third.startCollection(true, () => null);
  const current = third.logEvent({ name: 'app_foreground', params: {} });
  await settle();
  expect(sdk.provider.setUserProperty).not.toHaveBeenCalled();
  expect(storage.read().some((entry) => entry.command.kind === 'event')).toBe(true);
  gate.resolve();
  await current;
  expect(native.species).toBe('B');
});
