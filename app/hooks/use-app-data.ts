import { useContext } from "react"

import { AppContext } from "@/context/app-data"

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

export function useNeedsProfileOnboarding() {
	const { profile, migration } = useAppData()

	return !profile && migration.completed.includes("profile")
}
