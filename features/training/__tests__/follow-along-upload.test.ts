// flush 오케스트레이터(requestCaptureFlush)의 시나리오 테스트 — I/O 협력자(스토어·클라이언트·
// 게이트 입력)는 mock, 판정 모듈(gate·batch·response·meta)은 실제 구현을 쓴다. 큐는 Map 으로
// 시뮬레이션해 deleteCaptures 가 실제로 줄여야 루프가 종료된다 (무한 루프 회귀 감지).
// halt 플래그는 모듈 상태로 남지만 비-누적 트리거가 풀므로 각 테스트는 자급자족한다.

import { reportError } from '@/features/analytics/error-reporter';
import { recordingFileExists } from '@/features/audio/audio-file-storage';
import { getCurrentUid } from '@/features/auth/auth-identity';
import { loadStoredProfile } from '@/features/profile/profile-storage';
import type { ParrotProfile } from '@/features/profile/profile-types';
import { readExtraString } from '@/features/shared/expo-extra';
import { loadUploadConsent } from '@/features/upload-consent/upload-consent-storage';

import type { CaptureRegistrationMeta } from '../follow-along-capture-meta';
import { applyCaptureMeta, deleteCaptures, loadFollowAlongCaptures } from '../follow-along-capture-storage';
import type { FollowAlongCapture } from '../follow-along-capture-types';
import { sendCaptureBatch } from '../follow-along-upload-client';
import { requestCaptureFlush } from '../follow-along-upload';
import { loadTrainingStore } from '../training-storage';
import type { TrainingStore, TrainingWord } from '../training-types';

jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.2.3' }));
jest.mock('@/features/analytics/error-reporter', () => ({ reportError: jest.fn() }));
jest.mock('@/features/audio/audio-file-storage', () => ({ recordingFileExists: jest.fn() }));
jest.mock('@/features/auth/auth-identity', () => ({ getCurrentUid: jest.fn() }));
jest.mock('@/features/profile/profile-storage', () => ({ loadStoredProfile: jest.fn() }));
jest.mock('@/features/shared/expo-extra', () => ({ readExtraString: jest.fn() }));
jest.mock('@/features/upload-consent/upload-consent-storage', () => ({ loadUploadConsent: jest.fn() }));
jest.mock('../follow-along-capture-storage', () => ({
  loadFollowAlongCaptures: jest.fn(),
  deleteCaptures: jest.fn(),
  applyCaptureMeta: jest.fn(),
}));
jest.mock('../follow-along-upload-client', () => ({
  cleanupCaptureUploadArtifacts: jest.fn(),
  sendCaptureBatch: jest.fn(),
}));
jest.mock('../training-storage', () => ({ loadTrainingStore: jest.fn() }));

const sendMock = jest.mocked(sendCaptureBatch);
const applyMetaMock = jest.mocked(applyCaptureMeta);
const deleteMock = jest.mocked(deleteCaptures);
const reportErrorMock = jest.mocked(reportError);

// fire-and-forget 진입점이라 완료를 직접 기다릴 수 없다 — mock 만 쓰는 promise 체인은
// macrotask 경계 하나면 전부 소진된다.
const drainFlush = () => new Promise((resolve) => setTimeout(resolve, 0));

let queue: Map<string, FollowAlongCapture>;

function makeCapture(id: string, overrides: Partial<FollowAlongCapture> = {}): FollowAlongCapture {
  return {
    id,
    sessionId: 'sess_1',
    wordId: 'word-1',
    cycle: 1,
    phase: 'learning',
    capturedAt: '2026-08-01T00:00:00.000Z',
    uri: `recording://session-sess_1-${id}.wav`,
    fileName: `session-sess_1-${id}.wav`,
    segments: [],
    sizeBytes: 1000,
    clientWordId: 'preset-hello',
    parrotSpecies: null,
    parrotBirthdate: null,
    ...overrides,
  };
}

function successBody(ids: readonly string[]): unknown {
  return { data: Object.fromEntries(ids.map((id) => [id, { status: 'success' }])) };
}

