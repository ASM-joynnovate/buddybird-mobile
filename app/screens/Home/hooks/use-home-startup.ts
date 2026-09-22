import { useMutation, useQueryClient } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useEffect, useState } from "react"

import type { Notice } from "@/apis/notices"
import { readNoticeMutationOptions } from "@/hooks/apis/notices"
import { finishSessionMutationOptions, runningSessionQueryOptions } from "@/hooks/apis/sessions"
import { reportError } from "@/services/telemetry/client"

const launch = { stationChecked: false, noticesShown: false }

export function useStaleStationCleanup(): void {
	const client = useQueryClient()
	const { mutate } = useMutation(finishSessionMutationOptions())

	useEffect(() => {
		if (launch.stationChecked) {
			return
		}

		launch.stationChecked = true
		client
			.query(runningSessionQueryOptions())
			.then((session) => {
				if (session?.station_device.is_current) {
					mutate({ id: session.id, idempotencyKey: randomUUID() })
				}
			})
			.catch((error: unknown) => reportError(error, "stale_station_session"))
	}, [client, mutate])
}

export function useNoticePopup(notices: readonly Notice[] | undefined): {
	current: Notice | null
	close(): void
} {
	const [queue, setQueue] = useState<readonly Notice[]>([])
	const { mutate } = useMutation(readNoticeMutationOptions())

	useEffect(() => {
		if (!notices || launch.noticesShown) {
			return
		}

		launch.noticesShown = true
		setQueue(notices)
	}, [notices])

	const current = queue[0] ?? null

	return {
		current,
		close: () => {
			if (current) {
				mutate({ id: current.id, idempotencyKey: randomUUID() })
				setQueue((items) => items.slice(1))
			}
		},
	}
}
