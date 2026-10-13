import type { ReportStackParamList, RootStackParamList } from '@/types/navigation';

import type { LinkingOptions, PathConfig } from '@react-navigation/native';

const reportTabLinking: PathConfig<ReportStackParamList> = {
	initialRouteName: 'Report',
	screens: { SessionDetail: 'sessions/:sessionId' },
};

export const linkingConfig: LinkingOptions<RootStackParamList>['config'] = {
	initialRouteName: 'Main',
	screens: {
		Main: { screens: { ReportTab: reportTabLinking } },
		AnnouncementDetail: 'announcements/:announcementId',
		NotificationDetail: 'notifications/:notificationId',
		NotificationSettings: 'settings/notifications',
		SessionWatch: 'sessions/:sessionId/watch',
	},
};
