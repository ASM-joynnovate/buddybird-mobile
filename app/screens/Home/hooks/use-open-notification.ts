import { type CompositeNavigationProp, useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"

import type { AppNotification } from "@/apis/notifications"
import { readNotificationMutationOptions } from "@/hooks/apis/notifications"
import { runningSessionQueryOptions } from "@/hooks/apis/sessions"
import { reportError } from "@/services/telemetry/client"
import type { HomeStackParamList, RootStackParamList } from "@/types/navigation"

type Navigation = CompositeNavigationProp<
	NativeStackNavigationProp<HomeStackParamList, "Notifications">,
	NativeStackNavigationProp<RootStackParamList>
>

export function useOpenNotification(): (item: AppNotification) => void {
	const navigation = useNavigation<Navigation>()
	const client = useQueryClient()
	const { mutate } = useMutation(readNotificationMutationOptions())

	async function openMonitorIfRunning() {
		try {
			if (await client.query(runningSessionQueryOptions())) {
				navigation.navigate("SessionMonitor")
			}
		} catch (error) {
			reportError(error, "notification_station_disconnect")
		}
	}

	function route(item: AppNotification) {
		if (item.kind === "emergency" && item.emergency_event_id) {
			navigation.navigate("Main", {
				screen: "RecordsTab",
				params: {
					screen: "EmergencyDetail",
					params: { emergencyId: item.emergency_event_id },
				},
			})
		} else if (item.kind === "mimicry" && item.session_id) {
			navigation.navigate("Main", {
				screen: "RecordsTab",
				params: {
					screen: "SessionDetail",
					params: { sessionId: item.session_id, soundId: item.sound_id ?? undefined },
				},
			})
		} else if (item.kind === "station_disconnect") {
			void openMonitorIfRunning()
		} else if (item.kind === "daily_summary") {
			navigation.navigate("Main", {
				screen: "ReportTab",
				params: {
					screen: "Report",
					params: { period: "day", date: item.report_date ?? undefined },
				},
			})
		} else if (item.kind === "streak") {
			navigation.navigate("Main", { screen: "ReportTab", params: { screen: "Report" } })
		} else if (item.kind === "notice" && item.notice_id) {
			navigation.navigate("NoticeDetail", { noticeId: item.notice_id })
		}
	}

	return (item) => {
		if (!item.read_at) {
			mutate({ id: item.id, idempotencyKey: randomUUID() })
		}

		route(item)
	}
}
