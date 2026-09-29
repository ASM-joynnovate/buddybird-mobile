import { useEffect, useRef, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import usePermission from '@/hooks/use-permission';
import useSoundPlayer from '@/hooks/use-sound-player';

import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { formatTimer } from '@/i18n/format';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { randomUUID } from 'expo-crypto';
import { MicIcon, PauseIcon, PlayIcon, SquareIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_UPLOAD_BYTES, RECORDING_MAX_SECONDS } from '@/config';
import AudioWaveform from '@/screens/words/components/audio-waveform';
import { deleteFile, readFileInfo } from '@/services/media/file';
import { reportError, track } from '@/services/telemetry/client';
import { colors, contentMaxWidth, font } from '@/theme';
import { SECOND } from '@/utils/units';

import PermissionDialog from '@/components/dialogs/permission-dialog';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { IconButton } from '@/components/ui/icon-button';
import { InlineError } from '@/components/ui/inline-error';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ui } from '@/components/ui/styles';

const recordingOptions = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

const PLAYBACK_MODE = {
	allowsRecording: false,
	playsInSilentMode: true,
	interruptionMode: 'doNotMix',
	shouldPlayInBackground: false,
	shouldRouteThroughEarpiece: false,
	allowsBackgroundRecording: false,
} as const;

const RECORDING_FILE_ID = 'recording-file';

const DB_FLOOR = -60;
const DB_CEIL = -10;
const NOISE_FLOOR = 0.25;

interface RecordingFile {
	uri: string;
	durationMs: number;
}

type RecordingFileError = 'empty' | 'tooLarge' | 'invalidFormat' | 'recordError' | null;

/** 녹음 데시벨을 0에서 1 사이의 소리 크기로 변환하는 함수 */
const meteringLevel = (decibels?: number) => {
	if (decibels === undefined || !Number.isFinite(decibels)) {
		return 0;
	}

	const normalized = Math.max(0, Math.min(1, (decibels - DB_FLOOR) / (DB_CEIL - DB_FLOOR)));

	return normalized < NOISE_FLOOR ? 0 : (normalized - NOISE_FLOOR) / (1 - NOISE_FLOOR);
};

/** 녹음 상태 문구를 반환하는 함수 */
const statusText = (isRecording: boolean, recordingFile: RecordingFile | null, t: TFunction) => {
	if (isRecording) {
		return t('words.recorder.recording');
	}

	return recordingFile ? t('words.recorder.recorded') : t('words.recorder.ready');
};

/** 녹음 파일 삭제 함수 */
const deleteRecordingFile = (uri: string) => {
	try {
		deleteFile(uri);
	} catch (e) {
		reportError(e, 'recording_cleanup');
	}
};

/** 녹음 파일 오류를 반환하는 함수 */
const getRecordingFileError = (uri: string, durationMs: number) => {
	if (!uri.toLowerCase().endsWith('.m4a')) {
		return 'invalidFormat';
	}

	const fileInfo = readFileInfo(uri);

	if (!fileInfo.exists || fileInfo.size === 0 || durationMs <= 0) {
		return 'empty';
	}

	return fileInfo.size > MAX_UPLOAD_BYTES ? 'tooLarge' : null;
};

