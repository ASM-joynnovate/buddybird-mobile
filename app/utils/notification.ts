import type { NotificationKind } from "@/types/apis/notifications"
import { localDate } from "@/utils/date"

type NotificationTarget = {
	kind: NotificationKind
	report_date?: string | null
	sent_at: string
}

export function notificationPath({ kind, report_date, sent_at }: NotificationTarget): string {
	if (kind === "streak") {
		return "/report"
	}

	const date = kind === "mimicry" ? localDate(new Date(sent_at)) : report_date

	return date ? `/report?period=day&date=${date}` : "/report?period=day"
}
