import { type CompositeNavigationProp, useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"

import { noticeNotificationsQueryOptions } from "@/hooks/apis/mocks"
import { readNotificationMutationOptions } from "@/hooks/apis/notifications"
import { runningSessionQueryOptions } from "@/hooks/apis/sessions"
import type { InboxNotification } from "@/mocks/types"
import { reportError } from "@/services/telemetry/client"
import type { HomeStackParamList, RootStackParamList } from "@/types/navigation"

type Navigation = CompositeNavigationProp<
	NativeStackNavigationProp<HomeStackParamList, "Notifications">,
	NativeStackNavigationProp<RootStackParamList>
>

export function useOpenNotification(): (item: InboxNotification) => void {
	const navigation = useNavigation<Navigation>()
	const client = useQueryClient()
	const { mutate } = useMutation(readNotificationMutationOptions())
	const noticeNotifications = useQuery(noticeNotificationsQueryOptions())

	function sessionIdOf(notificationId: string) {
		return noticeNotifications.data?.notification_sessions.find(
			(item) => item.notification_id === notificationId,
		)?.session_id
	}

	async function openMonitorIfRunning() {
		try {
			if (await client.query(runningSessionQueryOptions())) {
				navigation.navigate("SessionMonitor")
			}
		} catch (error) {
			reportError(error, "notification_station_disconnect")
		}
	}

	function route(item: InboxNotification) {
		const sessionId = sessionIdOf(item.id)

		if (item.kind === "emergency" && item.emergency_event_id) {
			navigation.navigate("Main", {
				screen: "RecordsTab",
				params: {
					screen: "EmergencyDetail",
					params: { emergencyId: item.emergency_event_id },
				},
			})
		} else if (item.kind === "mimicry" && sessionId) {
			navigation.navigate("Main", {
				screen: "RecordsTab",
				params: {
					screen: "SessionDetail",
					params: { sessionId, soundId: item.sound_id ?? undefined },
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
		} else if (item.kind === "notice") {
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
