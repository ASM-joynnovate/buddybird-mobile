import type { Notice } from '@/types/apis/notices';
import type { Session } from '@/types/apis/sessions';

export interface HomeSummary {
	running_session: Session | null;
	unread_notification_count: number;
	unread_notices: Notice[];
}
