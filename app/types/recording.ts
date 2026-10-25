export interface EditorRecording {
	kind: 'server' | 'local';
	id: string;
	url: string;
	uploadPending: boolean;
	durationMs: number | null;
	waveformLevels: number[] | null;
}

export interface NewRecording {
	key: string;
	uri: string;
	durationMs: number;
	waveformLevels: number[];
	replacedRecordingId: string | null;
	recordingId: string | null;
}
