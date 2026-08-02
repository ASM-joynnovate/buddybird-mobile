import { reportError } from '@/features/analytics/error-reporter';
import { loadStoredProfile } from '@/features/profile/profile-storage';
import { sessionAudioEngine, type CapturedSegment } from '@/modules/session-audio-engine';

import { buildCaptureRegistrationMeta, type CaptureRegistrationMeta } from './follow-along-capture-meta';
import { appendFollowAlongCapture } from './follow-along-capture-storage';
import { loadTrainingStore } from './training-storage';

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
        uploaded: false,
        ...(meta ?? {}),
      });
      storedIds.push(segment.segmentId);
    } catch (error: unknown) {
      firstError ??= error;
      reportError(error, { scope: 'training.sessionAudio.storeSegment' });
    }
  }

  if (storedIds.length > 0) await sessionAudioEngine.markSegmentsStored(storedIds);
  if (firstError) throw firstError;
}
