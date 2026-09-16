import { useNavigation, usePreventRemove } from "@react-navigation/native"
import * as ImagePicker from "expo-image-picker"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { BackHandler } from "react-native"

import { useProfile } from "@/hooks/use-app-data"
import { saveProfile } from "@/services/profile/profile"
import { speciesIds } from "@/services/profile/species"
import { ageMonths } from "@/services/profile/statistics"
import { syncUserProperties, track } from "@/services/telemetry/client"
import type { ProfileOnboarding } from "@/types/profile"

export function useProfileForm(onboarding?: ProfileOnboarding) {
	const { t } = useTranslation()
	const profile = useProfile()
	const navigation = useNavigation()

	const initial = onboarding?.draft ?? profile
	const now = new Date()
	const initialDate = initial?.birthDate?.split("-").map(Number) ?? [
		now.getFullYear() - 1,
		now.getMonth() + 1,
		1,
	]
	const savedSpecies = initial?.species ?? ""
	const hasKnownSpecies = speciesIds.includes(savedSpecies)
	const [name, setName] = useState(initial?.name ?? "")
	const [species, setSpecies] = useState(hasKnownSpecies ? savedSpecies : "")
	const [custom, setCustom] = useState(Boolean(savedSpecies && !hasKnownSpecies))
	const [customSpecies, setCustomSpecies] = useState(custom ? savedSpecies : "")
	const [unknownBirthday, setUnknownBirthday] = useState(Boolean(initial && !initial.birthDate))
	const [year, setYear] = useState(initialDate[0])
	const [month, setMonth] = useState(initialDate[1])
	const [day, setDay] = useState(initialDate[2])
	const [photoUri, setPhotoUri] = useState(initial?.photoUri)
	const [invalid, setInvalid] = useState({ name: false, species: false, birthday: false })
	const [busy, setBusy] = useState(false)
	const [saved, setSaved] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [photoError, setPhotoError] = useState<string | null>(null)
	const saving = useRef(false)
	const leaving = useRef(false)
	const effectiveSpecies = (custom ? customSpecies : species).trim()
	const days = Array.from({ length: new Date(year, month, 0).getDate() }, (_, index) => index + 1)
	const earliestYear = Math.min(now.getFullYear() - 100, initialDate[0])
	const years = Array.from(
		{ length: now.getFullYear() - earliestYear + 1 },
		(_, index) => earliestYear + index,
	)
	const chosenDay = Math.min(day, days.length)
	const birthDate = unknownBirthday
		? null
		: `${year}-${String(month).padStart(2, "0")}-${String(chosenDay).padStart(2, "0")}`
	const futureBirthday =
		!unknownBirthday && new Date(year, month - 1, chosenDay).getTime() > now.getTime()
	const nameError = invalid.name ? t("profile.nameRequired") : null
	const speciesError = invalid.species ? t("profile.speciesRequired") : null
	const birthdayError = invalid.birthday ? t("profile.birthdayInvalid") : null

	usePreventRemove(busy, () => {})
	useEffect(() => {
		if (!onboarding) {
			return
		}

		const back = BackHandler.addEventListener("hardwareBackPress", () => {
			if (!saving.current && !leaving.current) {
				leaving.current = true
				onboarding.onBack()
			}

			return true
		})

		return () => back.remove()
	}, [onboarding])
	useEffect(() => {
		if (saved && !busy && !onboarding && navigation.isFocused() && navigation.canGoBack()) {
			navigation.goBack()
		}
	}, [saved, busy, onboarding, navigation])

	function goBack() {
		if (saving.current || leaving.current) {
			return
		}

		if (onboarding) {
			leaving.current = true
			onboarding.onBack()
		} else if (navigation.canGoBack()) {
			leaving.current = true
			navigation.goBack()
		}
	}

	async function choosePhoto() {
		onboarding?.onPhotoPickerChange(true)

		try {
			const result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ["images"],
				allowsEditing: true,
				quality: 0.85,
			})

			if (!result.canceled) {
				setPhotoUri(result.assets[0].uri)
				setPhotoError(null)
			}
		} catch {
			setPhotoError(t("profile.photoError"))
		} finally {
			onboarding?.onPhotoPickerChange(false)
		}
	}

	async function save() {
		setInvalid({ name: !name.trim(), species: !effectiveSpecies, birthday: futureBirthday })

		if (
			saving.current ||
			leaving.current ||
			!name.trim() ||
			!effectiveSpecies ||
			futureBirthday
		) {
			return
		}

		onboarding?.onDraft({ name, species: effectiveSpecies, birthDate, photoUri })
		saving.current = true
		setBusy(true)
		setError(null)

		try {
			const savedProfile = await saveProfile({
				name,
				species: effectiveSpecies,
				birthDate,
				photoUri,
			})
			const age = ageMonths(savedProfile.birthDate)
			const properties = {
				parrot_name: savedProfile.name,
				parrot_species: savedProfile.species,
				...(age !== null ? { parrot_age_months: age } : {}),
			}

			syncUserProperties()

			if (onboarding) {
				track("profile_created", properties)
				onboarding.onComplete()
			} else {
				const fieldsChanged = (
					["name", "species", "birthDate", "photoUri"] as const
				).filter((key) => savedProfile[key] !== profile?.[key])

				if (fieldsChanged.length) {
					track("profile_updated", { ...properties, fields_changed: fieldsChanged })
				}
			}

			leaving.current = true
			setSaved(true)
		} catch {
			saving.current = false
			setError(t("profile.saveError"))
		} finally {
			setBusy(false)
		}
	}

	return {
		name: {
			name,
			setName: (value: string) => {
				setName(value)
				setInvalid((current) => ({ ...current, name: false }))
			},
			nameError,
		},
		photo: { photoUri, choosePhoto, busy, error: photoError },
		species: {
			custom,
			setCustom: (value: boolean) => {
				setCustom(value)
				setSpecies("")
				setCustomSpecies("")
			},
			customSpecies,
			setCustomSpecies: (value: string) => {
				setCustomSpecies(value)
				setInvalid((current) => ({ ...current, species: false }))
			},
			species,
			setSpecies: (value: string) => {
				setSpecies(value)
				setInvalid((current) => ({ ...current, species: false }))
			},
			busy,
			speciesError,
		},
		birthday: {
			unknownBirthday,
			setUnknownBirthday: (value: boolean) => {
				setUnknownBirthday(value)
				setInvalid((current) => ({ ...current, birthday: false }))
			},
			year,
			setYear: (value: number) => {
				setInvalid((current) => ({ ...current, birthday: false }))
				setYear(value)
				setDay((current) => Math.min(current, new Date(value, month, 0).getDate()))
			},
			years,
			month,
			setMonth: (value: number) => {
				setInvalid((current) => ({ ...current, birthday: false }))
				setMonth(value)
				setDay((current) => Math.min(current, new Date(year, value, 0).getDate()))
			},
			chosenDay,
			setDay: (value: number) => {
				setDay(value)
				setInvalid((current) => ({ ...current, birthday: false }))
			},
			days,
			birthdayError,
		},
		busy,
		error,
		goBack,
		save,
	}
}
