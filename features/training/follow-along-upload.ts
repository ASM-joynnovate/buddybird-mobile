import { reportError } from '@/features/analytics/error-reporter';

import type { CaptureSegment, FollowAlongCapture } from './follow-along-capture-types';
import { loadFollowAlongCaptures, markCaptureUploaded } from './follow-along-capture-storage';

// 백엔드로 보낼 캡처 페이로드. 파일(fileUri)은 hydrate 된 절대 경로.
export interface FollowAlongUploadPayload {
  captureId: string;
  sessionId: string;
  wordId: string;
  cycle: number;
  capturedAt: string;
  fileUri: string;
  fileName: string;
  segments: CaptureSegment[];
}

export type UploadOutcome =
  | { status: 'uploaded'; remoteId?: string }
  | { status: 'skipped-no-backend' }
  | { status: 'failed'; error: unknown };

// 백엔드 미연결: null 이면 전송하지 않고 로컬 보관을 유지한다.
// 백엔드 미연결: null 반환. 서버 연결 시 이 함수가 실제 엔드포인트를 반환하도록 바꾼다
// (env·remote config 등). 함수로 두어 호출부의 정적 unreachable 판정을 피한다.
function resolveUploadEndpoint(): string | null {
  return null;
}

// 캡처 1건을 백엔드로 전송한다. 현재는 백엔드 미연결이라 no-op(로컬 보관 유지).
// 백엔드 연결 시 이 함수 안에서 multipart POST(파일 payload.fileUri + 메타 payload)를 수행하고,
// 성공 시 { status: 'uploaded', remoteId }, 실패 시 reportError({ scope: 'training.followAlong.upload' })
// 후 { status: 'failed', error } 를 반환하도록 구현한다.
export async function uploadFollowAlongCapture(payload: FollowAlongUploadPayload): Promise<UploadOutcome> {
  const endpoint = resolveUploadEndpoint();
  if (!endpoint) {
    return { status: 'skipped-no-backend' };
  }
  // 엔드포인트가 생기기 전까지 도달하지 않는 경로. 실제 전송 구현이 여기 들어간다.
  return { status: 'skipped-no-backend' };
}

function toPayload(capture: FollowAlongCapture): FollowAlongUploadPayload {
  return {
    captureId: capture.id,
    sessionId: capture.sessionId,
    wordId: capture.wordId,
    cycle: capture.cycle,
    capturedAt: capture.capturedAt,
    fileUri: capture.uri, // load 시 seam 이 절대 경로로 hydrate 함
    fileName: capture.fileName,
    segments: capture.segments,
  };
}

// 미업로드 캡처를 순회하며 백엔드로 전송하고, 성공한 건만 uploaded 로 표시한다.
// 백엔드 미연결이면 각 건이 skipped-no-backend 로 no-op 되어 로컬 보관이 유지된다.
export async function flushPendingFollowAlongCaptures(): Promise<void> {
  try {
    const store = await loadFollowAlongCaptures();
    const pending = Object.values(store.capturesById).filter((capture) => !capture.uploaded);

    for (const capture of pending) {
      const outcome = await uploadFollowAlongCapture(toPayload(capture));
      if (outcome.status === 'uploaded') {
        await markCaptureUploaded(capture.id);
      }
    }
  } catch (error: unknown) {
    reportError(error, { scope: 'training.followAlong.flush' });
  }
}
