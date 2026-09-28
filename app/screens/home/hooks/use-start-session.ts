import { useState } from 'react';

import { ApiError } from '@/types/apis/common';

import type { SessionSetup } from '@/types/navigation';

import {
	getRunningSessionOptions,
	useFinishSession,
	useStartSession as useStartSessionRequest,
} from '@/hooks/apis/sessions';

import { queryClient } from '@/lib/query-client';

import type { StartDialogState } from '@/screens/home/components/start-dialogs';
import { reportError } from '@/services/telemetry/client';

type StartSessionState = StartDialogState & { start(sessionSetup: SessionSetup): void };

export function useStartSession(
	onStarted: (sessionId: string, sessionSetup: SessionSetup, endsAt: number | null) => void,
): StartSessionState {
	const [pending, setPending] = useState<SessionSetup | null>(null);
	const [takeoverOpen, setTakeoverOpen] = useState(false);

	const startSession = useStartSessionRequest();
	const finishSession = useFinishSession();

	function start(sessionSetup: SessionSetup) {
		const endsAt = sessionSetup.duration.ms === null ? null : Date.now() + sessionSetup.duration.ms;

		setPending(sessionSetup);
		setTakeoverOpen(false);

		startSession.mutate(
			{
				data: {
					word_id: sessionSetup.wordId,
					ends_at: endsAt === null ? null : new Date(endsAt).toISOString(),
					sleep: sessionSetup.sleep,
				},
			},
			{
				onSuccess: (session) => {
					setPending(null);

					onStarted(session.id, sessionSetup, endsAt);
				},
				onError: (error) => {
					if (error instanceof ApiError && error.code === 'SESSION__ALREADY_RUNNING') {
						startSession.reset();

						setTakeoverOpen(true);
					}
				},
			},
		);
	}

	async function finishRunningThenStart(sessionSetup: SessionSetup) {
		const running = await queryClient.query({
			...getRunningSessionOptions(),
			staleTime: 0,
		});

		if (running) {
			finishSession.mutate({ id: running.id }, { onSuccess: () => start(sessionSetup) });
		} else {
			start(sessionSetup);
		}
	}

	return {
		busy: startSession.isPending || finishSession.isPending,
		takeoverOpen,
		startFailed: startSession.isError || finishSession.isError,
		start,
		confirmTakeover: () => {
			if (pending) {
				setTakeoverOpen(false);

				finishRunningThenStart(pending).catch((error: unknown) => reportError(error, 'session_takeover'));
			}
		},
		retry: () => {
			if (pending) {
				finishSession.reset();

				start(pending);
			}
		},
		dismiss: () => {
			setTakeoverOpen(false);

			startSession.reset();
			finishSession.reset();
		},
	};
}
