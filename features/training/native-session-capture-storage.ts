import { reportError } from '@/features/analytics/error-reporter';
import { sessionAudioEngine, type CapturedSegment } from '@/modules/session-audio-engine';

import { appendFollowAlongCapture } from './follow-along-capture-storage';

export async function storeNativeCapturedSegments(segments: CapturedSegment[], wordId: string): Promise<void> {
  const storedIds: string[] = [];
  let firstError: unknown = null;

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
