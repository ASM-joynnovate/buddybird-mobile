import { type CompositeNavigationProp, useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"

import { noticeNotificationsQueryOptions } from "@/hooks/apis/mocks"
import { readNotificationMutationOptions } from "@/hooks/apis/notifications"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import type { InboxNotification } from "@/mocks/types"
import type { HomeStackParamList, RootStackParamList } from "@/types/navigation"

type Navigation = CompositeNavigationProp<
	NativeStackNavigationProp<HomeStackParamList, "Notifications">,
	NativeStackNavigationProp<RootStackParamList>
>

export function useOpenNotification(): (item: InboxNotification) => void {
	const navigation = useNavigation<Navigation>()

	const noticeNotifications = useQuery(noticeNotificationsQueryOptions())

	const { mutate } = useIdempotentMutation(readNotificationMutationOptions())

	function sessionIdOf(notificationId: string) {
		return noticeNotifications.data?.notification_sessions.find(
			(item) => item.notification_id === notificationId,
		)?.session_id
	}

	function route(item: InboxNotification) {
		const sessionId = sessionIdOf(item.id)

		if (item.kind === "mimicry" && sessionId) {
			navigation.navigate("Main", {
				screen: "ReportTab",
				params: {
					screen: "SessionDetail",
					params: { sessionId, soundId: item.sound_id ?? undefined },
				},
			})
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
			mutate({ id: item.id })
		}

		route(item)
	}
}
