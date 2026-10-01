import { useEffect, useRef, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { getRecordingDurationOptions } from '@/hooks/apis/words';
import usePermission from '@/hooks/use-permission';
import type { SoundPlayer } from '@/hooks/use-sound-player';

import { useTranslation } from 'react-i18next';

import { formatTimer } from '@/i18n/format';

import { RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { randomUUID } from 'expo-crypto';
import { MicIcon, PauseIcon, PlayIcon, SquareIcon } from 'lucide-react-native';

import { MAX_RECORDINGS, MAX_UPLOAD_BYTES, RECORDING_MAX_SECONDS } from '@/config';
import AudioWaveform from '@/screens/words/components/audio-waveform';
import RecordingStepItem from '@/screens/words/components/recording-sheet/step-item';
import type { EditorRecording, NewRecording } from '@/screens/words/components/recordings-section/recording-item';
import { deleteFile, readFileInfo } from '@/services/media/file';
import { reportError, track } from '@/services/telemetry/client';
import { colors, font } from '@/theme';
import { SECOND } from '@/utils/units';

import PermissionDialog from '@/components/dialogs/permission-dialog';
import { Button } from '@/components/ui/button';
import { Copy } from '@/components/ui/copy';
import { InlineError } from '@/components/ui/inline-error';
import { Sheet } from '@/components/ui/sheet';
import { ui } from '@/components/ui/styles';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';
import { TextButton } from '@/components/ui/text-button';

const recordingOptions = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

const PLAYBACK_MODE = {
	allowsRecording: false,
	playsInSilentMode: true,
	interruptionMode: 'doNotMix',
	shouldPlayInBackground: false,
	shouldRouteThroughEarpiece: false,
	allowsBackgroundRecording: false,
} as const;

const WAVEFORM_BAR_COUNT = 30;
const EMPTY_WAVEFORM_LEVELS: number[] = Array(WAVEFORM_BAR_COUNT).fill(0);

const DB_FLOOR = -60;
const DB_CEIL = -10;
const NOISE_FLOOR = 0.25;

type RecordingFileError = 'empty' | 'tooLarge' | 'invalidFormat' | 'recordError' | null;

interface RecordingTarget {
	recording: EditorRecording | null;
	nextIndex: number;
}

/** 녹음 데시벨을 0에서 1 사이의 소리 크기로 변환하는 함수 */
const meteringLevel = (decibels?: number) => {
	if (decibels === undefined || !Number.isFinite(decibels)) {
		return 0;
	}

	const normalized = Math.max(0, Math.min(1, (decibels - DB_FLOOR) / (DB_CEIL - DB_FLOOR)));

	return normalized < NOISE_FLOOR ? 0 : (normalized - NOISE_FLOOR) / (1 - NOISE_FLOOR);
};

/** 녹음 중 쌓은 소리 크기 기록을 파형 막대 수만큼 줄이는 함수 */
const summarizeLevels = (levels: readonly number[]) => {
	return Array.from({ length: WAVEFORM_BAR_COUNT }, (_, index) => {
		const start = Math.floor((index * levels.length) / WAVEFORM_BAR_COUNT);
		const end = Math.max(start + 1, Math.floor(((index + 1) * levels.length) / WAVEFORM_BAR_COUNT));

		return Math.max(0, ...levels.slice(start, end));
	});
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

interface Props {
	visible: boolean;
	recordings: EditorRecording[];
	player: SoundPlayer;
	onAdd: (newRecording: NewRecording) => void;
	onReplace: (recording: EditorRecording, newRecording: NewRecording) => void;
	onClose: () => void;
}

/**
 * 녹음 bottom sheet 컴포넌트
 * @param visible bottom sheet 표시 여부
 * @param recordings 편집 중인 단어의 녹음 목록
 * @param player useSoundPlayer 결과
 * @param onAdd 빈 단계에서 녹음을 마쳤을 때 실행할 함수
 * @param onReplace 녹음이 있는 단계에서 새로 녹음을 마쳤을 때 실행할 함수
 * @param onClose bottom sheet를 닫을 때 실행할 함수
 */
const RecordingSheet = ({ visible, recordings, player, onAdd, onReplace, onClose }: Props) => {
	const { t } = useTranslation();

	const [currentIndex, setCurrentIndex] = useState(0);
	const [recordingFileError, setRecordingFileError] = useState<RecordingFileError>(null);
	const [busy, setBusy] = useState(false);
	const [recordingLevels, setRecordingLevels] = useState(EMPTY_WAVEFORM_LEVELS);

	const elapsedRef = useRef(0);
	const handledUriRef = useRef<string | null>(null);
	const closingRef = useRef(true);
	const targetRef = useRef<RecordingTarget | null>(null);
	const recordedLevelsRef = useRef<number[]>([]);

	const currentRecording = recordings[currentIndex] ?? null;

	const { data: currentDurationData } = useQuery({
		...getRecordingDurationOptions({ id: currentRecording?.id ?? '', url: currentRecording?.url ?? '' }),
		enabled: currentRecording?.kind === 'server',
		throwOnError: false,
	});

	/** 녹음이 끝나면 녹음 파일 검사 후 목록에 추가하거나 교체 */
	const handleRecordingFinished = (uri: string, durationMs: number) => {
		const target = targetRef.current;

		if (closingRef.current || !target || handledUriRef.current === uri) {
			return;
		}

		handledUriRef.current = uri;

		try {
			const fileError = getRecordingFileError(uri, durationMs);

			setRecordingFileError(fileError);

			if (fileError) {
				deleteRecordingFile(uri);

				return;
			}

			const newRecording: NewRecording = {
				key: randomUUID(),
				uri,
				durationMs: Math.min(RECORDING_MAX_SECONDS * SECOND, durationMs),
				waveformLevels: summarizeLevels(recordedLevelsRef.current),
				replacedRecordingId: null,
			};

			if (target.recording) {
				onReplace(target.recording, newRecording);
			} else {
				onAdd(newRecording);
			}

			setCurrentIndex(target.nextIndex);

			track('recording_finished', { duration_ms: newRecording.durationMs });
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

	const microphonePermission = usePermission('microphone');

	const { isRecording } = recorderState;
	const lastStepIndex = Math.min(recordings.length, MAX_RECORDINGS - 1);
	const playing = !!currentRecording && player.playingId === currentRecording.id;
	let shownMs = currentRecording ? (currentRecording.durationMs ?? currentDurationData ?? 0) : 0;

	let waveformLevels = EMPTY_WAVEFORM_LEVELS;
	let waveformColor = colors.border;
	let playedBarCount = 0;

	if (isRecording) {
		shownMs = recorderState.durationMillis;
		waveformLevels = recordingLevels;
		waveformColor = colors.orange;
	} else if (currentRecording?.waveformLevels) {
		waveformLevels = currentRecording.waveformLevels;
		waveformColor = colors.subtle;
		playedBarCount = playing ? Math.round(player.progress * WAVEFORM_BAR_COUNT) : 0;
	} else if (playing) {
		waveformColor = colors.subtle;
		playedBarCount = Math.round(player.progress * WAVEFORM_BAR_COUNT);
	}

	/** 녹음 경과 시간을 ref에 저장 */
	useEffect(() => {
		elapsedRef.current = recorderState.durationMillis;
	}, [recorderState.durationMillis]);

	/** 녹음 중 소리 크기를 파형 오른쪽 끝에 추가 */
	useEffect(() => {
		if (!isRecording) {
			return;
		}

		const level = meteringLevel(recorderState.metering);

		recordedLevelsRef.current = [...recordedLevelsRef.current, level];

		setRecordingLevels((prev) => [...prev.slice(1), level]);
	}, [isRecording, recorderState]);

	/** bottom sheet가 열려 있는 동안 녹음 수가 바뀌면 다음 빈 단계 선택 */
	useEffect(() => {
		if (visible) {
			setCurrentIndex(Math.min(recordings.length, MAX_RECORDINGS - 1));
		}
	}, [visible, recordings.length]);

	/** bottom sheet가 열리면 오디오 모드 설정 */
	useEffect(() => {
		if (!visible) {
			return undefined;
		}

		closingRef.current = false;

		setRecordingFileError(null);

		void setAudioModeAsync(PLAYBACK_MODE).catch((error: unknown) => reportError(error, 'recording_setup'));

		return () => {
			closingRef.current = true;

			if (recorder.getStatus().isRecording) {
				void recorder
					.stop()
					.then(() => {
						if (recorder.uri) {
							deleteRecordingFile(recorder.uri);
						}
					})
					.catch((error: unknown) => reportError(error, 'recording_cleanup'));
			}

			void setAudioModeAsync(PLAYBACK_MODE).catch((error: unknown) => reportError(error, 'recording_cleanup'));
		};
	}, [visible, recorder]);

	const handleStartRecording = async () => {
		if (busy) {
			return;
		}

		setBusy(true);
		setRecordingFileError(null);
		setRecordingLevels(EMPTY_WAVEFORM_LEVELS);

		recordedLevelsRef.current = [];

		const recordedCount = currentRecording ? recordings.length : recordings.length + 1;

		targetRef.current = {
			recording: currentRecording,
			nextIndex: recordedCount < MAX_RECORDINGS ? recordedCount : currentIndex,
		};

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

	/** 마이크 권한 확인 후 녹음 시작 */
	const handleRecord = () => {
		player.stop();

		void microphonePermission.run(() => void handleStartRecording());
	};

	const handleSelectStep = (index: number) => {
		if (isRecording || index < 0 || index > lastStepIndex) {
			return;
		}

		player.stop();

		setRecordingFileError(null);
		setCurrentIndex(index);
	};

	const handleTogglePlay = () => {
		if (currentRecording) {
			player.toggle(currentRecording.id, currentRecording.url);
		}
	};

	let actions = (
		<Button
			label={t('words.recorder.start')}
			icon={MicIcon}
			size="small"
			disabled={busy}
			onPress={handleRecord}
			style={ui.action}
		/>
	);

	if (isRecording) {
		actions = (
			<Button
				label={t('words.recorder.stop')}
				icon={SquareIcon}
				iconProps={{ fill: busy ? colors.subtle : colors.onFilled }}
				size="small"
				disabled={busy}
				onPress={() => void handleStopRecording()}
				style={ui.action}
			/>
		);
	} else if (currentRecording) {
		actions = (
			<>
				<Button
					label={t(playing ? 'common.sound.stop' : 'words.recorder.play')}
					icon={playing ? PauseIcon : PlayIcon}
					iconProps={{ fill: colors.text }}
					variant="secondary"
					size="small"
					onPress={handleTogglePlay}
					style={ui.action}
				/>
				<Button
					label={t('words.recorder.rerecord')}
					icon={MicIcon}
					size="small"
					disabled={busy}
					onPress={handleRecord}
					style={ui.action}
				/>
			</>
		);
	}

	return (
		<>
			<Sheet
				visible={visible}
				title={t('words.editor.recordingName', { index: currentIndex + 1 })}
				onClose={onClose}
				headerAction=<TextButton label={t('words.recorder.done')} disabled={isRecording} onPress={onClose} />
				dismissible={!isRecording}
			>
				{/*녹음 단계*/}
				<View accessibilityRole="tablist" style={styles.steps}>
					{Array.from({ length: MAX_RECORDINGS }, (_, index) => (
						<RecordingStepItem
							key={index}
							index={index}
							selected={index === currentIndex}
							recorded={index < recordings.length}
							locked={index > lastStepIndex}
							disabled={isRecording}
							onPress={() => handleSelectStep(index)}
						/>
					))}
				</View>

				{/*좌우로 밀면 단계가 바뀌고 누르면 녹음을 재생하는 녹음 상자*/}
				<PressableSurface
					accessibilityLabel={
						currentRecording ? t(playing ? 'common.sound.stop' : 'words.recorder.play') : undefined
					}
					disabled={isRecording}
					onPress={handleTogglePlay}
					onSwipeLeft={() => handleSelectStep(currentIndex + 1)}
					onSwipeRight={() => handleSelectStep(currentIndex - 1)}
					depth="none"
					cornerRadius="illustration"
					contentStyle={styles.recordingBox}
				>
					<View style={styles.waveform}>
						<AudioWaveform
							levels={waveformLevels}
							color={waveformColor}
							height={32}
							activeColor={colors.orange}
							activeCount={playedBarCount}
						/>
					</View>

					<View style={styles.timeContainer}>
						{isRecording && <View style={styles.recordingDot} />}
						<Copy accessibilityRole="timer" style={styles.time}>
							{formatTimer(shownMs)}
							<Copy style={styles.timeLimit}>{` / ${formatTimer(RECORDING_MAX_SECONDS * SECOND)}`}</Copy>
						</Copy>
					</View>
				</PressableSurface>

				<InlineError
					message={
						recordingFileError
							? t(`words.recorder.${recordingFileError}`)
							: player.failedId
								? t('common.sound.playError')
								: null
					}
				/>

				<View style={ui.actionsRow}>{actions}</View>
			</Sheet>

			<PermissionDialog state={microphonePermission.dialog} />
		</>
	);
};

const styles = StyleSheet.create({
	steps: { flexDirection: 'row', gap: 8 },
	recordingBox: { overflow: 'hidden' },
	waveform: { paddingHorizontal: 24, paddingVertical: 30 },
	timeContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		paddingVertical: 16,
		borderTopWidth: 2,
		borderTopColor: colors.border,
	},
	recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.orange },
	time: { fontFamily: font.extraBold, fontSize: 16, lineHeight: 22, fontVariant: ['tabular-nums'] },
	timeLimit: { color: colors.subtle },
});

export default RecordingSheet;
