import { useCallback, useEffect, useRef, useState } from "react"

import { STATION_SCREEN_IDLE_MS } from "@/config"

export function useIdleReveal(): { visible: boolean; reveal(): void } {
	const [visible, setVisible] = useState(false)

	const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

	const reveal = useCallback(() => {
		setVisible(true)

		if (timer.current) {
			clearTimeout(timer.current)
		}

		timer.current = setTimeout(() => setVisible(false), STATION_SCREEN_IDLE_MS)
	}, [])

	useEffect(
		() => () => {
			if (timer.current) {
				clearTimeout(timer.current)
			}
		},
		[],
	)

	return { visible, reveal }
}