beforeEach(() => {
  jest.clearAllMocks();
  queue = new Map();

  jest.mocked(loadUploadConsent).mockResolvedValue({
    status: 'granted',
    decidedAt: '2026-08-01T00:00:00.000Z',
    noticeVersion: 1,
  });
  jest.mocked(getCurrentUid).mockReturnValue('uid-1');
  jest.mocked(readExtraString).mockReturnValue('https://api.test');
  jest.mocked(recordingFileExists).mockReturnValue(true);
  jest.mocked(loadTrainingStore).mockResolvedValue({
    version: 1,
    wordsById: { 'word-1': { id: 'word-1', libraryEntryId: 'wentry-abc' } as TrainingWord },
    recordingsById: {},
    sessionsById: {},
    wordProgressByWordId: {},
    updatedAt: '2026-08-01T00:00:00.000Z',
  } as TrainingStore);
  jest.mocked(loadStoredProfile).mockResolvedValue({
    species: 'cockatiel',
    birthDate: '2024-01-01',
  } as ParrotProfile);

  jest.mocked(loadFollowAlongCaptures).mockImplementation(async () => ({
    capturesById: Object.fromEntries(queue),
  }));
  deleteMock.mockImplementation(async (ids) => {
    ids.forEach((id) => queue.delete(id));
  });
  applyMetaMock.mockImplementation(async (metaById: Record<string, CaptureRegistrationMeta>) => {
    for (const [id, meta] of Object.entries(metaById)) {
      const existing = queue.get(id);
      if (existing) queue.set(id, { ...existing, ...meta });
    }
  });
  sendMock.mockImplementation(async ({ batch }) => {
    const sentIds = batch.map((capture) => capture.id);
    return { http: { status: 200, body: successBody(sentIds) }, sentIds, unreadableIds: [] };
  });
});

describe('requestCaptureFlush', () => {
  it('backfills legacy captures before sending and uploads the substituted word id', async () => {
    queue.set('cap-1', makeCapture('cap-1', {
      clientWordId: undefined,
      parrotSpecies: undefined,
      parrotBirthdate: undefined,
    }));
    queue.set('cap-2', makeCapture('cap-2', {
      capturedAt: '2026-08-01T00:00:01.000Z',
      clientWordId: undefined,
      parrotSpecies: undefined,
      parrotBirthdate: undefined,
    }));

    requestCaptureFlush();
    await drainFlush();

    const expectedMeta: CaptureRegistrationMeta = {
      clientWordId: 'wentry-abc',
      parrotSpecies: 'cockatiel',
      parrotBirthdate: '2024-01-01',
    };
    expect(applyMetaMock).toHaveBeenCalledTimes(1);
    expect(applyMetaMock.mock.calls[0][0]).toEqual({ 'cap-1': expectedMeta, 'cap-2': expectedMeta });
    // 영속화가 전송보다 선행해야 한다 — 전송이 실패해도 백필은 남는 설계 (결정 ③).
    expect(applyMetaMock.mock.invocationCallOrder[0]).toBeLessThan(sendMock.mock.invocationCallOrder[0]);
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0].metadata.map((item) => item.client_word_id)).toEqual([
      'wentry-abc',
      'wentry-abc',
    ]);
    expect(queue.size).toBe(0);
  });

  it('splits a 4xx batch into single resends and discards only the rejected capture', async () => {
    for (let i = 0; i < 10; i += 1) {
      queue.set(`cap-${i}`, makeCapture(`cap-${i}`, { capturedAt: `2026-08-01T00:00:0${i}.000Z` }));
    }
    sendMock.mockImplementation(async ({ batch }) => {
      const sentIds = batch.map((capture) => capture.id);
      if (batch.length > 1 || batch[0].id === 'cap-3') {
        return { http: { status: 400, body: null }, sentIds, unreadableIds: [] };
      }
      return { http: { status: 200, body: successBody(sentIds) }, sentIds, unreadableIds: [] };
    });

    requestCaptureFlush();
    await drainFlush();

    // 배치 1회(400) + 단건 10회 — capturedAt 오래된 순으로 재전송된다.
    expect(sendMock).toHaveBeenCalledTimes(11);
    expect(sendMock.mock.calls[0][0].batch).toHaveLength(10);
    expect(sendMock.mock.calls.slice(1).map((call) => call[0].batch[0].id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `cap-${i}`),
    );
    expect(reportErrorMock).toHaveBeenCalledTimes(1);
    expect(reportErrorMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({ message: expect.stringContaining('cap-3') }),
    );
    expect(reportErrorMock.mock.calls[0][1]).toEqual({ scope: 'training.captureFlush.discard' });
    expect(queue.size).toBe(0);
  });

  it('suppresses accumulation retries after a transient halt until another trigger arrives', async () => {
    queue.set('cap-1', makeCapture('cap-1'));
    sendMock.mockImplementation(async ({ batch }) => ({
      http: { status: null, body: null },
      sentIds: batch.map((capture) => capture.id),
      unreadableIds: [],
    }));

    requestCaptureFlush();
    await drainFlush();
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(queue.size).toBe(1);

    // halt 가 선 상태의 누적 트리거(①)는 no-op — 같은 배치의 재압축·재전송 낭비 방지.
    requestCaptureFlush({ fromAccumulation: true });
    await drainFlush();
    expect(sendMock).toHaveBeenCalledTimes(1);

    // 비-누적 트리거(②~⑤)는 상황 변화 신호 — 억제를 풀고 재시도한다. 클립은 큐에 남아 있다.
    requestCaptureFlush();
    await drainFlush();
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(queue.size).toBe(1);
  });
});
