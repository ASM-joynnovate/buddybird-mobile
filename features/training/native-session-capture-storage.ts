import { reportError } from '@/features/analytics/error-reporter';
import { loadStoredProfile } from '@/features/profile/profile-storage';
import { sessionAudioEngine, type CapturedSegment } from '@/modules/session-audio-engine';

import { buildCaptureRegistrationMeta, type CaptureRegistrationMeta } from './follow-along-capture-meta';
import { appendFollowAlongCapture, loadFollowAlongCaptures } from './follow-along-capture-storage';
import { requestCaptureFlush } from './follow-along-upload';
import { loadTrainingStore } from './training-storage';

// 업로드 트리거 ① (SPEC-0003): 미전송 클립이 이만큼 쌓이면 즉시 flush 를 건다.
// 성공한 캡처는 즉시 삭제되므로 스토어에 남아 있는 레코드 전부가 미전송이다.
const CAPTURE_FLUSH_ACCUMULATION_THRESHOLD = 10;

// 등록 시점 메타(치환 단어 id·프로필 스냅샷) 로드. 실패 시 null — 캡처는 메타 없이 저장되고
// flush 의 legacy 백필이 재시도한다 (일시 오류에 강등값을 영속화하지 않기 위함).
async function loadRegistrationMeta(wordId: string): Promise<CaptureRegistrationMeta | null> {
  try {
    const [store, profile] = await Promise.all([loadTrainingStore(), loadStoredProfile()]);
    return buildCaptureRegistrationMeta(wordId, store.wordsById[wordId], profile);
  } catch (error: unknown) {
    console.warn('[training.sessionAudio.captureMeta]', error);
    return null;
  }
}

export async function storeNativeCapturedSegments(segments: CapturedSegment[], wordId: string): Promise<void> {
  const storedIds: string[] = [];
  let firstError: unknown = null;
  const meta = segments.length > 0 ? await loadRegistrationMeta(wordId) : null;

  for (const segment of segments) {
    try {
      await appendFollowAlongCapture({
        id: segment.segmentId,
        sessionId: segment.sessionId,
        wordId,
        cycle: segment.cycle,
        phase: segment.phase,
        capturedAt: segment.capturedAt,
        uri: segment.uri,
        fileName: segment.fileName,
        segments: [{ startMs: segment.speechStartMs, endMs: segment.speechEndMs }],
        ...(meta ?? {}),
      });
      storedIds.push(segment.segmentId);
    } catch (error: unknown) {
      firstError ??= error;
      reportError(error, { scope: 'training.sessionAudio.storeSegment' });
    }
  }

  if (storedIds.length > 0) {
    await sessionAudioEngine.markSegmentsStored(storedIds);
    // 트리거 판정은 best-effort — 판정용 읽기 실패가 저장 성공/실패 계약을 오염시키면 안 된다
    // (크래시 복구 경로에서 세션 적립을 무산시킴). 트리거를 놓쳐도 다음 트리거가 커버한다.
    try {
      const { capturesById } = await loadFollowAlongCaptures();
      if (Object.keys(capturesById).length >= CAPTURE_FLUSH_ACCUMULATION_THRESHOLD) requestCaptureFlush();
    } catch (error: unknown) {
      console.warn('[training.captureFlush]', error);
    }
  }
  if (firstError) throw firstError;
}
