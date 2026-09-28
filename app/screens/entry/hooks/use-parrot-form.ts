import { useState } from 'react';

import { ApiError } from '@/types/apis/common';
import type { Parrot } from '@/types/apis/parrots';

import {
	useCreateParrot,
	useDeleteParrot,
	useDeleteParrotPhoto,
	useUpdateParrot,
	useUploadParrotPhoto,
} from '@/hooks/apis/parrots';
import { usePhotoPicker } from '@/hooks/use-photo-picker';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import { randomUUID } from 'expo-crypto';

import { PARROT_NAME_LIMIT } from '@/config';
import { reportError } from '@/services/telemetry/client';
import { saveWithPhoto } from '@/utils/save-with-photo';
import { isSpeciesId } from '@/utils/species';

type Invalid = { name: boolean; species: boolean; birthday: boolean };

function isFuture(date: string | null | undefined): boolean {
	return Boolean(date) && dayjs(date).isAfter(dayjs());
}

type SpeciesField = {
	species: string;
	setSpecies(value: string): void;
	busy: boolean;
	speciesError: string | null;
};

type ParrotForm = {
	name: { value: string; onChange(value: string): void; error: string | null };
	photo: ReturnType<typeof usePhotoPicker>;
	species: SpeciesField;
	birthday: {
		value: string | null | undefined;
		onChange(value: string | null): void;
		error: string | null;
	};
	removal: {
		open: boolean;
		busy: boolean;
		error: string | null;
		ask(): void;
		close(): void;
		confirm(): void;
	};
	busy: boolean;
	ready: boolean;
	error: string | null;
	save(): void;
};

export function useParrotForm(parrot: Parrot | undefined, onDone: () => void): ParrotForm {
	const { t } = useTranslation();

	const known = parrot ? isSpeciesId(parrot.species) : false;

	const [name, setName] = useState(parrot?.name ?? '');
	const [species, setSpecies] = useState(known && parrot ? parrot.species : '');
	const [birthdate, setBirthdate] = useState<string | null | undefined>(parrot?.birthdate);
	const [invalid, setInvalid] = useState<Invalid>({
		name: false,
		species: false,
		birthday: false,
	});
	const [removing, setRemoving] = useState(false);
	const [idempotencyKey, setIdempotencyKey] = useState(() => randomUUID());

	const createParrot = useCreateParrot();
	const updateParrot = useUpdateParrot();
	const deleteParrot = useDeleteParrot();
	const uploadParrotPhoto = useUploadParrotPhoto();
	const deleteParrotPhoto = useDeleteParrotPhoto();

	const savedPhotoUrl = parrot?.photo?.url ?? null;

	const photo = usePhotoPicker(savedPhotoUrl);

	const busy =
		createParrot.isPending || updateParrot.isPending || uploadParrotPhoto.isPending || deleteParrotPhoto.isPending;
	const saveFailed =
		createParrot.isError || updateParrot.isError || uploadParrotPhoto.isError || deleteParrotPhoto.isError;

	const clear = (key: keyof Invalid) => setInvalid((current) => ({ ...current, [key]: false }));

	function save() {
		const trimmed = name.trim();
		const next = {
			name: trimmed.length < 1 || trimmed.length > PARROT_NAME_LIMIT,
			species: !isSpeciesId(species),
			birthday: isFuture(birthdate),
		};

		setInvalid(next);

		if (busy || next.name || next.species || next.birthday) {
			return;
		}

		const parrotInfo = { name: trimmed, species, birthdate: birthdate ?? null };

		saveWithPhoto({
			photoUri: photo.photoUri,
			savedPhotoUrl,
			saveInfo: () =>
				parrot
					? updateParrot.mutateAsync({ id: parrot.id, data: parrotInfo })
					: createParrot.mutateAsync(
							{ data: parrotInfo, idempotencyKey },
							{
								onSuccess: () => setIdempotencyKey(randomUUID()),
								onError: (error) => {
									if (error instanceof ApiError && error.rejected) {
										setIdempotencyKey(randomUUID());
									}
								},
							},
						),
			uploadPhoto: (saved, uri) => uploadParrotPhoto.mutateAsync({ id: saved.id, uri }),
			deletePhoto: (saved) => deleteParrotPhoto.mutateAsync({ id: saved.id }),
			onDone,
		}).catch((error: unknown) => reportError(error, 'parrot_save'));
	}

	function confirmRemoval() {
		if (!parrot) {
			return;
		}

		deleteParrot.mutate(
			{ id: parrot.id },
			{
				onSuccess: () => {
					setRemoving(false);

					onDone();
				},
			},
		);
	}

	return {
		name: {
			value: name,
			onChange: (value: string) => {
				setName(value);
				clear('name');
			},
			error: invalid.name ? t('parrot.nameRequired') : null,
		},
		photo,
		species: {
			species,
			setSpecies: (value: string) => {
				setSpecies(value);
				clear('species');
			},
			busy,
			speciesError: invalid.species ? t('parrot.speciesRequired') : null,
		},
		birthday: {
			value: birthdate,
			onChange: (value: string | null) => {
				setBirthdate(value);
				clear('birthday');
			},
			error: invalid.birthday ? t('parrot.birthdayInvalid') : null,
		},
		removal: {
			open: removing,
			busy: deleteParrot.isPending,
			error: deleteParrot.isError ? t('entry.parrot.deleteError') : null,
			ask: () => setRemoving(true),
			close: () => {
				deleteParrot.reset();

				setRemoving(false);
			},
			confirm: confirmRemoval,
		},
		busy,
		ready: name.trim().length > 0 && isSpeciesId(species) && birthdate !== undefined,
		error: saveFailed ? t('common.saveErrorKept') : null,
		save,
	};
}
