import { useContext } from "react"

import { AppContext } from "@/context/app-data"

export function useAppData() {
	const data = useContext(AppContext)

	if (!data) {
		throw new Error("AppProvider must finish migration first")
	}

	return data
}
