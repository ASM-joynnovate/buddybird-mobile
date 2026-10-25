import { useRef } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { LegacyProfile } from '@/types/legacy';

import { apiKeys } from '@/hooks/apis/keys';
import { parrotKeys } from '@/hooks/apis/keys/parrots';
import { wordKeys } from '@/hooks/apis/keys/words';
import { useCreateParrot, useUploadParrotPhoto } from '@/hooks/apis/parrots';
import { getWordListOptions, useAddWordRecording, useCreateWord, useUploadWordRecording } from '@/hooks/apis/words';

import { UPLOAD_POLL_INTERVAL_MS } from '@/config/policy';
import type { LegacyWord } from '@/services/migration/legacy/words';
import {
	acceptLegacyUpload,
	ensureIdempotencyKey,
	finishLegacyUpload,
	existingFileUri,
	getLegacyMigration,
	getPendingLegacyUpload,
	recordWordProgress,
	removeRejectedIdempotencyKey,
	setLegacyMigration,
	withoutIdempotencyKey,
} from '@/services/migration/upload-legacy';
import { reportError } from '@/services/telemetry/client';
import { trackOnboardingStepCompleted } from '@/services/telemetry/onboarding';
import { hasPendingRecording } from '@/utils/uploaded-recordings';
import { nextUploadPollIntervalMs, wait } from '@/utils/wait';

/** v1 데이터를 서버에 올리는 Hook */
const useUploadLegacy = () => {
	const queryClient = useQueryClient();

	const uploadPromiseRef = useRef<Promise<void> | undefined>(undefined);

	const { mutateAsync: createParrot } = useCreateParrot();
	const { mutateAsync: uploadParrotPhoto } = useUploadParrotPhoto();
	const { mutateAsync: createWord } = useCreateWord();
	const { mutateAsync: addWordRecording } = useAddWordRecording();
	const { mutateAsync: uploadWordRecording } = useUploadWordRecording();

	/** v1 데이터 업로드 함수 */
	const uploadLegacy = () => {
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

			setLegacyMigration((prev) => ({
				...prev,
				parrotId,
				idempotencyKeys: withoutIdempotencyKey(prev.idempotencyKeys, idempotencyKeyName),
			}));

			if (!profile.photoUri || getLegacyMigration().photoUploaded) {
				return;
			}

			const photoUri = await existingFileUri(profile.photoUri, 'legacy_photo');

			if (photoUri) {
				await uploadParrotPhoto({ id: parrotId, uri: photoUri });
			}

			setLegacyMigration((prev) => ({ ...prev, photoUploaded: true }));
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

			setLegacyMigration((prev) => ({
				...prev,
				wordProgress: { ...prev.wordProgress, [word.id]: { wordId, done: false } },
				idempotencyKeys: withoutIdempotencyKey(prev.idempotencyKeys, idempotencyKeyName),
			}));

			const recordingUpload = await addWordRecording({ id: wordId, uri: recordingUri });

			await uploadWordRecording({ upload: recordingUpload, uri: recordingUri });

			recordWordProgress(word.id, { wordId, done: true });
		};

		/** pending 녹음이 없을 때까지 단어 목록 조회 함수 */
		const waitForRecordings = async () => {
			let intervalMs = UPLOAD_POLL_INTERVAL_MS;

			while (true) {
				const latestWordList = await queryClient.query({ ...getWordListOptions(), staleTime: 0 });

				if (!latestWordList.some((word) => hasPendingRecording(word.recordings))) {
					return;
				}

				await wait(intervalMs);

				intervalMs = nextUploadPollIntervalMs(intervalMs);
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
	};

	return useMutation({
		mutationKey: apiKeys.mutation('legacy', 'upload'),
		mutationFn: uploadLegacy,
		retry: false,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: parrotKeys.all() }),
				queryClient.invalidateQueries({ queryKey: wordKeys.all() }),
			]);

			trackOnboardingStepCompleted('legacy_upload');

			finishLegacyUpload();
		},
		onError: (error) => reportError(error, 'legacy_upload'),
	});
};

export default useUploadLegacy;
