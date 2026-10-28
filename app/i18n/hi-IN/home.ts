import type { HomeMessages } from '@/i18n/types/home';

export const home: HomeMessages = {
	brand: 'BuddyBird',
	notifications: 'सूचनाएँ',
	notificationsUnread: 'सूचनाएँ, {{count}} बिना पढ़ी सूचनाएँ',
	announcement: {
		viewDetail: 'पूरा देखें',
		image: 'अटैच की गई इमेज {{index}}',
	},
	notification: {
		viewImage: 'फ़ोटो बड़ी करके देखें',
	},
	notificationList: {
		title: 'सूचनाएँ',
		notifications: 'सूचनाएँ',
		announcements: 'घोषणाएँ',
		readAll: 'सभी को पढ़ा हुआ मार्क करें',
		readAllError: 'सभी को पढ़ा हुआ मार्क नहीं किया जा सका। फिर से टैप करें।',
		unread: 'नहीं पढ़ी गई',
		empty: 'अभी तक कोई सूचना नहीं मिली है',
	},
	announcementList: {
		unread: 'नहीं पढ़ी गई',
		empty: 'अभी कोई घोषणा नहीं है',
	},
};
