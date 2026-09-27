import { useLinkTo } from "@react-navigation/native"

import { readNotificationMutationOptions } from "@/hooks/apis/notifications"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import { track } from "@/services/telemetry/client"
import type { AppNotification } from "@/types/apis/notifications"
import { notificationPath } from "@/utils/notification"

export function useOpenNotification(): (item: AppNotification) => void {
	const linkTo = useLinkTo()

	const { mutate } = useIdempotentMutation(readNotificationMutationOptions())

	return (item) => {
		if (!item.read_at) {
			mutate({ id: item.id })
		}

		track("notification_opened", { kind: item.kind, from: "list" })

		linkTo(notificationPath(item))
	}
}
