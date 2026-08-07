// flush 오케스트레이터(requestCaptureFlush)의 시나리오 테스트 — I/O 협력자(스토어·클라이언트·
// 게이트 입력)는 mock, 판정 모듈(gate·batch·response·meta)은 실제 구현을 쓴다. 큐는 Map 으로
// 시뮬레이션해 deleteCaptures 가 실제로 줄여야 루프가 종료된다 (무한 루프 회귀 감지).
// halt 플래그는 모듈 상태로 남지만 비-누적 트리거가 풀므로 각 테스트는 자급자족한다.

import { reportError } from '@/features/analytics/error-reporter';
import { trackEvent } from '@/features/analytics/event-tracker';
import type { AnalyticsEvent } from '@/features/analytics/events';
import { recordingFileExists } from '@/features/audio/audio-file-storage';
import { getCurrentUid } from '@/features/auth/auth-identity';
import { loadStoredProfile } from '@/features/profile/profile-storage';
import type { ParrotProfile } from '@/features/profile/profile-types';
import { readExtraString } from '@/features/shared/expo-extra';
import { loadUploadConsent } from '@/features/upload-consent/upload-consent-storage';

import type { CaptureRegistrationMeta } from '../follow-along-capture-meta';
import { applyCaptureMeta, deleteCaptures, loadFollowAlongCaptures } from '../follow-along-capture-storage';
import type { FollowAlongCapture } from '../follow-along-capture-types';
import { requestCaptureFlush } from '../follow-along-upload';
import { sendCaptureBatch, type SendCaptureBatchOutcome } from '../follow-along-upload-client';
import { loadTrainingStore } from '../training-storage';
import type { TrainingStore, TrainingWord } from '../training-types';

jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.2.3' }));
jest.mock('@/features/analytics/error-reporter', () => ({ reportError: jest.fn() }));
jest.mock('@/features/analytics/event-tracker', () => ({ trackEvent: jest.fn() }));
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
const trackEventMock = jest.mocked(trackEvent);

// 발행 순서를 보존한 채 한 이벤트만 뽑는다 — "flush 단위 1회" 같은 건수 계약을 그대로 본다.
function trackedParams(name: AnalyticsEvent['name']): Record<string, unknown>[] {
  return trackEventMock.mock.calls
    .map(([event]) => event)
    .filter((event) => event.name === name)
    .map((event) => ({ ...event.params }));
}

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

  // in-flight 창(전송 pending 중)에 도착한 트리거의 rerun 예약이 트리거 종류를 보존하는지 —
  // 순차 호출 테스트가 못 잡는 엣지. 예약이 누적(①)뿐이면 halt 후 rerun 도 억제돼야 한다.
  it('keeps accumulation backoff when the mid-flight trigger was accumulation-only', async () => {
    queue.set('cap-1', makeCapture('cap-1'));
    const haltOutcome: SendCaptureBatchOutcome = {
      http: { status: null, body: null },
      sentIds: ['cap-1'],
      unreadableIds: [],
    };
    let resolveSend!: (outcome: SendCaptureBatchOutcome) => void;
    sendMock.mockImplementation(() => new Promise((resolve) => { resolveSend = resolve; }));

    requestCaptureFlush();
    await drainFlush(); // 루프가 sendCaptureBatch 에 도달, 전송 pending
    requestCaptureFlush({ fromAccumulation: true }); // in-flight 중 누적 트리거 → rerun 예약
    resolveSend(haltOutcome); // 네트워크 오류 → halt
    await drainFlush();
    // 예약이 누적뿐이었으므로 rerun 도 억제 대상 — 재전송이 일어나면 안 된다.
    expect(sendMock).toHaveBeenCalledTimes(1);

    requestCaptureFlush(); // 상황 변화 트리거가 억제를 푼다
    await drainFlush();
    expect(sendMock).toHaveBeenCalledTimes(2);

    resolveSend(haltOutcome); // 두 번째 전송 종료 (모듈 in-flight 상태 정리)
    await drainFlush();
  });

  // 판정을 거치지 않고 예외로 죽은 flush(디스크 가득 참의 zip 쓰기 throw 등)도 정상 halt 와
  // 같은 억제 계약을 따라야 한다 — 안 그러면 캡처 저장마다 누적 트리거가 같은 실패를 반복한다.
  it('suppresses accumulation retries after the flush loop dies with an exception', async () => {
    queue.set('cap-1', makeCapture('cap-1'));
    sendMock.mockRejectedValue(new Error('disk full'));

    requestCaptureFlush();
    await drainFlush();
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(reportErrorMock).toHaveBeenCalledTimes(1);
    expect(reportErrorMock.mock.calls[0][1]).toEqual({ scope: 'training.captureFlush' });
    expect(queue.size).toBe(1); // 클립은 큐에 남는다 — 데이터 손실 없음

    // 예외로 끝난 뒤에도 누적 트리거(①)는 no-op 이어야 한다.
    requestCaptureFlush({ fromAccumulation: true });
    await drainFlush();
    expect(sendMock).toHaveBeenCalledTimes(1);

    // 상황 변화 트리거(②~⑤)는 억제를 풀고 재시도한다.
    requestCaptureFlush();
    await drainFlush();
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it('reruns after halt when a non-accumulation trigger arrived mid-flight', async () => {
    queue.set('cap-1', makeCapture('cap-1'));
    const haltOutcome: SendCaptureBatchOutcome = {
      http: { status: null, body: null },
      sentIds: ['cap-1'],
      unreadableIds: [],
    };
    let resolveSend!: (outcome: SendCaptureBatchOutcome) => void;
    sendMock.mockImplementation(() => new Promise((resolve) => { resolveSend = resolve; }));

    requestCaptureFlush();
    await drainFlush();
    requestCaptureFlush({ fromAccumulation: true });
    requestCaptureFlush(); // 비-누적 트리거도 도착 — 상황 변화 신호가 예약에 섞임
    resolveSend(haltOutcome);
    await drainFlush();
    // 예약에 상황 변화 신호가 있었으므로 rerun 은 진행돼야 한다 (억제 과잉 방지).
    expect(sendMock).toHaveBeenCalledTimes(2);

    resolveSend(haltOutcome);
    await drainFlush();
    expect(sendMock).toHaveBeenCalledTimes(2); // 추가 rerun 없음
  });
});

