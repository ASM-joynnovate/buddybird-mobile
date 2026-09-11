import AsyncStorage from '@react-native-async-storage/async-storage';

import { applySessionDeltas, readWordLifetimeMetrics, removeWordMetrics } from '../word-metrics-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
jest.mock('../error-reporter', () => ({ reportError: jest.fn() }));
jest.mock('@/features/audio/audio-file-storage', () => ({ hydrateAudioUriFields: jest.fn(), normalizeAudioUriFields: jest.fn() }));

let disk: string | null;
const delta = { word_id: 'word-1', word_name: 'Hello', practice_duration_ms: 100, recordings_count: 1 };

beforeEach(() => {
  disk = null;
  jest.mocked(AsyncStorage.getItem).mockImplementation(async () => disk);
  jest.mocked(AsyncStorage.setItem).mockImplementation(async (_key, value) => { disk = value; });
});

it('retains both increments from concurrent sessions', async () => {
  await Promise.all([applySessionDeltas([delta]), applySessionDeltas([delta])]);
  expect(await readWordLifetimeMetrics(delta.word_id)).toMatchObject({
    lifetime_practice_count: 2, lifetime_practice_duration_ms: 200, lifetime_recording_count: 2,
  });
});

it('makes the next session read wait for the preceding write', async () => {
  let release!: () => void;
  let writeStarted!: () => void;
  const writing = new Promise<void>((resolve) => { writeStarted = resolve; });
  const gate = new Promise<void>((resolve) => { release = resolve; });
  jest.mocked(AsyncStorage.setItem).mockImplementationOnce(async (_key, value) => {
    writeStarted();
    await gate;
    disk = value;
  });
  const save = applySessionDeltas([delta]);
  await writing;
  let readFinished = false;
  const nextRead = readWordLifetimeMetrics(delta.word_id).then((value) => { readFinished = true; return value; });
  await Promise.resolve();
  expect(readFinished).toBe(false);
  release();
  await save;
  expect(await nextRead).toMatchObject({ lifetime_practice_count: 1 });
});

it('does not restore deleted metrics when an earlier increment is pending', async () => {
  await applySessionDeltas([delta]);
  await Promise.all([applySessionDeltas([delta]), removeWordMetrics(delta.word_id)]);
  expect(await readWordLifetimeMetrics(delta.word_id)).toBeNull();
});

it('allows later operations after a failed write', async () => {
  jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('disk failed'));
  await expect(applySessionDeltas([delta])).rejects.toThrow('disk failed');
  await applySessionDeltas([delta]);
  expect(await readWordLifetimeMetrics(delta.word_id)).toMatchObject({ lifetime_practice_count: 1 });
});
