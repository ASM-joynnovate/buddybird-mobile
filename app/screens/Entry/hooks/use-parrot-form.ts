import { useMutation } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import {
	deleteParrotPhotoMutationOptions,
	saveParrotMutationOptions,
	uploadParrotPhotoMutationOptions,
} from "@/hooks/apis/parrots"
import { usePhotoPicker } from "@/screens/Entry/hooks/use-photo-picker"
import { isSpeciesId } from "@/services/profile/species"
import type { CreateParrotRequest, Parrot } from "@/types/apis/parrots"

const MAX_NAME = 20
const MAX_AGE_YEARS = 100

type Invalid = { name: boolean; species: boolean; birthday: boolean }

function daysIn(year: number, month: number) {
	return new Date(year, month, 0).getDate()
}

function pad(value: number) {
	return String(value).padStart(2, "0")
}

function useBirthday(saved: string | null | undefined, clear: () => void) {
	const now = new Date()
	const initial = saved?.split("-").map(Number) ?? [now.getFullYear() - 1, now.getMonth() + 1, 1]
	const [unknownBirthday, setUnknownBirthday] = useState(saved === null)
	const [year, setYear] = useState(initial[0])
	const [month, setMonth] = useState(initial[1])
	const [day, setDay] = useState(initial[2])
	const [answered, setAnswered] = useState(saved !== undefined)
	const chosenDay = Math.min(day, daysIn(year, month))
	const earliest = Math.min(now.getFullYear() - MAX_AGE_YEARS, initial[0])

	function answer() {
		clear()
		setAnswered(true)
	}

	return {
		answered,
		answer,
		unknownBirthday,
		setUnknownBirthday: (value: boolean) => {
			answer()
			setUnknownBirthday(value)
		},
		year,
		setYear: (value: number) => {
			answer()
			setYear(value)
		},
		years: Array.from(
			{ length: now.getFullYear() - earliest + 1 },
			(_, index) => earliest + index,
		),
		month,
		setMonth: (value: number) => {
			answer()
			setMonth(value)
		},
		chosenDay,
		setDay: (value: number) => {
			answer()
			setDay(value)
		},
		days: Array.from({ length: daysIn(year, month) }, (_, index) => index + 1),
		value: unknownBirthday ? null : `${year}-${pad(month)}-${pad(chosenDay)}`,
		future: !unknownBirthday && new Date(year, month - 1, chosenDay).getTime() > now.getTime(),
	}
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
	birthday: ReturnType<typeof useBirthday> & { birthdayError: string | null }
	busy: boolean
	ready: boolean
	error: string | null
	save(): void
}

export function useParrotForm(parrot: Parrot | undefined, onSaved: () => void): ParrotForm {
	const { t } = useTranslation()

	const mutation = useMutation(saveParrotMutationOptions())
	const photoUpload = useMutation(uploadParrotPhotoMutationOptions())
	const photoDelete = useMutation(deleteParrotPhotoMutationOptions())
	const busy = mutation.isPending || photoUpload.isPending || photoDelete.isPending
	const saveFailed = mutation.isError || photoUpload.isError || photoDelete.isError

	const known = parrot ? isSpeciesId(parrot.species) : false
	const [name, setName] = useState(parrot?.name ?? "")
	const [species, setSpecies] = useState(known && parrot ? parrot.species : "")
	const [invalid, setInvalid] = useState<Invalid>({
		name: false,
		species: false,
		birthday: false,
	})
	const clear = (key: keyof Invalid) => setInvalid((current) => ({ ...current, [key]: false }))

	const savedPhotoUrl = parrot?.photo?.url ?? null
	const photo = usePhotoPicker(savedPhotoUrl)
	const birthday = useBirthday(parrot ? parrot.birthdate : undefined, () => clear("birthday"))

	function save() {
		const trimmed = name.trim()
		const next = {
			name: trimmed.length < 1 || trimmed.length > MAX_NAME,
			species: !isSpeciesId(species),
			birthday: birthday.future,
		}

		setInvalid(next)

		if (busy || next.name || next.species || next.birthday) {
			return
		}

		saveParrot({ name: trimmed, species, birthdate: birthday.value }).catch(() => undefined)
	}

	async function saveParrot(input: CreateParrotRequest) {
		const saved = await mutation.mutateAsync({
			id: parrot?.id ?? null,
			input,
			idempotencyKey: randomUUID(),
		})

		if (photo.photoUri && photo.photoUri !== savedPhotoUrl) {
			await photoUpload.mutateAsync({
				id: saved.id,
				uri: photo.photoUri,
				idempotencyKey: randomUUID(),
			})
		} else if (!photo.photoUri && savedPhotoUrl) {
			await photoDelete.mutateAsync({ id: saved.id, idempotencyKey: randomUUID() })
		}

		onSaved()
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
			...birthday,
			birthdayError: invalid.birthday ? t("parrot.birthdayInvalid") : null,
		},
		busy,
		ready: name.trim().length > 0 && isSpeciesId(species) && birthday.answered,
		error: saveFailed ? t("common.saveErrorKept") : null,
		save,
	}
}
