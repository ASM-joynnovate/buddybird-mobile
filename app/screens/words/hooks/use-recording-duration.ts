import { useQuery } from '@tanstack/react-query';

import type { EditorRecording } from '@/types/recording';

import { wordKeys } from '@/hooks/apis/keys/words';

import { measureAudioDuration } from '@/services/media/audio-duration';
import { reportError } from '@/services/telemetry/client';

/** 녹음 재생 길이 조회 Hook */
const useRecordingDuration = (recording: EditorRecording | null) => {
	// oxlint-disable-next-line @tanstack/query/exhaustive-deps
	return useQuery({
		queryKey: wordKeys.recordingDuration(recording?.id ?? ''),
		queryFn: () =>
			measureAudioDuration(recording?.url ?? '').catch((error: unknown) => {
				reportError(error, 'recording_duration');

				throw error;
			}),
		enabled: recording?.kind === 'server' && !recording.uploadPending,
		staleTime: Infinity,
	});
};

export default useRecordingDuration;
