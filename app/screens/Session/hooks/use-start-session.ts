import { useMutation, useQueryClient } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useState } from "react"

import {
	finishSessionMutationOptions,
	runningSessionQueryOptions,
	startSessionMutationOptions,
} from "@/hooks/apis/sessions"
import { readPermission } from "@/services/device/permissions"
import { reportError } from "@/services/telemetry/client"
import { ApiError } from "@/types/apis/common"
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
	const queryClient = useQueryClient()
	const mutation = useMutation(startSessionMutationOptions())
	const finishing = useMutation(finishSessionMutationOptions())
	const [pending, setPending] = useState<SessionDraft | null>(null)
	const [takeoverOpen, setTakeoverOpen] = useState(false)

	function start(draft: SessionDraft) {
		if (draft.replaceRunning) {
			setPending(draft)
			finishRunningThenStart(draft).catch((error: unknown) =>
				reportError(error, "session_takeover"),
			)

			return
		}

		sendStartRequest(draft)
	}

	function sendStartRequest(draft: SessionDraft) {
		setPending(draft)
		setTakeoverOpen(false)
		mutation.mutate(
			{
				input: {
					word_id: draft.learningEnabled ? draft.wordId : null,
					learning_enabled: draft.learningEnabled,
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

	async function finishRunningThenStart(draft: SessionDraft) {
		const running = await queryClient.query({
			...runningSessionQueryOptions(),
			staleTime: 0,
		})

		if (running) {
			await finishing.mutateAsync({ id: running.id, idempotencyKey: randomUUID() })
		}

		sendStartRequest(draft)
	}

	return {
		busy: mutation.isPending || finishing.isPending,
		takeoverOpen,
		failed: mutation.isError || finishing.isError,
		start,
		confirmTakeover: () => {
			if (pending) {
				setTakeoverOpen(false)
				finishRunningThenStart(pending).catch((error: unknown) =>
					reportError(error, "session_takeover"),
				)
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
