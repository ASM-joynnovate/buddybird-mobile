import { useEffect, useState } from "react"
import { Appearance } from "react-native"

import { bootstrap } from "@/services/bootstrap"
import { connectQueryLifecycle } from "@/services/lifecycle/query-client"
import { reportError } from "@/services/telemetry/client"

export function useAppBootstrap() {
	const [state, setState] = useState<"loading" | "ready" | "failed" | "headless">("loading")

	const [attempt, setAttempt] = useState(0)

	useEffect(connectQueryLifecycle, [])

	useEffect(() => {
		// Keep native controls consistent with the app's light surfaces.
		Appearance.setColorScheme("light")
	}, [])

	useEffect(() => {
		let mounted = true

		void bootstrap()
			.then((next) => {
				if (mounted) {
					setState(next)
				}
			})
			.catch((error) => {
				reportError(error, "bootstrap")

				if (mounted) {
					setState("failed")
				}
			})

		return () => {
			mounted = false
		}
	}, [attempt])

	function retry() {
		setState("loading")
		setAttempt((value) => value + 1)
	}

	const settled = state !== "loading"
	const ready = state === "ready" && settled

	return { state, ready, settled, retry }
}
