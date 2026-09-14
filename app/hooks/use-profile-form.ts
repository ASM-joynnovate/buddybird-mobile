import { useNavigation, usePreventRemove } from "@react-navigation/native"

import * as ImagePicker from "expo-image-picker"

import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { BackHandler } from "react-native"

import { useAppData } from "@/hooks/use-app-data"
import { saveProfile } from "@/services/profile/profile"
import { speciesIds } from "@/services/profile/species"
import { ageMonths } from "@/services/profile/statistics"
import { syncUserProperties, track } from "@/services/telemetry/client"
import type { ProfileOnboarding } from "@/types/profile"

export function useProfileForm(onboarding?: ProfileOnboarding) {
	const { t } = useTranslation()
	const { profile } = useAppData()
	const navigation = useNavigation()

	const now = new Date()
	const initialDate = profile?.birthDate?.split("-").map(Number) ?? [
		now.getFullYear() - 1,
		now.getMonth() + 1,
		1,
	]
	const savedSpecies = profile?.species ?? ""
	const hasKnownSpecies = speciesIds.includes(savedSpecies)
	const [name, setName] = useState(profile?.name ?? "")
	const [species, setSpecies] = useState(hasKnownSpecies ? savedSpecies : "")
	const [custom, setCustom] = useState(Boolean(savedSpecies && !hasKnownSpecies))
	const [customSpecies, setCustomSpecies] = useState(custom ? savedSpecies : "")
	const [unknownBirthday, setUnknownBirthday] = useState(Boolean(profile && !profile.birthDate))
	const [year, setYear] = useState(initialDate[0])
	const [month, setMonth] = useState(initialDate[1])
	const [day, setDay] = useState(initialDate[2])
	const [photoUri, setPhotoUri] = useState(profile?.photoUri)
	const [submitted, setSubmitted] = useState(false)
	const [busy, setBusy] = useState(false)
	const [saved, setSaved] = useState(false)
	const [error, setError] = useState<string | null>(null)
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
		!unknownBirthday && new Date(year, month - 1, chosenDay).getTime() > Date.now()
	const nameError = submitted && !name.trim() ? t("profile.nameRequired") : null
	const speciesError = submitted && !effectiveSpecies ? t("profile.speciesRequired") : null
	const birthdayError = submitted && futureBirthday ? t("profile.birthdayInvalid") : error

	usePreventRemove(!onboarding && busy, () => {})
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
				aspect: [1, 1],
				quality: 0.8,
			})

			if (!result.canceled) {
				setPhotoUri(result.assets[0].uri)
			}
		} catch {
			setError(t("profile.photoError"))
		} finally {
			onboarding?.onPhotoPickerChange(false)
		}
	}

	async function save() {
		setSubmitted(true)

		if (
			saving.current ||
			leaving.current ||
			!name.trim() ||
			!effectiveSpecies ||
			futureBirthday
		) {
			return
		}

		saving.current = true
		setBusy(true)
		setError(null)

		try {
			const saved = await saveProfile({
				name,
				species: effectiveSpecies,
				birthDate,
				photoUri,
			})
			const age = ageMonths(saved.birthDate)
			const properties = {
				parrot_name: saved.name,
				parrot_species: saved.species,
				...(age !== null ? { parrot_age_months: age } : {}),
			}

			syncUserProperties()

			if (onboarding) {
				track("profile_created", properties)
				onboarding.onComplete()
			} else {
				const fieldsChanged = (
					["name", "species", "birthDate", "photoUri"] as const
				).filter((key) => saved[key] !== profile?.[key])

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
		name: { name, setName, nameError },
		photo: { photoUri, choosePhoto, busy },
		species: {
			custom,
			setCustom,
			customSpecies,
			setCustomSpecies,
			species,
			setSpecies,
			busy,
			speciesError,
		},
		birthday: {
			unknownBirthday,
			setUnknownBirthday,
			year,
			setYear,
			years,
			month,
			setMonth,
			chosenDay,
			setDay,
			days,
			birthdayError,
		},
		busy,
		goBack,
		save,
	}
}
