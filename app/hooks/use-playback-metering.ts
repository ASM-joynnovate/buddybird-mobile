import { useEffect, useState } from "react"

import { engine } from "@/services/session/session"

export function usePlaybackMetering(playing: boolean) {
	const [decibels, setDecibels] = useState(-160)

	useEffect(() => {
		if (!playing) {
			return
		}

		const subscription = engine.addListener("onPlaybackMetering", (measurement) => {
			setDecibels(measurement.decibels)
		})

		return () => {
			subscription.remove()
			setDecibels(-160)
		}
	}, [playing])

	return decibels
}
