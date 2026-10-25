import type { Recording } from '@/types/apis/words';

/** 업로드가 끝난 녹음만 남기는 함수 */
export const uploadedRecordings = (recordings: readonly Recording[]) => {
	return recordings.filter((recording) => recording.audio_file.status === 'uploaded');
};

/** 업로드를 처리하고 있는 녹음이 있는지 반환하는 함수 */
export const hasPendingRecording = (recordings: readonly Recording[]) => {
	return recordings.some((recording) => recording.audio_file.status === 'pending');
};
