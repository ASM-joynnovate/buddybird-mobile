import { useEffect, useRef } from 'react';

import { ApiError } from '@/types/apis/common';
import type { HeartbeatSummary } from '@/types/apis/sessions';

import type { SleepSettings } from '@/types/sleep-settings';

import { heartbeatMutationOptions } from '@/hooks/apis/sessions';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { HEARTBEAT_INTERVAL_MS } from '@/config';
import { currentSpan } from '@/utils/phases';

type HeartbeatInput = {
	sessionId: string;
	startedAt: string | null;
	sleep: SleepSettings | null;
	summaries(): HeartbeatSummary[];
	onEnded(): void;
};

export function useHeartbeat({ sessionId, startedAt, sleep, summaries, onEnded }: HeartbeatInput): void {
	const latest = useRef({ startedAt, sleep, summaries, onEnded });

	const { mutate } = useIdempotentMutation(heartbeatMutationOptions());

	useEffect(() => {
		latest.current = { startedAt, sleep, summaries, onEnded };
	}, [startedAt, sleep, summaries, onEnded]);

	useEffect(() => {
		function beat() {
			const { startedAt: sessionStartedAt, sleep: sleepSettings } = latest.current;
			const span =
				sessionStartedAt && sleepSettings
					? currentSpan(Date.parse(sessionStartedAt), Date.now(), sleepSettings)
					: null;

			mutate(
				{
					id: sessionId,
					data: {
						current_phase: span?.phase ?? null,
						phase_started_at: span ? new Date(span.start).toISOString() : null,
						timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
						summaries: latest.current.summaries(),
					},
				},
				{
					onError: (error) => {
						if (error instanceof ApiError && error.code === 'SESSION__NOT_RUNNING') {
							latest.current.onEnded();
						}
					},
				},
			);
		}

		beat();

		const timer = setInterval(beat, HEARTBEAT_INTERVAL_MS);

		return () => clearInterval(timer);
	}, [mutate, sessionId]);
}
