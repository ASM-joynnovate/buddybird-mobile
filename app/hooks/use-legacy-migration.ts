import { useCallback, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useCreateParrot, useUploadParrotPhoto } from '@/hooks/apis/parrots';
import { getWordListOptions, useAddWordRecording, useCreateWord, useUploadWordRecording } from '@/hooks/apis/words';

import { UPLOAD_POLL_INTERVAL_MS, UPLOAD_POLL_MAX_INTERVAL_MS } from '@/config';
import type { LegacyWord } from '@/services/migration/legacy/words';
import {
	acceptLegacyUpload,
	ensureIdempotencyKey,
	existingFileUri,
	getLegacyMigration,
	getPendingLegacyUpload,
	recordWordProgress,
	removeRejectedIdempotencyKey,
	setLegacyMigration,
	withoutIdempotencyKey,
} from '@/services/migration/upload-legacy';
import type { LegacyProfile } from '@/utils/legacy';
import { wait } from '@/utils/wait';

/** v1 데이터를 서버에 올리는 Hook */
const useLegacyMigration = () => {
	const queryClient = useQueryClient();

	const { mutateAsync: createParrot } = useCreateParrot();
	const { mutateAsync: uploadParrotPhoto } = useUploadParrotPhoto();
	const { mutateAsync: createWord } = useCreateWord();
	const { mutateAsync: addWordRecording } = useAddWordRecording();
	const { mutateAsync: uploadWordRecording } = useUploadWordRecording();

	const uploadPromiseRef = useRef<Promise<void> | undefined>(undefined);

	/** v1 데이터 업로드 함수 */
	const uploadLegacy = useCallback(() => {
		/** v1 앵무새 업로드 함수 */
		const uploadParrot = async (profile: LegacyProfile) => {
			const idempotencyKeyName = 'parrot';
			const parrotId =
				getLegacyMigration().parrotId ??
				(
					await createParrot({
						data: { name: profile.name, species: profile.species, birthdate: profile.birthDate },
						idempotencyKey: ensureIdempotencyKey(idempotencyKeyName),
					}).catch((error: unknown) => {
						removeRejectedIdempotencyKey(error, idempotencyKeyName);

						throw error;
					})
				).id;

			setLegacyMigration((migration) => ({
				...migration,
				parrotId,
				idempotencyKeys: withoutIdempotencyKey(migration.idempotencyKeys, idempotencyKeyName),
			}));

			if (!profile.photoUri || getLegacyMigration().photoUploaded) {
				return;
			}

			const photoUri = await existingFileUri(profile.photoUri, 'legacy_photo');

			if (photoUri) {
				await uploadParrotPhoto({ id: parrotId, uri: photoUri });
			}

			setLegacyMigration((migration) => ({ ...migration, photoUploaded: true }));
		};

		/** v1 단어 업로드 함수 */
		const uploadWord = async (word: LegacyWord) => {
			const savedProgress = getLegacyMigration().wordProgress[word.id];

			if (savedProgress?.done) {
				return;
			}

			const recordingUri = await existingFileUri(word.audioUri, 'legacy_recording');

			if (!recordingUri) {
				recordWordProgress(word.id, { wordId: savedProgress?.wordId ?? null, done: true });

				return;
			}

			const idempotencyKeyName = `word:${word.id}`;
			const wordId =
				savedProgress?.wordId ??
				(
					await createWord({
						data: { name: word.name },
						idempotencyKey: ensureIdempotencyKey(idempotencyKeyName),
					}).catch((error: unknown) => {
						removeRejectedIdempotencyKey(error, idempotencyKeyName);

						throw error;
					})
				).id;

			setLegacyMigration((migration) => ({
				...migration,
				wordProgress: { ...migration.wordProgress, [word.id]: { wordId, done: false } },
				idempotencyKeys: withoutIdempotencyKey(migration.idempotencyKeys, idempotencyKeyName),
			}));

			const upload = await addWordRecording({ id: wordId, uri: recordingUri });

			await uploadWordRecording({ upload, uri: recordingUri });

			recordWordProgress(word.id, { wordId, done: true });
		};

		/** pending 녹음이 없을 때까지 단어 목록을 다시 조회하는 함수 */
		const waitForRecordings = async () => {
			let intervalMs = UPLOAD_POLL_INTERVAL_MS;

			while (true) {
				const latestWordList = await queryClient.query({ ...getWordListOptions(), staleTime: 0 });

				if (
					!latestWordList.some((word) =>
						word.recordings.some((recording) => recording.audio_file.status === 'pending'),
					)
				) {
					return;
				}

				await wait(intervalMs);

				intervalMs = Math.min(intervalMs * 2, UPLOAD_POLL_MAX_INTERVAL_MS);
			}
		};

		if (uploadPromiseRef.current) {
			return uploadPromiseRef.current;
		}

		uploadPromiseRef.current = (async () => {
			const legacyUpload = getPendingLegacyUpload();

			if (!legacyUpload) {
				return;
			}

			acceptLegacyUpload();

			if (legacyUpload.profile) {
				await uploadParrot(legacyUpload.profile);
			}

			for (const word of legacyUpload.words) {
				await uploadWord(word);
			}

			await waitForRecordings();
		})().finally(() => {
			uploadPromiseRef.current = undefined;
		});

		return uploadPromiseRef.current;
	}, [queryClient, createParrot, uploadParrotPhoto, createWord, addWordRecording, uploadWordRecording]);

	return { uploadLegacy };
};

export default useLegacyMigration;
