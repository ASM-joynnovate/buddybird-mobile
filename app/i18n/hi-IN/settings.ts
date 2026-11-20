import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: 'सेटिंग',
	saveError: 'सेटिंग सेव नहीं हो सकी, इसलिए पहले वाली सेटिंग वापस लगा दी गई है।\nफिर से कोशिश करें।',
	notifications: {
		title: 'सूचनाएँ',
		all: 'सभी सूचनाएँ',
		permissionOff: 'सूचनाओं की अनुमति बंद है, इसलिए आपको सूचनाएँ नहीं मिलेंगी',
	},
	general: {
		title: 'सामान्य',
		languageAndCountry: 'भाषा और देश',
		language: 'ऐप की भाषा',
		languageSearchHint: 'भाषा का नाम खोजें',
		languageNotFound: '‘{{query}}’ से मेल खाने वाली कोई भाषा नहीं मिली',
		country: 'देश',
		countryChoose: 'चुनें',
		countrySearchHint: 'देश का नाम खोजें',
		searchClear: 'खोज साफ़ करें',
		countryNotFound: '‘{{query}}’ से मेल खाने वाला कोई देश नहीं मिला',
		devices: 'कनेक्ट किए गए डिवाइस',
	},
	privacy: {
		title: 'निजता',
		feed: 'फ़ीड पर दिखाएँ',
		feedDetail: 'आपके ट्रेनिंग रिकॉर्ड और नकल की गई आवाज़ें दूसरे लोग देख सकते हैं',
		leaderboard: 'लीडरबोर्ड में शामिल हों',
		leaderboardDetail: 'आपका निकनेम, फ़ोटो और ट्रेनिंग का समय दूसरे लोग देख सकते हैं',
		consents: 'शर्तों के लिए सहमति',
	},
	account: {
		signOut: 'साइन आउट करें',
		withdraw: 'खाता डिलीट करें',
	},
	support: {
		title: 'सहायता',
		feedback: 'फ़ीडबैक भेजें',
		version: 'ऐप वर्शन {{version}}',
	},
	legal: {
		title: 'निजता और शर्तें',
		terms: 'सेवा की शर्तें',
		privacy: 'गोपनीयता नीति',
	},
	signOutDialog: {
		title: 'साइन आउट करें',
		message: 'इस डिवाइस से साइन आउट करना है?',
		confirm: 'साइन आउट करें',
	},
	withdrawDialog: {
		title: 'खाता डिलीट करें',
		message: 'बडी को आपकी बहुत याद आएगी। क्या आप सच में जाना चाहते हैं?',
		warning: 'खाता डिलीट करने के बाद इसे वापस नहीं लाया जा सकता।',
		confirm: 'खाता डिलीट करें',
	},
	consents: {
		title: 'शर्तों के लिए सहमति',
		saveError: 'सहमति में किया गया बदलाव सेव नहीं हो सका। फिर से कोशिश करें।',
	},
	devices: {
		title: 'कनेक्ट किए गए डिवाइस',
		thisDevice: 'यह डिवाइस',
		runningSession: 'ट्रेनिंग चल रही है',
		lastSeen: 'पिछली बार ऑनलाइन: {{time}}',
		delete: '{{name}} डिलीट करें',
		deleteMessage: 'डिलीट करने पर इस डिवाइस पर सूचनाएँ नहीं आएँगी।',
		sessionEnds: 'इस डिवाइस पर चल रही ट्रेनिंग खत्म हो जाएगी।',
		deleteError: 'डिवाइस डिलीट नहीं किया जा सका। फिर से कोशिश करें।',
	},
};
