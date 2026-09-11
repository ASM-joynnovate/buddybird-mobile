import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyticsOutboxStore, parseAnalyticsOutbox, type AnalyticsOutboxEntry } from '../event-outbox';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('../error-reporter', () => ({ reportError: jest.fn() }));
jest.mock('@/features/audio/audio-file-storage', () => ({ hydrateAudioUriFields: jest.fn(), normalizeAudioUriFields: jest.fn() }));

const event: AnalyticsOutboxEntry = {
  id: 'event-1', occurredAt: 1000, order: 1, userId: 'uid-A', command: { kind: 'event', name: 'app_foreground', params: {} },
  properties: { parrot_species: 'A' }, delivered: ['firebase'],
};

it('restores ordered events with their property snapshots and delivery receipts', () => {
  const next = { ...event, id: 'event-2', properties: { parrot_species: 'B' }, delivered: [] };
  expect(parseAnalyticsOutbox(JSON.parse(JSON.stringify([event, next])))).toEqual([event, next]);
});

it.each([{}, [{ ...event, properties: { parrot_species: 123 } }], [event, event], [{ ...event, command: { kind: 'unknown' } }]])(
  'rejects invalid storage instead of overwriting it with an empty queue', (raw) => {
    expect(() => parseAnalyticsOutbox(raw)).toThrow();
  },
);

it('discards unrecoverable promise reservations while preserving ready events', () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  expect(parseAnalyticsOutbox([{ ...event, id: 'unfinished', command: { kind: 'preparing' } }, event])).toEqual([event]);
  expect(warning).toHaveBeenCalledTimes(1);
  warning.mockRestore();
});


it('stores only changed entries and loads them in occurrence order', async () => {
  await AsyncStorage.clear();
  const second = { ...event, id: 'event-2', order: 2, properties: { parrot_species: 'B' } };
  await analyticsOutboxStore.write([second, event], []);
  expect(await analyticsOutboxStore.load()).toEqual([event, second]);
  await analyticsOutboxStore.write([{ ...event, delivered: ['firebase', 'clarity'] }], []);
  expect((await analyticsOutboxStore.load())[1]).toEqual(second);
  await analyticsOutboxStore.write([], [event.id]);
  expect(await analyticsOutboxStore.load()).toEqual([second]);
});

it('recovers a confirmed start before its stop when metrics preparation was interrupted', async () => {
  jest.useFakeTimers();
  await AsyncStorage.clear();
  const { createFanoutAnalyticsClient } = jest.requireActual<typeof import('../client')>('../client');
  const { NoopProvider } = jest.requireActual<typeof import('../providers/noop-provider')>('../providers/noop-provider');
  const first = createFanoutAnalyticsClient({ providers: [new NoopProvider()], outboxStore: analyticsOutboxStore });
  first.initializeUserProperties({ parrot_species: 'A' });
  await first.startCollection(true, () => 'uid-A');
  void first.logEvent(new Promise<import('../events').AnalyticsEvent>(() => {}), Promise.resolve({
    name: 'word_practice_started', params: { session_id: 's1', word_id: 'w1', word_name: 'Hello' },
  }));
  void first.logEvent({ name: 'training_session_abandoned', params: {
    session_id: 's1', duration_ms: 1000, progress_percent: 1, last_word_id: 'w1', last_word_name: 'Hello',
  } });
  await jest.advanceTimersByTimeAsync(0);
  first.dispose();
  const provider = new NoopProvider();
  const received = jest.spyOn(provider, 'logEvent');
  const second = createFanoutAnalyticsClient({ providers: [provider], outboxStore: analyticsOutboxStore });
  try {
    second.initializeUserProperties({ parrot_species: 'B' });
    void second.startCollection(true, () => 'uid-B');
    await second.logEvent({ name: 'app_foreground', params: {} });
    expect(received.mock.calls.map(([name]) => name)).toEqual([
      'word_practice_started', 'training_session_abandoned', 'app_foreground',
    ]);
    expect(received.mock.calls[0][1]).toMatchObject({ session_id: 's1', client_event_recovered: true });
    expect(received.mock.calls[0][1]).not.toHaveProperty('attempt_number');
  } finally {
    second.dispose();
    jest.useRealTimers();
  }
});

it('does not finish a failed write batch while another old write is still pending', async () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  jest.mocked(AsyncStorage.setItem).mockImplementationOnce(async () => { await gate; });
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('second write failed'));
  let finished = false;
  const pending = analyticsOutboxStore.write([event, { ...event, id: 'second', order: 2 }], []).catch(() => { finished = true; });
  for (let tick = 0; tick < 20; tick += 1) await Promise.resolve();
  expect(finished).toBe(false);
  release();
  await pending;
  expect(finished).toBe(true);
});
