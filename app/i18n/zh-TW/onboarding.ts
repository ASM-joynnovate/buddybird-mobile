import type { OnboardingMessages } from '@/i18n/types/onboarding';

export const onboarding: OnboardingMessages = {
	login: {
		tagline: '就算你不在家，鸚鵡也能學說話',
		greeting: {
			title: '很高興認識你！',
			body: '登入後就一起開始吧',
		},
		words: ['你好', '我愛你', '早安', '吃飯囉', '好可愛'],
	},
	consent: {
		intro: '使用 BuddyBird 前，請先同意以下條款！',
		all: '全部同意',
	},
	usage: {
		record: {
			title: '用<b>自己的聲音</b>錄下想教鸚鵡的單字',
			scene: '正在錄音的單字和麥克風',
			recording: '錄音中',
		},
		place: {
			title: '把手機放在<b>鳥籠前</b>，按下開始，就會播放單字給鸚鵡聽',
			scene: '立在鳥籠前的手機正在播放單字給鸚鵡聽',
		},
		keepOn: {
			title: '學習期間請保持 App 開啟，<b>不要關閉螢幕</b>',
			scene: '在昏暗房間裡亮著螢幕充電的手機',
		},
		report: {
			title: '在<b>報告</b>中查看學習時間和紀錄',
			scene: '比較本週和上週學習時間的報告',
			lastWeek: '上週',
			comparedToLastWeek: '比上週 +{{duration}}',
		},
	},
	permissions: {
		intro: 'BuddyBird 需要以下權限',
		scene: '鳥籠前的手機聽到鸚鵡的聲音後發送通知',
		buddyWord: '你好！',
		listening: '聆聽中',
		alert: {
			appName: 'BuddyBird',
			time: '現在',
			message: '學習結束了',
		},
		purpose: {
			microphone: '錄製單字和記錄鸚鵡的叫聲',
			notifications: '學習狀況通知',
		},
		continue: '繼續',
	},
	marketing: {
		intro: '要接收新功能和活動消息的通知嗎？',
		scene: '站在棲木上的 Buddy 和貼在牆上的新消息',
		news: {
			features: '新功能',
			events: '活動',
		},
		hint: '之後隨時可以在設定的「通知」中變更。',
		night: '晚上 9 點到早上 8 點也接收',
		accept: '好，通知我',
		decline: '不用了',
	},
	legacy: {
		uploading: '正在轉移這支手機上的鸚鵡和單字',
		uploadError: '無法轉移鸚鵡和單字。請檢查連線後再試一次。',
		askTitle: '要新增這支手機上的鸚鵡和單字嗎？',
	},
};
