import { useMutation } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useState } from "react"

import { startSessionMutationOptions } from "@/hooks/apis/sessions"
import { ApiError } from "@/lib/api"
import { readPermission } from "@/services/device/permissions"
import { reportError } from "@/services/telemetry/client"
import type { SessionDraft } from "@/types/navigation"

export type StartSessionState = {
	busy: boolean
	takeoverOpen: boolean
	failed: boolean
	start(draft: SessionDraft): void
	confirmTakeover(): void
	retry(): void
	dismiss(): void
}

export function useStartSession(onStarted: (sessionId: string) => void): StartSessionState {
	const mutation = useMutation(startSessionMutationOptions())
	const [pending, setPending] = useState<SessionDraft | null>(null)
	const [takeoverOpen, setTakeoverOpen] = useState(false)

	function start(draft: SessionDraft) {
		setPending(draft)
		setTakeoverOpen(false)
		mutation.mutate(
			{
				input: {
					word_id: draft.learningEnabled ? draft.wordId : null,
					learning_enabled: draft.learningEnabled,
					replace_running: draft.replaceRunning,
				},
				idempotencyKey: randomUUID(),
			},
			{
				onSuccess: (session) => {
					setPending(null)
					onStarted(session.id)
				},
				onError: (error) => {
					if (error instanceof ApiError && error.code === "SESSION__ALREADY_RUNNING") {
						mutation.reset()
						setTakeoverOpen(true)
					}
				},
			},
		)
	}

	return {
		busy: mutation.isPending,
		takeoverOpen,
		failed: mutation.isError,
		start,
		confirmTakeover: () => {
			if (pending) {
				start({ ...pending, replaceRunning: true })
			}
		},
		retry: () => {
			if (pending) {
				start(pending)
			}
		},
		dismiss: () => {
			setTakeoverOpen(false)
			mutation.reset()
		},
	}
}

export async function cameraGranted(): Promise<boolean> {
	try {
		return (await readPermission("camera")).granted
	} catch (error) {
		reportError(error, "permission_camera")

		return false
	}
}
