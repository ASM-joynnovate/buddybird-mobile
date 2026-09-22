import type { Notice } from "@/types/apis/notices"
import type { Session, SessionSound } from "@/types/apis/sessions"

export type HomeSummary = {
	running_session: Session | null
	unread_notification_count: number
	latest_mimicry: SessionSound | null
	unread_notices: Notice[]
}
