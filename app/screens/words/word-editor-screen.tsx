import { type ReactElement, useEffect, useRef, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { ApiError } from '@/types/apis/common';
import type { Recording } from '@/types/apis/words';

import type { RootStackParamList, WordsStackParamList } from '@/types/navigation';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';
import {
	getWordOptions,
	useAddWordRecording,
	useCreateWord,
	useDeleteWordRecording,
	useRenameWord,
} from '@/hooks/apis/words';
import useSoundPlayer from '@/hooks/use-sound-player';

import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { queryClient } from '@/lib/query-client';

import { type RouteProp, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { randomUUID } from 'expo-crypto';
import { TrashIcon } from 'lucide-react-native';

import { UPLOAD_POLL_INTERVAL_MS, UPLOAD_POLL_MAX_INTERVAL_MS, WORD_NAME_LIMIT } from '@/config';
import DeleteWordDialog from '@/screens/words/components/delete-word-dialog';
import RecordingSheet from '@/screens/words/components/recording-sheet';
import RecordingsSection from '@/screens/words/components/recordings-section';
import type { EditorRecording, NewRecording } from '@/screens/words/components/recordings-section/recording-item';
import { reportError, track } from '@/services/telemetry/client';
import { uploadedRecordings } from '@/utils/uploaded-recordings';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
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

/** ms 동안 대기하는 함수 */
const wait = (ms: number) =>
	new Promise<void>((resolve) => {
		setTimeout(resolve, ms);
	});

/** 서버 녹음을 편집 화면에서 사용할 녹음으로 변환하는 함수 */
const toEditorRecording = (serverRecording: Recording): EditorRecording => ({
	kind: 'server',
	id: serverRecording.id,
	url: serverRecording.audio_file.url,
	pending: serverRecording.audio_file.status === 'pending',
	durationMs: null,
	waveformLevels: null,
});

/** 새 녹음을 편집 화면에서 사용할 녹음으로 변환하는 함수 */
const toLocalRecording = (newRecording: NewRecording, uploading: boolean): EditorRecording => ({
	kind: 'local',
	id: newRecording.key,
	url: newRecording.uri,
	pending: uploading,
	durationMs: newRecording.durationMs,
	waveformLevels: newRecording.waveformLevels,
});

/** 저장 진행 상태에 맞는 저장 버튼 문구를 반환하는 함수 */
const saveLabel = (saveStep: SaveStep | null, saveFailed: boolean, t: TFunction) => {
	if (saveStep) {
		return t(`words.editor.${saveStep}`);
	}

	return saveFailed ? t('common.retry') : t('common.save');
};

/** 단어 편집 화면 */
const WordEditorScreen = () => {
	const { t } = useTranslation();

	const route = useRoute<RouteProp<WordsStackParamList, 'WordEditor'>>();
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
	const screenFocused = useIsFocused();

	const [createdWordId, setCreatedWordId] = useState<string | null>(null);
	const [nameInput, setNameInput] = useState<string | null>(null);
	const [newRecordings, setNewRecordings] = useState<readonly NewRecording[]>([]);
	const [uploadingRecordingKeys, setUploadingRecordingKeys] = useState<readonly string[]>([]);
	const [replacedRecordingIds, setReplacedRecordingIds] = useState<readonly string[]>([]);
	const [recordingIdsFailedToDelete, setRecordingIdsFailedToDelete] = useState<readonly string[]>([]);
	const [addedBeforeSaveCount, setAddedBeforeSaveCount] = useState(0);
	const [removedBeforeSaveCount, setRemovedBeforeSaveCount] = useState(0);
	const [saveStep, setSaveStep] = useState<SaveStep | null>(null);
	const [saveFailed, setSaveFailed] = useState(false);
	const [saveAttempted, setSaveAttempted] = useState(false);
	const [recordingAddBlocked, setRecordingAddBlocked] = useState(false);
	const [createWordKey, setCreateWordKey] = useState(() => randomUUID());
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
	const [recordingSheetOpen, setRecordingSheetOpen] = useState(false);

	const mountedRef = useRef(true);
	const wordCreationRef = useRef<Promise<string> | null>(null);

	const routeWordId = route.params?.wordId ?? null;
	const wordId = routeWordId ?? createdWordId;

	const {
		data: wordData,
		isPending,
		isError,
		isFetching,
		refetch,
	} = useQuery({
		...getWordOptions({ id: wordId ?? '' }),
		enabled: !!wordId,
		throwOnError: false,
		refetchInterval: (query) =>
			screenFocused && query.state.data?.recordings.some((recording) => recording.audio_file.status === 'pending')
				? UPLOAD_POLL_INTERVAL_MS
				: false,
	});

	const createWord = useCreateWord();
	const renameWord = useRenameWord();
	const addWordRecording = useAddWordRecording();
	const deleteWordRecording = useDeleteWordRecording();

	const player = useSoundPlayer();

	const name = nameInput ?? wordData?.name ?? '';
	const serverRecordings = wordData?.recordings ?? [];
	const recordings: EditorRecording[] = [
		...serverRecordings.flatMap((serverRecording) => {
			const replacement = newRecordings.find(
				({ replacedRecordingId }) => replacedRecordingId === serverRecording.id,
			);

			if (replacement) {
				return [toLocalRecording(replacement, uploadingRecordingKeys.includes(replacement.key))];
			}

			return replacedRecordingIds.includes(serverRecording.id) ? [] : [toEditorRecording(serverRecording)];
		}),
		...newRecordings
			.filter(({ replacedRecordingId }) => !serverRecordings.some(({ id }) => id === replacedRecordingId))
			.map((newRecording) => toLocalRecording(newRecording, uploadingRecordingKeys.includes(newRecording.key))),
	];
	const nameErrorShown = (saveAttempted || recordingAddBlocked) && !name.trim();
	const recordingMissing = saveAttempted && recordings.length === 0;
	const saving = saveStep !== null;
	const recordingUploading = uploadingRecordingKeys.length > 0;
	const wordUpdating = saving || recordingUploading || deleteWordRecording.isPending;
	const wordName = name.trim();
	const loading = Boolean(routeWordId) && isPending;
	const loadFailed = Boolean(routeWordId) && isError;

	/** 화면 mount 여부 기록 */
	useEffect(() => {
		mountedRef.current = true;

		return () => {
			mountedRef.current = false;
		};
	}, []);

	/** 화면 진입 시 단어 편집 시작 이벤트 전송 */
	useEffect(() => {
		if (routeWordId) {
			track('word_edit_started', { word_id: routeWordId });
		} else {
			track('word_create_started', {});
		}
	}, [routeWordId]);

	/** "새로 녹음"으로 대체한 이전 녹음 삭제 */
	useEffect(() => {
		const uploadedIds = uploadedRecordings(wordData?.recordings ?? []).map(({ id }) => id);
		const replacedId = replacedRecordingIds.find(
			(id) =>
				uploadedIds.includes(id) &&
				!recordingIdsFailedToDelete.includes(id) &&
				!newRecordings.some(({ replacedRecordingId }) => replacedRecordingId === id),
		);

		if (!wordId || !replacedId || uploadedIds.length < 2 || saving || deleteWordRecording.isPending) {
			return;
		}

		deleteWordRecording.mutate(
			{ id: wordId, recordingId: replacedId },
			{
				onSuccess: () => {
					setRemovedBeforeSaveCount((prev) => prev + 1);
					setReplacedRecordingIds((prev) => prev.filter((id) => id !== replacedId));
				},
				onError: (error) => {
					reportError(error, 'recording_delete');

					setRecordingIdsFailedToDelete((prev) => [...prev, replacedId]);
				},
			},
		);
	}, [
		wordId,
		wordData,
		replacedRecordingIds,
		recordingIdsFailedToDelete,
		newRecordings,
		saving,
		deleteWordRecording,
	]);

	/** pending 녹음이 없을 때까지 단어를 다시 조회하는 함수 */
	const waitForRecordings = async (savedWordId: string) => {
		let intervalMs = UPLOAD_POLL_INTERVAL_MS;

		while (mountedRef.current) {
			const latestWord = await queryClient.query({ ...getWordOptions({ id: savedWordId }), staleTime: 0 });

			if (!latestWord.recordings.some((recording) => recording.audio_file.status === 'pending')) {
				return latestWord;
			}

			await wait(intervalMs);

			intervalMs = Math.min(intervalMs * 2, UPLOAD_POLL_MAX_INTERVAL_MS);
		}

		return null;
	};

	/** 단어 이름 저장 함수 */
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

	/** 새 단어를 한 번만 만드는 함수 */
	const createWordOnce = () => {
		wordCreationRef.current ??= saveWordName().catch((error: unknown) => {
			wordCreationRef.current = null;

			throw error;
		});

		return wordCreationRef.current;
	};

	/** 녹음을 바로 서버에 올리는 함수 */
	const uploadRecording = async (newRecording: NewRecording) => {
		setUploadingRecordingKeys((prev) => [...prev, newRecording.key]);

		try {
			const savedWordId = wordId ?? (await createWordOnce());

			await addWordRecording.mutateAsync({ id: savedWordId, uri: newRecording.uri });

			setAddedBeforeSaveCount((prev) => prev + 1);
			setNewRecordings((prev) => prev.filter(({ key }) => key !== newRecording.key));
		} catch (e) {
			reportError(e, 'recording_upload');
		} finally {
			setUploadingRecordingKeys((prev) => prev.filter((key) => key !== newRecording.key));
		}
	};

	const handleOpenRecordingSheet = () => {
		if (!wordId && !name.trim()) {
			setRecordingAddBlocked(true);

			return;
		}

		player.stop();

		setRecordingSheetOpen(true);
	};

	const handleCloseRecordingSheet = () => {
		player.stop();

		setRecordingSheetOpen(false);
	};

	const handleAddRecording = (newRecording: NewRecording) => {
		setNewRecordings((prev) => [...prev, newRecording]);

		void uploadRecording(newRecording);
	};

	const handleReplaceRecording = (recording: EditorRecording, newRecording: NewRecording) => {
		if (recording.kind === 'local') {
			setNewRecordings((prev) =>
				prev.map((item) =>
					item.key === recording.id
						? { ...newRecording, replacedRecordingId: item.replacedRecordingId }
						: item,
				),
			);
		} else {
			setReplacedRecordingIds((prev) => [...prev, recording.id]);
			setNewRecordings((prev) => [...prev, { ...newRecording, replacedRecordingId: recording.id }]);
		}

		void uploadRecording(newRecording);
	};

	const handleSave = async () => {
		if (wordUpdating) {
			return;
		}

		player.stop();

		setSaveAttempted(true);

		if (!name.trim() || recordings.length === 0) {
			return;
		}

		setSaveFailed(false);

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

			const latestWord = await waitForRecordings(savedWordId);

			if (!latestWord) {
				return;
			}

			setSaveStep('saving');

			const recordingIdsToDelete = replacedRecordingIds.filter((recordingId) =>
				latestWord.recordings.some((recording) => recording.id === recordingId),
			);

			for (const recordingId of recordingIdsToDelete) {
				await deleteWordRecording.mutateAsync({ id: savedWordId, recordingId });
			}

			await invalidate(apiKeys.words.all());

			const recordingCount = uploadedRecordings(latestWord.recordings).length - recordingIdsToDelete.length;

			if (routeWordId) {
				track('word_updated', {
					word_id: savedWordId,
					recording_count: recordingCount,
					added_count: addedBeforeSaveCount + addedCount,
					removed_count: removedBeforeSaveCount + recordingIdsToDelete.length,
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
					await invalidate(apiKeys.words.detail(savedWordId));
				}
			}
		} finally {
			if (mountedRef.current) {
				setSaveStep(null);
			}
		}
	};

	const handleDeleteRecording = () => {
		if (deleteTarget?.kind !== 'recording' || deleteWordRecording.isPending) {
			return;
		}

		const { recording } = deleteTarget;

		if (recording.kind === 'local') {
			setNewRecordings((prev) => prev.filter(({ key }) => key !== recording.id));
		} else if (wordId) {
			deleteWordRecording.mutate(
				{ id: wordId, recordingId: recording.id },
				{
					onSuccess: () => setRemovedBeforeSaveCount((prev) => prev + 1),
					onError: (error) => reportError(error, 'recording_delete'),
					onSettled: () => setDeleteTarget(null),
				},
			);

			return;
		}

		setDeleteTarget(null);
	};

	const handleWordDeleted = () => {
		setDeleteTarget(null);

		navigation.goBack();
	};

	let body: ReactElement;

	if (loading) {
		body = <Skeleton blockCount={3} />;
	} else if (loadFailed) {
		body = <ScreenError loading={isFetching} onRetry={() => void refetch()} />;
	} else {
		body = (
			<>
				<TextField
					label={t('words.editor.name')}
					placeholder={t('words.editor.nameHint')}
					value={name}
					onChangeText={setNameInput}
					editable={!saving}
					maxLength={WORD_NAME_LIMIT}
					errorMessage={nameErrorShown ? t('words.editor.nameRequired') : null}
				/>

				<RecordingsSection
					recordings={recordings}
					recordingMissing={recordingMissing}
					saving={saving}
					player={player}
					onAdd={handleOpenRecordingSheet}
					onDelete={(recording, recordingName) =>
						setDeleteTarget({ kind: 'recording', recording, name: recordingName })
					}
				/>

				<View style={styles.spacer} />
				<InlineError message={saveFailed ? t('words.editor.saveError') : null} />
				<Button
					label={saveLabel(saveStep, saveFailed, t)}
					loading={wordUpdating}
					onPress={() => void handleSave()}
					style={styles.save}
				/>
			</>
		);
	}

	return (
		<Screen>
			<ScreenHeader
				title={t(routeWordId ? 'words.editor.editTitle' : 'words.editor.addTitle')}
				onBack={() => navigation.goBack()}
				trailing={
					routeWordId ? (
						<IconButton
							icon={TrashIcon}
							label={t('words.editor.delete')}
							variant="muted"
							disabled={wordUpdating}
							onPress={() => setDeleteTarget({ kind: 'word' })}
						/>
					) : null
				}
			/>

			{body}

			{/*단어 삭제 확인 다이얼로그*/}
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
				confirmStatus={{ busy: deleteWordRecording.isPending }}
				onConfirm={handleDeleteRecording}
				onClose={() => setDeleteTarget(null)}
			/>

			<RecordingSheet
				visible={recordingSheetOpen}
				recordings={recordings}
				player={player}
				onAdd={handleAddRecording}
				onReplace={handleReplaceRecording}
				onClose={handleCloseRecordingSheet}
			/>
		</Screen>
	);
};

const styles = StyleSheet.create({
	spacer: { flex: 1, minHeight: 24 },
	save: { marginTop: 12 },
});

export default WordEditorScreen;