// BB-284 — 클립 1건이 캡처 이후 어떤 결말을 맞았는지 이벤트만으로 복원되는지 본다.
describe('requestCaptureFlush instrumentation', () => {
  it('records one succeeded event per uploaded clip', async () => {
    queue.set('cap-1', makeCapture('cap-1'));
    queue.set('cap-2', makeCapture('cap-2'));

    requestCaptureFlush();
    await drainFlush();

    expect(trackedParams('capture_upload_succeeded')).toEqual([
      { client_capture_id: 'cap-1', latency_ms: expect.any(Number), batch_size: 2, is_retry_single: false },
      { client_capture_id: 'cap-2', latency_ms: expect.any(Number), batch_size: 2, is_retry_single: false },
    ]);
    expect(trackedParams('capture_flush_aborted')).toEqual([]);
  });

  // 발행이 삭제보다 앞서면, 삭제 실패로 큐에 남은 클립이 다음 트리거에서 재업로드되며
  // 같은 client_capture_id 로 succeeded 가 중복 적재된다 — 성공률이 부풀어 오른다.
  it('emits no succeeded event when the uploaded clips could not be deleted', async () => {
    queue.set('cap-1', makeCapture('cap-1'));
    deleteMock.mockRejectedValue(new Error('disk full'));

    requestCaptureFlush();
    await drainFlush();

    expect(trackedParams('capture_upload_succeeded')).toEqual([]);
    expect(queue.size).toBe(1);
  });

  // batch_size 는 계획 배치가 아니라 실제 전송분이어야 한다 — 읽기 실패분이 섞이면 갈린다.
  it('reports the sent batch size when a file could not be read', async () => {
    for (const id of ['cap-1', 'cap-2', 'cap-3']) queue.set(id, makeCapture(id));
    sendMock.mockImplementation(async ({ batch }) => {
      const sentIds = batch.map((capture) => capture.id).filter((id) => id !== 'cap-3');
      return { http: { status: 200, body: successBody(sentIds) }, sentIds, unreadableIds: ['cap-3'] };
    });

    requestCaptureFlush();
    await drainFlush();

    expect(trackedParams('capture_upload_succeeded').map((params) => params.batch_size)).toEqual([2, 2]);
    expect(queue.size).toBe(0);
  });

  it('omits http_status when an item is rejected inside a 200 response', async () => {
    queue.set('cap-1', makeCapture('cap-1'));
    sendMock.mockImplementation(async ({ batch }) => ({
      http: { status: 200, body: { data: { 'cap-1': { status: 'rejected' } } } },
      sentIds: batch.map((capture) => capture.id),
      unreadableIds: [],
    }));

    requestCaptureFlush();
    await drainFlush();

    expect(trackedParams('capture_upload_failed')).toEqual([
      { client_capture_id: 'cap-1', reason: 'server_reject', age_ms: expect.any(Number) },
    ]);
  });

  it('records http_status when a single-item batch is discarded on a 4xx', async () => {
    queue.set('cap-1', makeCapture('cap-1'));
    sendMock.mockImplementation(async ({ batch }) => ({
      http: { status: 400, body: null },
      sentIds: batch.map((capture) => capture.id),
      unreadableIds: [],
    }));

    requestCaptureFlush();
    await drainFlush();

    expect(trackedParams('capture_upload_failed')).toEqual([
      { client_capture_id: 'cap-1', reason: 'server_reject', age_ms: expect.any(Number), http_status: 400 },
    ]);
  });

  // 중단 기록은 halt 지점 수와 무관하게 flush 하나에 1건이어야 한다.
  it('records a single abort event carrying the clips uploaded and left waiting', async () => {
    for (let i = 0; i < 12; i += 1) {
      queue.set(`cap-${i}`, makeCapture(`cap-${i}`, {
        capturedAt: `2026-08-01T00:00:${String(i).padStart(2, '0')}.000Z`,
      }));
    }
    sendMock.mockImplementation(async ({ batch }) => {
      const sentIds = batch.map((capture) => capture.id);
      if (batch.length === 10) {
        return { http: { status: 200, body: successBody(sentIds) }, sentIds, unreadableIds: [] };
      }
      return { http: { status: null, body: null }, sentIds, unreadableIds: [] };
    });

    requestCaptureFlush();
    await drainFlush();

    // 네트워크 오류는 응답이 없어 http_status 가 붙지 않는다.
    expect(trackedParams('capture_flush_aborted')).toEqual([
      { reason: 'network_error', pending_count: 2, succeeded_before_abort: 10 },
    ]);
  });

  it('reports a server error abort with its status code', async () => {
    queue.set('cap-1', makeCapture('cap-1'));
    sendMock.mockImplementation(async ({ batch }) => ({
      http: { status: 503, body: null },
      sentIds: batch.map((capture) => capture.id),
      unreadableIds: [],
    }));

    requestCaptureFlush();
    await drainFlush();

    expect(trackedParams('capture_flush_aborted')).toEqual([
      { reason: 'server_error', pending_count: 1, succeeded_before_abort: 0, http_status: 503 },
    ]);
  });

  it('reports an unreadable response abort when no item could be resolved', async () => {
    queue.set('cap-1', makeCapture('cap-1'));
    sendMock.mockImplementation(async ({ batch }) => ({
      http: { status: 200, body: { data: {} } },
      sentIds: batch.map((capture) => capture.id),
      unreadableIds: [],
    }));

    requestCaptureFlush();
    await drainFlush();

    expect(trackedParams('capture_flush_aborted')).toEqual([
      { reason: 'unreadable_response', pending_count: 1, succeeded_before_abort: 0, http_status: 200 },
    ]);
  });

  // 루프가 부기하던 시절에는 첫 스토어 읽기 전에 죽으면 대기 0건으로 보고됐다 —
  // 중단 시점에 큐를 재조회하므로 실제 잔여가 나가야 한다.
  it('reports the real pending count when the loop dies before reading the queue', async () => {
    for (const id of ['cap-1', 'cap-2', 'cap-3']) queue.set(id, makeCapture(id));
    jest.mocked(loadUploadConsent).mockRejectedValueOnce(new Error('storage unavailable'));

    requestCaptureFlush();
    await drainFlush();

    expect(trackedParams('capture_flush_aborted')).toEqual([
      { reason: 'exception', pending_count: 3, succeeded_before_abort: 0 },
    ]);
    expect(reportErrorMock).toHaveBeenCalledTimes(1);
  });

  it('omits pending_count when the queue itself cannot be read', async () => {
    queue.set('cap-1', makeCapture('cap-1'));
    jest.mocked(loadFollowAlongCaptures).mockRejectedValue(new Error('storage unavailable'));

    requestCaptureFlush();
    await drainFlush();

    expect(trackedParams('capture_flush_aborted')).toEqual([
      { reason: 'exception', succeeded_before_abort: 0 },
    ]);
  });
});
