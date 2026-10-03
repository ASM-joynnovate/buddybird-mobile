import type { Recording } from '@/types/apis/words';

/** 업로드가 끝난 녹음만 남기는 함수 */
export const uploadedRecordings = (recordings: readonly Recording[]) => {
	return recordings.filter((recording) => recording.audio_file.status === 'uploaded');
};
