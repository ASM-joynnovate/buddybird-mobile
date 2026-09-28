import { type ReactElement, useEffect, useRef, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/types/apis/common';
import type { Recording } from '@/types/apis/words';

import type { RecordedSample, RootStackParamList, WordsStackParamList } from '@/types/navigation';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';
import {
	getWordOptions,
	useAddWordRecording,
	useCreateWord,
	useDeleteWordRecording,
	useRenameWord,
} from '@/hooks/apis/words';
import { usePermission } from '@/hooks/use-permission';
import { useSoundPlayer } from '@/hooks/use-sound-player';

import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { queryClient } from '@/lib/query-client';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { randomUUID } from 'expo-crypto';
import { TrashIcon } from 'lucide-react-native';

import { UPLOAD_POLL_INTERVAL_MS, UPLOAD_POLL_MAX_INTERVAL_MS, WORD_NAME_LIMIT } from '@/config';
import { DeleteWordDialog } from '@/screens/words/components/delete-word-dialog';
import { RecordingsSection } from '@/screens/words/components/recordings-section';
import type { EditorRecording } from '@/screens/words/components/recordings-section/recording-item';
import { reportError, track } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';

import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';
import { PermissionDialog } from '@/components/dialogs/permission-dialog';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { InlineError } from '@/components/ui/inline-error';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';
import { TextField } from '@/components/ui/text-field';

type SaveStep = 'saving' | 'uploading' | 'processing';

type DeleteTarget = { kind: 'word' } | { kind: 'recording'; recording: EditorRecording; name: string };

/** 정한 시간 동안 대기 */
const wait = (ms: number) =>
	new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});

/** 서버 녹음을 편집 화면 녹음으로 변환 */
const toEditorRecording = (serverRecording: Recording): EditorRecording => ({
	kind: 'server',
	id: serverRecording.id,
	url: serverRecording.url,
	durationMs: null,
});

/** 저장 단계와 실패 여부에 맞는 저장 버튼 문구 */
const saveLabel = (saveStep: SaveStep | null, saveFailed: boolean, t: TFunction) => {
	if (saveStep) {
		return t(`words.editor.${saveStep}`);
	}

	return saveFailed ? t('common.retry') : t('words.editor.save');
};

