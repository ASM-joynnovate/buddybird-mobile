import type { HomeMessages } from '@/i18n/types/home';

export const home: HomeMessages = {
	brand: 'BuddyBird',
	notifications: 'বিজ্ঞপ্তি',
	notificationsUnread: 'বিজ্ঞপ্তি, না পড়া বিজ্ঞপ্তি {{count, number}}টি',
	announcement: {
		viewDetail: 'বিস্তারিত',
		image: 'সংযুক্ত ছবি {{index, number}}',
	},
	notification: {
		viewImage: 'ছবি বড় করে দেখুন',
	},
	notificationList: {
		title: 'বিজ্ঞপ্তি',
		notifications: 'বিজ্ঞপ্তি',
		announcements: 'ঘোষণা',
		readAll: 'সব পড়া হয়েছে',
		readAllError: 'সব পড়া হয়েছে হিসেবে চিহ্নিত করা যায়নি। আবার ট্যাপ করুন।',
		unread: 'পড়া হয়নি',
		empty: 'এখনো কোনো বিজ্ঞপ্তি আসেনি',
	},
	announcementList: {
		unread: 'পড়া হয়নি',
		empty: 'এখন কোনো ঘোষণা নেই',
	},
};
