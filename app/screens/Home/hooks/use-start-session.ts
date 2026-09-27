import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import type { StartDialogState } from "@/components/session/start-dialogs"
import {
	finishSessionMutationOptions,
	runningSessionQueryOptions,
	startSessionMutationOptions,
} from "@/hooks/apis/sessions"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import { reportError } from "@/services/telemetry/client"
import { ApiError } from "@/types/apis/common"
import type { SessionDraft } from "@/types/navigation"

export type StartSessionState = StartDialogState & { start(draft: SessionDraft): void }

export function useStartSession(
	onStarted: (sessionId: string, draft: SessionDraft, endsAt: number | null) => void,
): StartSessionState {
	const queryClient = useQueryClient()

	const mutation = useIdempotentMutation(startSessionMutationOptions())
	const finishing = useIdempotentMutation(finishSessionMutationOptions())

	const [pending, setPending] = useState<SessionDraft | null>(null)
	const [takeoverOpen, setTakeoverOpen] = useState(false)

	function start(draft: SessionDraft) {
		const endsAt = draft.duration.ms === null ? null : Date.now() + draft.duration.ms

		setPending(draft)
		setTakeoverOpen(false)

		mutation.mutate(
			{
				input: {
					word_id: draft.wordId,
					ends_at: endsAt === null ? null : new Date(endsAt).toISOString(),
					sleep: draft.sleep,
				},
			},
			{
				onSuccess: (session) => {
					setPending(null)

					onStarted(session.id, draft, endsAt)
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
			await finishing.mutateAsync({ id: running.id })
		}

		start(draft)
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
				finishing.reset()

				start(pending)
			}
		},
		dismiss: () => {
			setTakeoverOpen(false)

			mutation.reset()
			finishing.reset()
		},
	}
}
