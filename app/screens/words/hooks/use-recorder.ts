import { useCallback, useEffect, useRef, useState } from 'react';

import { MAX_UPLOAD_BYTES } from '@/types/apis/uploads';

import { RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { File } from 'expo-file-system';

import { RECORDING_MAX_SECONDS } from '@/config';
import { reportError, track } from '@/services/telemetry/client';
import { meteringLevel } from '@/utils/audio-waveform';
import { SECOND } from '@/utils/units';

const options = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

const PLAYBACK_MODE = {
	allowsRecording: false,
	playsInSilentMode: true,
	interruptionMode: 'doNotMix',
	shouldPlayInBackground: false,
	shouldRouteThroughEarpiece: false,
	allowsBackgroundRecording: false,
} as const;

type Take = { uri: string; durationMs: number };
type RecorderProblem = 'empty' | 'tooLarge' | 'format' | 'error' | null;

export type Recorder = {
	recording: boolean;
	elapsedMs: number;
	level: number;
	take: Take | null;
	problem: RecorderProblem;
	busy: boolean;
	start(): Promise<void>;
	stop(): Promise<void>;
	discard(): Promise<void>;
};

function deleteFile(uri: string) {
	try {
		const file = new File(uri);

		if (file.exists) {
			file.delete();
		}
	} catch (error) {
		reportError(error, 'recording_cleanup');
	}
}

function inspect(uri: string, durationMs: number): RecorderProblem {
	if (!uri.toLowerCase().endsWith('.m4a')) {
		return 'format';
	}

	const file = new File(uri);

	if (!file.exists || file.size === 0 || durationMs <= 0) {
		return 'empty';
	}

	return file.size > MAX_UPLOAD_BYTES ? 'tooLarge' : null;
}

export function useRecorder(): Recorder {
	const [take, setTake] = useState<Take | null>(null);
	const [problem, setProblem] = useState<RecorderProblem>(null);
	const [busy, setBusy] = useState(false);

	const elapsed = useRef(0);
	const handled = useRef<string | null>(null);
	const closing = useRef(false);

	const finish = useCallback((uri: string, durationMs: number) => {
		if (closing.current || handled.current === uri) {
			return;
		}

		handled.current = uri;

		try {
			const found = inspect(uri, durationMs);

			setProblem(found);

			if (found) {
				deleteFile(uri);
			} else {
				setTake({ uri, durationMs: Math.min(RECORDING_MAX_SECONDS * SECOND, durationMs) });
			}
		} catch (error) {
			reportError(error, 'recording_inspect');

			setProblem('error');
		}
	}, []);

	const recorder = useAudioRecorder(options, (status) => {
		if (status.hasError) {
			setProblem('error');
		} else if (status.isFinished && status.url) {
			finish(status.url, elapsed.current);
		}
	});
	const state = useAudioRecorderState(recorder, 80);

	useEffect(() => {
		elapsed.current = state.durationMillis;
	}, [state.durationMillis]);

	useEffect(() => {
		closing.current = false;

		void setAudioModeAsync(PLAYBACK_MODE).catch((error: unknown) => reportError(error, 'recording_setup'));

		return () => {
			closing.current = true;

			if (recorder.getStatus().isRecording) {
				void recorder.stop().catch((error: unknown) => reportError(error, 'recording_cleanup'));
			}

			void setAudioModeAsync(PLAYBACK_MODE).catch((error: unknown) => reportError(error, 'recording_cleanup'));
		};
	}, [recorder]);

	async function start() {
		if (busy) {
			return;
		}

		setBusy(true);
		setProblem(null);

		if (take) {
			deleteFile(take.uri);

			setTake(null);
		}

		try {
			await setAudioModeAsync({ ...PLAYBACK_MODE, allowsRecording: true });
			await recorder.prepareToRecordAsync(options);

			handled.current = null;

			recorder.record({ forDuration: RECORDING_MAX_SECONDS });

			track('recording_started', {});
		} catch (error) {
			reportError(error, 'recording_start');

			setProblem('error');
		} finally {
			setBusy(false);
		}
	}

	async function stop() {
		if (busy) {
			return;
		}

		setBusy(true);

		try {
			const durationMs = recorder.getStatus().durationMillis;

			await recorder.stop();

			if (recorder.uri) {
				finish(recorder.uri, durationMs);
			}
		} catch (error) {
			reportError(error, 'recording_stop');

			setProblem('error');
		} finally {
			setBusy(false);
		}
	}

	async function discard() {
		closing.current = true;

		try {
			if (recorder.getStatus().isRecording) {
				await recorder.stop();
			}
		} catch (error) {
			reportError(error, 'recording_cleanup');
		}

		for (const uri of new Set([take?.uri, recorder.uri])) {
			if (uri) {
				deleteFile(uri);
			}
		}
	}

	return {
		recording: state.isRecording,
		elapsedMs: state.durationMillis,
		level: meteringLevel(state.metering),
		take,
		problem,
		busy,
		start,
		stop,
		discard,
	};
}