/** 녹음 화면 */
const RecorderScreen = () => {
	const { t } = useTranslation();

	const insets = useSafeAreaInsets();

	const { params } = useRoute<RouteProp<RootStackParamList, 'Recorder'>>();
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const [recordingFile, setRecordingFile] = useState<RecordingFile | null>(null);
	const [recordingFileError, setRecordingFileError] = useState<RecordingFileError>(null);
	const [busy, setBusy] = useState(false);

	const elapsedRef = useRef(0);
	const handledUriRef = useRef<string | null>(null);
	const closingRef = useRef(false);

	/** 녹음이 끝나면 녹음 파일 검사 후 저장 */
	const handleRecordingFinished = (uri: string, durationMs: number) => {
		if (closingRef.current || handledUriRef.current === uri) {
			return;
		}

		handledUriRef.current = uri;

		try {
			const fileError = getRecordingFileError(uri, durationMs);

			setRecordingFileError(fileError);

			if (fileError) {
				deleteRecordingFile(uri);
			} else {
				setRecordingFile({ uri, durationMs: Math.min(RECORDING_MAX_SECONDS * SECOND, durationMs) });
			}
		} catch (e) {
			reportError(e, 'recording_inspect');

			setRecordingFileError('recordError');
		}
	};

	const recorder = useAudioRecorder(recordingOptions, (status) => {
		if (status.hasError) {
			setRecordingFileError('recordError');
		} else if (status.isFinished && status.url) {
			handleRecordingFinished(status.url, elapsedRef.current);
		}
	});
	const recorderState = useAudioRecorderState(recorder, 80);

	const player = useSoundPlayer();

	const microphonePermission = usePermission('microphone');

	const { isRecording } = recorderState;
	const playing = player.playingId === RECORDING_FILE_ID;
	const shownMs = isRecording ? recorderState.durationMillis : (recordingFile?.durationMs ?? 0);

	/** 녹음 경과 시간을 ref에 저장 */
	useEffect(() => {
		elapsedRef.current = recorderState.durationMillis;
	}, [recorderState.durationMillis]);

	/** 화면 진입 시 오디오 모드 설정 */
	useEffect(() => {
		closingRef.current = false;

		void setAudioModeAsync(PLAYBACK_MODE).catch((error: unknown) => reportError(error, 'recording_setup'));

		return () => {
			closingRef.current = true;

			if (recorder.getStatus().isRecording) {
				void recorder.stop().catch((error: unknown) => reportError(error, 'recording_cleanup'));
			}

			void setAudioModeAsync(PLAYBACK_MODE).catch((error: unknown) => reportError(error, 'recording_cleanup'));
		};
	}, [recorder]);

	const handleStartRecording = async () => {
		if (busy) {
			return;
		}

		setBusy(true);
		setRecordingFileError(null);

		if (recordingFile) {
			deleteRecordingFile(recordingFile.uri);

			setRecordingFile(null);
		}

		try {
			await setAudioModeAsync({ ...PLAYBACK_MODE, allowsRecording: true });
			await recorder.prepareToRecordAsync(recordingOptions);

			handledUriRef.current = null;

			recorder.record({ forDuration: RECORDING_MAX_SECONDS });

			track('recording_started', {});
		} catch (e) {
			reportError(e, 'recording_start');

			setRecordingFileError('recordError');
		} finally {
			setBusy(false);
		}
	};

	const handleStopRecording = async () => {
		if (busy) {
			return;
		}

		setBusy(true);

		try {
			const durationMs = recorder.getStatus().durationMillis;

			await recorder.stop();

			if (recorder.uri) {
				handleRecordingFinished(recorder.uri, durationMs);
			}
		} catch (e) {
			reportError(e, 'recording_stop');

			setRecordingFileError('recordError');
		} finally {
			setBusy(false);
		}
	};

	const handleDiscardRecording = async () => {
		closingRef.current = true;

		try {
			if (recorder.getStatus().isRecording) {
				await recorder.stop();
			}
		} catch (e) {
			reportError(e, 'recording_cleanup');
		}

		for (const uri of new Set([recordingFile?.uri, recorder.uri])) {
			if (uri) {
				deleteRecordingFile(uri);
			}
		}
	};

	const handleClose = async () => {
		player.stop();

		await handleDiscardRecording();

		navigation.goBack();
	};

	/** 마이크 권한 확인 후 녹음 시작 */
	const handleRecord = () => {
		player.stop();

		void microphonePermission.run(() => void handleStartRecording());
	};

	const handleToggleRecording = () => {
		if (isRecording) {
			void handleStopRecording();

			return;
		}

		handleRecord();
	};

	const handleAddRecording = () => {
		if (!recordingFile) {
			return;
		}

		player.stop();

		navigation.popTo('Main', {
			screen: 'WordsTab',
			params: {
				screen: 'WordEditor',
				params: {
					newRecording: { key: randomUUID(), uri: recordingFile.uri, durationMs: recordingFile.durationMs },
				},
				merge: true,
			},
		});
	};

	return (
		<Screen scrollable={false}>
			<View style={[styles.container, { paddingBottom: insets.bottom + 20 }]}>
				<ScreenHeader
					title={params.wordName || t('words.recorder.newWord')}
					onBack={() => void handleClose()}
					backIcon="close"
				/>

				{/*녹음 상태*/}
				<View style={styles.recordingContainer}>
					<AudioWaveform
						color={colors.orange}
						height={96}
						barCount={36}
						fullWidth
						level={isRecording ? meteringLevel(recorderState.metering) : null}
						looping={playing}
					/>

					<Copy accessibilityRole="timer" style={styles.timer}>
						{formatTimer(shownMs)}
					</Copy>
					<Copy accessibilityLiveRegion="polite" style={styles.status}>
						{statusText(isRecording, recordingFile, t)}
					</Copy>

					{recordingFile && !isRecording && (
						<IconButton
							icon={playing ? PauseIcon : PlayIcon}
							label={t(playing ? 'common.sound.stop' : 'words.recorder.play')}
							variant="primary"
							size="large"
							onPress={() => player.toggle(RECORDING_FILE_ID, recordingFile.uri)}
						/>
					)}

					<InlineError
						message={
							recordingFileError
								? t(`words.recorder.${recordingFileError}`)
								: player.failedId
									? t('common.sound.playError')
									: null
						}
					/>
				</View>

				{/*녹음이 끝나면 추가 버튼, 아니면 녹음 버튼 표시*/}
				{recordingFile && !isRecording ? (
					<View style={ui.actionsRow}>
						<Button
							label={t('words.recorder.recordAgain')}
							variant="secondary"
							disabled={busy}
							onPress={handleRecord}
							style={ui.action}
						/>
						<Button label={t('common.add')} onPress={handleAddRecording} style={ui.action} />
					</View>
				) : (
					<View style={styles.recordButtonContainer}>
						<IconButton
							icon={isRecording ? SquareIcon : MicIcon}
							label={t(isRecording ? 'words.recorder.stop' : 'words.recorder.start')}
							variant="primary"
							size="xlarge"
							disabled={busy}
							onPress={handleToggleRecording}
						/>
					</View>
				)}
			</View>

			<PermissionDialog state={microphonePermission.dialog} />
		</Screen>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
		paddingTop: 12,
	},
	recordingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
	timer: {
		fontFamily: font.black,
		fontSize: 40,
		lineHeight: 48,
		fontVariant: ['tabular-nums'],
	},
	status: { color: colors.muted, textAlign: 'center' },
	recordButtonContainer: { alignItems: 'center' },
});

export default RecorderScreen;
