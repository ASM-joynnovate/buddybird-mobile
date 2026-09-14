import { useNavigation, usePreventRemove } from "@react-navigation/native"

import { useEffect, useRef, useState } from "react"

import { useSession } from "@/hooks/use-session"
import { useKeepScreenAwake } from "@/screens/Session/hooks/use-keep-screen-awake"
import { screen, setSessionReplayPaused } from "@/services/telemetry/client"

export function useSessionControls(onContinue: () => void) {
	const session = useSession()
	const navigation = useNavigation()
	const { snapshot } = session
	const [busy, setBusy] = useState(false)
	const [commandError, setCommandError] = useState(false)
	const [confirmEnd, setConfirmEnd] = useState(false)
	const inFlight = useRef(false)
	const active = ["starting", "running", "paused", "interrupted", "stopping"].includes(
		snapshot.state,
	)
	const paused = snapshot.state === "paused" || snapshot.state === "interrupted"

	useKeepScreenAwake(snapshot.state === "running")

	useEffect(() => {
		screen("session_active")
		setSessionReplayPaused(true)

		return () => setSessionReplayPaused(false)
	}, [])
	usePreventRemove(active, () => {
		if (inFlight.current) {
			return
		}

		setConfirmEnd(true)
	})

	async function command(action: () => Promise<void>) {
		if (inFlight.current) {
			return
		}

		inFlight.current = true
		setBusy(true)
		setCommandError(false)

		try {
			await action()
		} catch {
			setCommandError(true)
		} finally {
			inFlight.current = false
			setBusy(false)
		}
	}

	async function end() {
		if (snapshot.state === "failed") {
			await session.retryRecovery()
			onContinue()
		} else {
			await session.stop()
		}
	}

	function togglePause() {
		if (paused) {
			void command(session.resume)
		} else {
			void command(session.pause)
		}
	}

	return {
		session,
		snapshot,
		busy,
		commandError,
		confirmEnd: confirmEnd && active,
		closeConfirmation: () => setConfirmEnd(false),
		confirmExit: () => {
			setConfirmEnd(false)
			void command(end)
		},
		command,
		end,
		togglePause,
		goBack: () => navigation.goBack(),
	}
}
