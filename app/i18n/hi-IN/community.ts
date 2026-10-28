import type { CommunityMessages } from '@/i18n/types/community';

export const community: CommunityMessages = {
	title: 'फ़ीड',
	me: 'आप',
	feedConsent: {
		title: 'फ़ीड पर दिखाना है?',
		message: 'ऐसा करने पर आपके ट्रेनिंग रिकॉर्ड और नकल की गई आवाज़ें दूसरे लोग देख पाएँगे।',
		confirm: 'फ़ीड पर दिखाएँ',
	},
	countryScope: {
		world: 'पूरी दुनिया',
		mine: 'मेरा देश',
	},
	leaderboard: {
		title: '{{month}} की ट्रेनिंग रैंकिंग',
		viewAll: 'पूरी रैंकिंग',
		unranked: {
			not_participating: {
				title: 'आप रैंकिंग में शामिल नहीं हैं',
				description: 'शामिल होने पर आपका निकनेम, फ़ोटो और ट्रेनिंग का समय दूसरे लोग देख पाएँगे',
				action: 'शामिल हों',
			},
			no_nickname: {
				title: 'निकनेम न होने की वजह से आप रैंकिंग में नहीं हैं',
				action: 'निकनेम सेट करें',
			},
			anonymous: {
				title: 'साइन इन करने पर आप रैंकिंग में दिखेंगे',
				action: 'साइन इन करें',
			},
			country_mismatch: {
				title: 'इस देश की रैंकिंग में आप नहीं हैं',
			},
			no_record: {
				title: 'इस महीने अभी तक कोई ट्रेनिंग रिकॉर्ड नहीं है',
			},
		},
	},
	feed: {
		more: 'और देखें',
		empty: 'फ़ीड में अभी कुछ नहीं है',
		timeAgo: {
			minutes_one: '{{count}} मिनट पहले',
			minutes_few: '{{count}} मिनट पहले',
			minutes_many: '{{count}} मिनट पहले',
			minutes_other: '{{count}} मिनट पहले',
			hours_one: '{{count}} घंटा पहले',
			hours_few: '{{count}} घंटे पहले',
			hours_many: '{{count}} घंटे पहले',
			hours_other: '{{count}} घंटे पहले',
			days_one: '{{count}} दिन पहले',
			days_few: '{{count}} दिन पहले',
			days_many: '{{count}} दिन पहले',
			days_other: '{{count}} दिन पहले',
			yesterday: 'कल',
		},
		mimic: {
			label: 'नकल किया गया शब्द',
			word: '‘{{word}}’',
			private: 'रिकॉर्डिंग सार्वजनिक नहीं की गई है',
			play: '{{word}} चलाएँ',
		},
		totalLearningTime: 'कुल ट्रेनिंग समय <b>{{duration}}</b> पूरा हुआ!',
		monthlyLearningTime: '{{month}} में ट्रेनिंग समय <b>{{duration}}</b> पूरा हुआ!',
		wordPlayCount_one: '‘{{word}}’ शब्द <b>{{count, number}} बार</b> सुनाया गया!',
		wordPlayCount_few: '‘{{word}}’ शब्द <b>{{count, number}} बार</b> सुनाया गया!',
		wordPlayCount_many: '‘{{word}}’ शब्द <b>{{count, number}} बार</b> सुनाया गया!',
		wordPlayCount_other: '‘{{word}}’ शब्द <b>{{count, number}} बार</b> सुनाया गया!',
		artHours: 'घंटे',
		artCount_one: '{{count, number}} बार',
		artCount_few: '{{count, number}} बार',
		artCount_many: '{{count, number}} बार',
		artCount_other: '{{count, number}} बार',
		like: 'पसंद करें',
	},
	report: {
		action: 'रिपोर्ट करें',
		title: 'रिपोर्ट करने की वजह चुनें',
		reasons: {
			spam: 'स्पैम',
			inappropriate_content: 'आपत्तिजनक कॉन्टेंट',
			harassment: 'परेशान करना',
			other: 'अन्य',
		},
		description: 'ज़्यादा जानकारी (वैकल्पिक)',
		sent: 'रिपोर्ट भेज दी गई है',
	},
	block: {
		action: 'ब्लॉक करें',
		title: '{{nickname}} को ब्लॉक करना है?',
		message: 'आप दोनों एक-दूसरे की फ़ीड नहीं देख पाएँगे।',
		done: '{{nickname}} को ब्लॉक कर दिया गया',
		undo: 'पहले जैसा करें',
	},
	gate: {
		loginTitle: 'साइन इन करें',
		loginDescription: 'फ़ीड इस्तेमाल करने के लिए साइन इन करें',
		nicknameTitle: 'निकनेम सेट करें',
		nicknameDescription: 'यह नाम फ़ीड में दिखेगा',
		start: 'शुरू करें',
	},
};
