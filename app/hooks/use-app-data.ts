import { useContext, useMemo } from "react"

import { AppContext } from "@/context/app-data"
import { profileStats } from "@/services/profile/statistics"
import { visibleWords } from "@/services/words/selectors"
import type  { Locale } from "@/types/locale"

export function useAppData() {
	const data = useContext(AppContext)

	if (!data) {
		throw new Error("AppProvider must load app data first")
	}

	return data
}

export function useProfile() {
	return useAppData().profile
}

export function useVisibleWords(locale: Locale) {
	const data = useAppData()

	return useMemo(() => visibleWords(data, locale), [data, locale])
}

export function useUserWordCount() {
	const { words } = useAppData()

	return Object.values(words).filter((word) => !word.archived && word.sourceType === "recording")
		.length
}

export function useProfileStats() {
	return profileStats(useAppData())
}

export function useNeedsProfileOnboarding() {
	const { profile, migration } = useAppData()

	return !profile && migration.completed.includes("profile")
}
