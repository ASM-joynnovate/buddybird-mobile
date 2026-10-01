import type { HomeMessages } from '@/i18n/types/home';

export const home: HomeMessages = {
	brand: '버디버드',
	notifications: '알림',
	notificationsUnread: '알림, 안 읽은 알림 {{count}}개',
	notice: {
		viewDetail: '자세히',
		image: '첨부 이미지 {{index}}',
	},
	notificationList: {
		title: '알림',
		readAll: '모두 읽음',
		readAllError: '모두 읽음으로 표시하지 못했어요. 다시 눌러 주세요.',
		unread: '안 읽음',
		empty: '아직 받은 알림이 없어요',
		emptyScene: '빈 알림함 앞의 버디',
	},
};
