import { reportError } from '@/features/analytics/error-reporter';
import { deleteRecordingFile, getRecordingFileSize } from '@/features/audio/audio-file-storage';
import { persistKeyedStore } from '@/features/shared/persist-keyed-store';

import type { CaptureSegment, FollowAlongCapture, FollowAlongCaptureStore } from './follow-along-capture-types';

export const FOLLOW_ALONG_CAPTURE_KEY = '@buddybird/follow-along-captures';

// 한 기기에 쌓이는 캡처 오디오 총량 상한. 초과 시 오래된 것부터 파일과 기록을 지운다.
const MAX_TOTAL_BYTES = 500 * 1024 * 1024;

// 오디오 URI normalize(save)/hydrate(load)는 seam이 소유한다 — 컬렉션·필드만 선언.
// iOS 컨테이너 UUID 변동으로 절대 URI 가 stale 되는 것을 방지한다.
const AUDIO_URI_COLLECTIONS = [{ collection: 'capturesById', fields: ['uri'] }] as const;

// 방어적 파싱: 손상된 엔트리는 조용히 버리고 나머지를 살린다. 전체를 throw 하지 않는다
// (학습 스토어의 throw-to-brick 정책과 반대 — 캡처는 best-effort 사이드 채널).
function parseStoredCaptureStore(raw: unknown): FollowAlongCaptureStore {
  if (!raw || typeof raw !== 'object') return { capturesById: {} };
  const source = (raw as Record<string, unknown>).capturesById;
  if (!source || typeof source !== 'object') return { capturesById: {} };

  const capturesById: Record<string, FollowAlongCapture> = {};
  for (const [id, value] of Object.entries(source as Record<string, unknown>)) {
    const capture = parseCapture(id, value);
    if (capture) capturesById[capture.id] = capture;
  }
  return { capturesById };
}

function parseCapture(id: string, value: unknown): FollowAlongCapture | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.uri !== 'string' || typeof v.fileName !== 'string') return null;
  return {
    id: typeof v.id === 'string' ? v.id : id,
    sessionId: typeof v.sessionId === 'string' ? v.sessionId : '',
    wordId: typeof v.wordId === 'string' ? v.wordId : '',
    cycle: typeof v.cycle === 'number' ? v.cycle : 0,
    capturedAt: typeof v.capturedAt === 'string' ? v.capturedAt : '',
    uri: v.uri,
    fileName: v.fileName,
    segments: parseSegments(v.segments),
    sizeBytes: typeof v.sizeBytes === 'number' ? v.sizeBytes : 0,
    uploaded: v.uploaded === true,
  };
}

function parseSegments(value: unknown): CaptureSegment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
    .filter((s) => typeof s.startMs === 'number' && typeof s.endMs === 'number')
    .map((s) => ({ startMs: s.startMs as number, endMs: s.endMs as number }));
}

const captureStore = persistKeyedStore<FollowAlongCaptureStore>({
  key: FOLLOW_ALONG_CAPTURE_KEY,
  scope: 'training.followAlongCaptures',
  parse: parseStoredCaptureStore,
  fallback: () => ({ capturesById: {} }),
  // recover 생략 → 손상 시 조용히 초기화(fallback). 학습 화면을 막지 않는다.
  audioUriCollections: AUDIO_URI_COLLECTIONS,
});

export async function loadFollowAlongCaptures(): Promise<FollowAlongCaptureStore> {
  return captureStore.load();
}

// 갭 종료마다 append 가 근접 발생할 수 있어 read-modify-write 를 직렬화한다.
// 이전 작업 실패가 체인을 끊지 않도록 성공/실패 모두 이어서 실행한다.
let writeQueue: Promise<void> = Promise.resolve();
function enqueueWrite(op: () => Promise<void>): Promise<void> {
  const run = writeQueue.then(op, op);
  writeQueue = run.catch(() => {});
  return run;
}

export function appendFollowAlongCapture(capture: Omit<FollowAlongCapture, 'sizeBytes'>): Promise<void> {
  return enqueueWrite(async () => {
    try {
      const store = await captureStore.load();
      store.capturesById[capture.id] = { ...capture, sizeBytes: getRecordingFileSize(capture.uri) };
      evictOldestOverCap(store);
      await captureStore.save(store);
    } catch (error: unknown) {
      reportError(error, { scope: 'training.followAlongCaptures.append' });
    }
  });
}

// 총량이 상한을 넘으면 capturedAt 오래된 순서로 파일과 기록을 지워 상한 이하로 맞춘다.
// 업로드 여부와 무관하게 오래된 것부터 지운다.
function evictOldestOverCap(store: FollowAlongCaptureStore): void {
  const captures = Object.values(store.capturesById);
  let total = captures.reduce((sum, capture) => sum + capture.sizeBytes, 0);
  if (total <= MAX_TOTAL_BYTES) return;

  const oldestFirst = [...captures].sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
  for (const capture of oldestFirst) {
    if (total <= MAX_TOTAL_BYTES) break;
    deleteRecordingFile(capture.uri);
    delete store.capturesById[capture.id];
    total -= capture.sizeBytes;
  }
}

export function markCaptureUploaded(id: string): Promise<void> {
  return enqueueWrite(async () => {
    try {
      const store = await captureStore.load();
      const capture = store.capturesById[id];
      if (!capture) return;
      store.capturesById[id] = { ...capture, uploaded: true };
      await captureStore.save(store);
    } catch (error: unknown) {
      reportError(error, { scope: 'training.followAlongCaptures.markUploaded' });
    }
  });
}
