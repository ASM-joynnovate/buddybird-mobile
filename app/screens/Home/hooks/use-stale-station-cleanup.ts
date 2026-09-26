import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { devicesQueryOptions } from "@/hooks/apis/devices"
import { finishSessionMutationOptions, runningSessionQueryOptions } from "@/hooks/apis/sessions"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import { launch } from "@/screens/Home/hooks/launch"
import { reportError } from "@/services/telemetry/client"
import { useAccountStore } from "@/stores/account"

export function useStaleStationCleanup(): void {
	const client = useQueryClient()

	const { mutate } = useIdempotentMutation(finishSessionMutationOptions())

	useEffect(() => {
		if (launch.stationChecked) {
			return
		}

		launch.stationChecked = true

		Promise.all([
			client.query(runningSessionQueryOptions()),
			client.query(devicesQueryOptions()),
		])
			.then(([session, devices]) => {
				const station = devices.find((device) => device.id === session?.station.device_id)

				if (
					session &&
					station?.client_device_id === useAccountStore.getState().ensureClientDeviceId()
				) {
					mutate({ id: session.id })
				}
			})
			.catch((error: unknown) => reportError(error, "stale_station_session"))
	}, [client, mutate])
}
