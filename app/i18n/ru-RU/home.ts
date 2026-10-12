import type { HomeMessages } from '@/i18n/types/home';

export const home: HomeMessages = {
	brand: 'BuddyBird',
	notifications: 'Уведомления',
	notificationsUnread: 'Уведомления, непрочитанных: {{count}}',
	announcement: {
		viewDetail: 'Подробнее',
		image: 'Вложенное изображение {{index}}',
	},
	notification: {
		viewImage: 'Увеличить фото',
	},
	notificationList: {
		title: 'Уведомления',
		notifications: 'Уведомления',
		announcements: 'Объявления',
		readAll: 'Прочитать все',
		readAllError: 'Не получилось отметить всё прочитанным. Нажми ещё раз.',
		unread: 'Не прочитано',
		empty: 'Уведомлений пока нет',
	},
	announcementList: {
		unread: 'Не прочитано',
		empty: 'Сейчас объявлений нет',
	},
};
