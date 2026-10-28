import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: 'সেটিংস',
	saveError: 'সেটিং সেভ করা যায়নি, তাই আগের অবস্থায় ফিরিয়ে দেওয়া হয়েছে।\nআবার চেষ্টা করুন।',
	notifications: {
		title: 'বিজ্ঞপ্তি',
		all: 'সব বিজ্ঞপ্তি',
		permissionOff: 'বিজ্ঞপ্তির অনুমতি বন্ধ থাকায় বিজ্ঞপ্তি পাবেন না',
	},
	general: {
		title: 'সাধারণ',
		languageAndCountry: 'ভাষা ও দেশ',
		language: 'অ্যাপের ভাষা',
		languageSearchHint: 'ভাষার নাম খুঁজুন',
		languageNotFound: '‘{{query}}’-এর সাথে মেলে এমন কোনো ভাষা নেই',
		country: 'দেশ',
		countryChoose: 'বেছে নিন',
		countrySearchHint: 'দেশের নাম খুঁজুন',
		searchClear: 'সার্চ মুছুন',
		countryNotFound: '‘{{query}}’-এর সাথে মেলে এমন কোনো দেশ নেই',
		devices: 'কানেক্ট করা ডিভাইস',
	},
	privacy: {
		title: 'গোপনীয়তা সেটিংস',
		feed: 'ফিডে দেখান',
		feedDetail: 'আপনার শেখার রেকর্ড আর নকল করা আওয়াজ অন্যরা দেখতে পাবেন',
		leaderboard: 'লিডারবোর্ডে যোগ দিন',
		leaderboardDetail: 'আপনার ডাকনাম, ছবি আর শেখার সময় অন্যরা দেখতে পাবেন',
		consents: 'শর্তাবলীতে সম্মতি',
	},
	account: {
		signOut: 'সাইন-আউট',
		withdraw: 'অ্যাকাউন্ট মুছে ফেলুন',
	},
	support: {
		title: 'সহায়তা',
		feedback: 'মতামত পাঠান',
		version: 'অ্যাপ ভার্সন {{version}}',
	},
	signOutDialog: {
		title: 'সাইন-আউট',
		message: 'এই ডিভাইস থেকে সাইন-আউট করবেন?',
		confirm: 'সাইন-আউট',
	},
	withdrawDialog: {
		title: 'অ্যাকাউন্ট মুছে ফেলুন',
		message: 'বাডির খুব মন খারাপ হবে। সত্যিই চলে যাবেন?',
		warning: 'অ্যাকাউন্ট মুছে ফেললে আর ফিরিয়ে আনা যাবে না।',
		confirm: 'অ্যাকাউন্ট মুছে ফেলুন',
	},
	consents: {
		title: 'শর্তাবলীতে সম্মতি',
		saveError: 'সম্মতির পরিবর্তন সেভ করা যায়নি। আবার চেষ্টা করুন।',
	},
	devices: {
		title: 'কানেক্ট করা ডিভাইস',
		thisDevice: 'এই ডিভাইস',
		runningSession: 'শেখা চলছে',
		lastSeen: 'শেষবার কানেক্ট হয়েছে {{time}}',
		delete: '{{name}} মুছুন',
		deleteMessage: 'মুছে ফেললে এই ডিভাইসে আর বিজ্ঞপ্তি যাবে না।',
		sessionEnds: 'এই ডিভাইসে চলা শেখা বন্ধ হয়ে যাবে।',
		deleteError: 'ডিভাইসটি মোছা যায়নি। আবার চেষ্টা করুন।',
	},
};
