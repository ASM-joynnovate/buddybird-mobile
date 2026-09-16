import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake"
import { useEffect, useId, useRef } from "react"

import { reportError } from "@/services/telemetry/client"

export function useKeepScreenAwake(running: boolean) {
	const owner = useId()
	const generation = useRef(0)

	useEffect(() => {
		if (!running) {
			return
		}

		const tag = `${owner}-${++generation.current}`
		const activation = activateKeepAwakeAsync(tag)
		const failed = (error: unknown) => reportError(error, "session_screen_awake")

		void activation.catch(failed)

		return () => {
			// Finish this activation before releasing its own tag, even after a quick pause.
			void activation.then(() => deactivateKeepAwake(tag)).catch(failed)
		}
	}, [owner, running])
}
