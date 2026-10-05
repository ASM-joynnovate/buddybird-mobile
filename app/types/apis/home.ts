import type { Announcement } from '@/types/apis/announcements';
import type { Session } from '@/types/apis/sessions';

export interface HomeSummary {
	running_session: Session | null;
	unread_notification_count: number;
	unread_announcements: Announcement[];
}
