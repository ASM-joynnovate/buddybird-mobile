import type { HomeMessages } from '@/i18n/types/home';

export const home: HomeMessages = {
	brand: 'BuddyBird',
	notifications: 'Notificaciones',
	notificationsUnread: 'Notificaciones, {{count}} sin leer',
	announcement: {
		viewDetail: 'Ver más',
		image: 'Imagen adjunta {{index}}',
	},
	notification: {
		viewImage: 'Ver la foto en grande',
	},
	notificationList: {
		title: 'Notificaciones',
		notifications: 'Notificaciones',
		announcements: 'Anuncios',
		readAll: 'Leer todo',
		readAllError: 'No hemos podido marcar todo como leído. Pulsa otra vez.',
		unread: 'Sin leer',
		empty: 'Todavía no tienes notificaciones',
	},
	announcementList: {
		unread: 'Sin leer',
		empty: 'Ahora mismo no hay anuncios',
	},
};