export function WordEditorScreen(): ReactElement {
	const { t } = useTranslation();

	const route = useRoute<RouteProp<WordsStackParamList, 'WordEditor'>>();
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const [createdWordId, setCreatedWordId] = useState<string | null>(null);
	const [nameInput, setNameInput] = useState<string | null>(null);
	const [newRecordings, setNewRecordings] = useState<readonly RecordedSample[]>([]);
	const [removedRecordingIds, setRemovedRecordingIds] = useState<readonly string[]>([]);
	const [saveStep, setSaveStep] = useState<SaveStep | null>(null);
	const [saveFailed, setSaveFailed] = useState(false);
	const [saveAttempted, setSaveAttempted] = useState(false);
	const [createWordKey, setCreateWordKey] = useState(() => randomUUID());
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

	const mountedRef = useRef(true);
	const addedRecordingKeysRef = useRef(new Set<string>());

	const routeWordId = route.params?.wordId ?? null;
	const wordId = routeWordId ?? createdWordId;
	const {
		data: wordData,
		isPending,
		isError,
		refetch,
	} = useQuery({ ...getWordOptions({ id: wordId ?? '' }), enabled: !!wordId, throwOnError: false });

	const createWord = useCreateWord();
	const renameWord = useRenameWord();
	const addWordRecording = useAddWordRecording();
	const deleteWordRecording = useDeleteWordRecording();

	const seenGuides = useDeviceSettingsStore((state) => state.seenGuides);

	const microphonePermission = usePermission('microphone');

	const player = useSoundPlayer();

	const name = nameInput ?? wordData?.name ?? '';
	const keptServerRecordings = (wordData?.recordings ?? [])
		.map((serverRecording) => toEditorRecording(serverRecording))
		.filter((recording) => !removedRecordingIds.includes(recording.id));
	const recordings: EditorRecording[] = [
		...keptServerRecordings,
		...newRecordings.map((newRecording): EditorRecording => ({
			kind: 'local',
			id: newRecording.key,
			url: newRecording.uri,
			durationMs: newRecording.durationMs,
		})),
	];
	const nameMissing = saveAttempted && !name.trim();
	const recordingMissing = saveAttempted && recordings.length === 0;
	const saving = saveStep !== null;
	const wordName = name.trim();
	const loading = Boolean(routeWordId) && isPending;
	const loadFailed = Boolean(routeWordId) && isError;

	/** 화면이 열려 있는지 기록 */
	useEffect(() => {
		mountedRef.current = true;

		return () => {
			mountedRef.current = false;
		};
	}, []);

	/** 단어 만들기나 편집 시작 이벤트 전송 */
	useEffect(() => {
		if (routeWordId) {
			track('word_edit_started', { word_id: routeWordId });
		} else {
			track('word_create_started', {});
		}
	}, [routeWordId]);

	/** 녹음 화면에서 받은 새 녹음 추가 */
	useEffect(() => {
		const newRecording = route.params?.recorded;

		if (!newRecording || addedRecordingKeysRef.current.has(newRecording.key)) {
			return;
		}

		addedRecordingKeysRef.current = new Set([...addedRecordingKeysRef.current, newRecording.key]);

		setNewRecordings((prev) => [...prev, newRecording]);

		track('recording_finished', { duration_ms: newRecording.durationMs });
	}, [route.params?.recorded]);

	/** 녹음 목록에서 녹음 제거 */
	const removeRecording = (recording: EditorRecording) => {
		if (recording.kind === 'local') {
			setNewRecordings((prev) => prev.filter(({ key }) => key !== recording.id));
		} else {
			setRemovedRecordingIds((prev) => [...prev, recording.id]);
		}
	};

	/** 서버 녹음 수가 기대한 수에 이를 때까지 단어 다시 조회 */
	const waitForRecordings = async (savedWordId: string, expectedCount: number) => {
		let intervalMs = UPLOAD_POLL_INTERVAL_MS;

		while (mountedRef.current) {
			const latestWord = await queryClient.query({ ...getWordOptions({ id: savedWordId }), staleTime: 0 });

			if (latestWord.recordings.length >= expectedCount) {
				return latestWord;
			}

			await wait(intervalMs);

			intervalMs = Math.min(intervalMs * 2, UPLOAD_POLL_MAX_INTERVAL_MS);
		}

		return null;
	};

	/** 새 단어 만들기나 바뀐 단어 이름 저장 */
	const saveWordName = async () => {
		const trimmedName = name.trim();

		if (!wordId) {
			const createdWord = await createWord.mutateAsync(
				{ data: { name: trimmedName }, idempotencyKey: createWordKey },
				{
					onSuccess: () => setCreateWordKey(randomUUID()),
					onError: (error) => {
						if (error instanceof ApiError && error.rejected) {
							setCreateWordKey(randomUUID());
						}
					},
				},
			);

			setCreatedWordId(createdWord.id);

			return createdWord.id;
		}

		if (trimmedName !== wordData?.name) {
			await renameWord.mutateAsync({ id: wordId, data: { name: trimmedName } });

			setNameInput(trimmedName);
		}

		return wordId;
	};

	/** 녹음 화면이나 녹음 안내 화면 열기 */
	const handleOpenRecorder = () => {
		player.stop();

		void microphonePermission.run(() => {
			if (seenGuides.recording) {
				navigation.navigate('Recorder', { wordName });
			} else {
				navigation.navigate('RecordingGuide', { source: 'add', wordName });
			}
		});
	};

	/** 단어 이름 저장, 새 녹음 올리기, 서버 처리 대기, 녹음 삭제 뒤 화면 닫기 */
	const handleSave = async () => {
		if (saving) {
			return;
		}

		player.stop();

		setSaveAttempted(true);

		if (!name.trim() || recordings.length === 0) {
			return;
		}

		setSaveFailed(false);

		const expectedCount = (wordData?.recordings.length ?? 0) + newRecordings.length;
		const addedCount = newRecordings.length;
		const renamed = name.trim() !== wordData?.name;
		let savedWordId = wordId;

		try {
			setSaveStep('saving');

			savedWordId = await saveWordName();

			setSaveStep('uploading');

			for (const newRecording of newRecordings) {
				await addWordRecording.mutateAsync({ id: savedWordId, uri: newRecording.uri });

				setNewRecordings((prev) => prev.filter(({ key }) => key !== newRecording.key));
			}

			setSaveStep('processing');

			const latestWord = await waitForRecordings(savedWordId, expectedCount);

			if (!latestWord) {
				return;
			}

			setSaveStep('saving');

			const recordingIdsToDelete = removedRecordingIds.filter((recordingId) =>
				latestWord.recordings.some((recording) => recording.id === recordingId),
			);

			for (const recordingId of recordingIdsToDelete) {
				await deleteWordRecording.mutateAsync({ id: savedWordId, recordingId });
			}

			await invalidate(apiKeys.words.all());

			const recordingCount = latestWord.recordings.length - recordingIdsToDelete.length;

			if (routeWordId) {
				track('word_updated', {
					word_id: savedWordId,
					recording_count: recordingCount,
					added_count: addedCount,
					removed_count: recordingIdsToDelete.length,
					renamed,
				});
			} else {
				track('word_created', { word_id: savedWordId, recording_count: recordingCount });
			}

			if (mountedRef.current) {
				navigation.goBack();
			}
		} catch (e) {
			reportError(e, 'word_save');

			if (mountedRef.current) {
				setSaveFailed(true);

				if (savedWordId) {
					void invalidate(apiKeys.words.detail(savedWordId));
				}
			}
		} finally {
			if (mountedRef.current) {
				setSaveStep(null);
			}
		}
	};

	/** 녹음 삭제 확인 */
	const handleDeleteRecording = () => {
		if (deleteTarget?.kind !== 'recording') {
			return;
		}

		removeRecording(deleteTarget.recording);

		setDeleteTarget(null);
	};

	/** 단어 삭제 뒤 화면 닫기 */
	const handleWordDeleted = () => {
		setDeleteTarget(null);

		navigation.goBack();
	};

	let body: ReactElement;

	if (loading) {
		body = <Skeleton rows={3} />;
	} else if (loadFailed) {
		body = <ScreenError onRetry={() => void refetch()} />;
	} else {
		body = (
			<>
				{/*단어 이름*/}
				<TextField
					label={t('words.editor.name')}
					placeholder={t('words.editor.nameHint')}
					value={name}
					onChangeText={setNameInput}
					editable={!saving}
					maxLength={WORD_NAME_LIMIT}
					error={nameMissing ? t('words.editor.nameRequired') : null}
				/>

				{/*녹음 목록*/}
				<RecordingsSection
					recordings={recordings}
					recordingMissing={recordingMissing}
					saving={saving}
					wordName={wordName}
					player={player}
					onAdd={handleOpenRecorder}
					onDelete={(recording, recordingName) =>
						setDeleteTarget({ kind: 'recording', recording, name: recordingName })
					}
				/>

				{/*저장*/}
				<View style={styles.spacer} />
				<InlineError message={saveFailed ? t('words.editor.saveError') : null} />
				<Button
					label={saveLabel(saveStep, saveFailed, t)}
					loading={saving}
					onPress={() => void handleSave()}
					style={styles.save}
				/>
			</>
		);
	}

	return (
		<Screen>
			{/*헤더*/}
			<ScreenHeader
				title={t(routeWordId ? 'words.editor.editTitle' : 'words.editor.addTitle')}
				onBack={() => navigation.goBack()}
				right={
					routeWordId ? (
						<IconButton
							icon={TrashIcon}
							label={t('words.editor.delete')}
							variant="muted"
							disabled={saving}
							onPress={() => setDeleteTarget({ kind: 'word' })}
						/>
					) : null
				}
			/>

			{/*단어 편집*/}
			{body}

			{/*삭제 확인 다이얼로그*/}
			{!!routeWordId && (
				<DeleteWordDialog
					visible={deleteTarget?.kind === 'word'}
					word={{ id: routeWordId, name: wordName, recordings: wordData?.recordings ?? [] }}
					onClose={() => setDeleteTarget(null)}
					onDeleted={handleWordDeleted}
				/>
			)}
			<ConfirmDialog
				visible={deleteTarget?.kind === 'recording'}
				text={{
					title: t('common.confirmDelete.title', {
						name: deleteTarget?.kind === 'recording' ? deleteTarget.name : '',
					}),
					message: t('common.confirmDelete.message'),
				}}
				onConfirm={handleDeleteRecording}
				onClose={() => setDeleteTarget(null)}
			/>

			{/*마이크 권한 다이얼로그*/}
			<PermissionDialog state={microphonePermission.dialog} />
		</Screen>
	);
}

const styles = StyleSheet.create({
	spacer: { flex: 1, minHeight: 24 },
	save: { marginTop: 12 },
});
