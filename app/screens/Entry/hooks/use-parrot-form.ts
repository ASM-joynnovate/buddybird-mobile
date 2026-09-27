import { useState } from "react"
import { useTranslation } from "react-i18next"

import {
	deleteParrotMutationOptions,
	deleteParrotPhotoMutationOptions,
	saveParrotMutationOptions,
	uploadParrotPhotoMutationOptions,
} from "@/hooks/apis/parrots"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import { usePhotoPicker } from "@/hooks/use-photo-picker"
import { isSpeciesId } from "@/services/profile/species"
import { PARROT_NAME_LIMIT, type Parrot } from "@/types/apis/parrots"
import { saveWithPhoto } from "@/utils/save-with-photo"

type Invalid = { name: boolean; species: boolean; birthday: boolean }

function isFuture(date: string | null | undefined): boolean {
	return Boolean(date) && new Date(`${date}T00:00:00`).getTime() > Date.now()
}

type SpeciesField = {
	species: string
	setSpecies(value: string): void
	busy: boolean
	speciesError: string | null
}

export type ParrotForm = {
	name: { value: string; onChange(value: string): void; error: string | null }
	photo: ReturnType<typeof usePhotoPicker>
	species: SpeciesField
	birthday: {
		value: string | null | undefined
		onChange(value: string | null): void
		error: string | null
	}
	removal: {
		open: boolean
		busy: boolean
		error: string | null
		ask(): void
		close(): void
		confirm(): void
	}
	busy: boolean
	ready: boolean
	error: string | null
	save(): void
}

export function useParrotForm(parrot: Parrot | undefined, onDone: () => void): ParrotForm {
	const { t } = useTranslation()

	const mutation = useIdempotentMutation(saveParrotMutationOptions())
	const photoUpload = useIdempotentMutation(uploadParrotPhotoMutationOptions())
	const photoDelete = useIdempotentMutation(deleteParrotPhotoMutationOptions())
	const removal = useIdempotentMutation(deleteParrotMutationOptions())

	const known = parrot ? isSpeciesId(parrot.species) : false
	const savedPhotoUrl = parrot?.photo?.url ?? null

	const [name, setName] = useState(parrot?.name ?? "")
	const [species, setSpecies] = useState(known && parrot ? parrot.species : "")
	const [birthdate, setBirthdate] = useState<string | null | undefined>(parrot?.birthdate)
	const [invalid, setInvalid] = useState<Invalid>({
		name: false,
		species: false,
		birthday: false,
	})
	const [removing, setRemoving] = useState(false)

	const photo = usePhotoPicker(savedPhotoUrl)

	const busy = mutation.isPending || photoUpload.isPending || photoDelete.isPending
	const saveFailed = mutation.isError || photoUpload.isError || photoDelete.isError

	const clear = (key: keyof Invalid) => setInvalid((current) => ({ ...current, [key]: false }))

	function save() {
		const trimmed = name.trim()
		const next = {
			name: trimmed.length < 1 || trimmed.length > PARROT_NAME_LIMIT,
			species: !isSpeciesId(species),
			birthday: isFuture(birthdate),
		}

		setInvalid(next)

		if (busy || next.name || next.species || next.birthday) {
			return
		}

		saveWithPhoto({
			photoUri: photo.photoUri,
			savedPhotoUrl,
			saveInfo: () =>
				mutation.mutateAsync({
					id: parrot?.id ?? null,
					input: { name: trimmed, species, birthdate: birthdate ?? null },
				}),
			uploadPhoto: (saved, uri) => photoUpload.mutateAsync({ id: saved.id, uri }),
			deletePhoto: (saved) => photoDelete.mutateAsync({ id: saved.id }),
			onDone,
		}).catch(() => undefined)
	}

	function confirmRemoval() {
		if (!parrot) {
			return
		}

		removal.mutate(
			{ id: parrot.id },
			{
				onSuccess: () => {
					setRemoving(false)

					onDone()
				},
			},
		)
	}

	return {
		name: {
			value: name,
			onChange: (value: string) => {
				setName(value)
				clear("name")
			},
			error: invalid.name ? t("parrot.nameRequired") : null,
		},
		photo,
		species: {
			species,
			setSpecies: (value: string) => {
				setSpecies(value)
				clear("species")
			},
			busy,
			speciesError: invalid.species ? t("parrot.speciesRequired") : null,
		},
		birthday: {
			value: birthdate,
			onChange: (value: string | null) => {
				setBirthdate(value)
				clear("birthday")
			},
			error: invalid.birthday ? t("parrot.birthdayInvalid") : null,
		},
		removal: {
			open: removing,
			busy: removal.isPending,
			error: removal.isError ? t("entry.parrot.deleteError") : null,
			ask: () => setRemoving(true),
			close: () => {
				removal.reset()

				setRemoving(false)
			},
			confirm: confirmRemoval,
		},
		busy,
		ready: name.trim().length > 0 && isSpeciesId(species) && birthdate !== undefined,
		error: saveFailed ? t("common.saveErrorKept") : null,
		save,
	}
}
