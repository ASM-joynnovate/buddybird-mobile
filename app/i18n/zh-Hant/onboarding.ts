import type { OnboardingMessages } from '@/i18n/types/onboarding';

export const onboarding: OnboardingMessages = {
	login: {
		tagline: '你出門時，鸚鵡也能在家學說話',
		greeting: {
			title: '很高興認識你！',
			body: '登入後一起開始吧',
		},
		words: ['你好', '我愛你', '早安', '吃飯囉', '好漂亮'],
	},
	consent: {
		intro: '使用 BuddyBird 前，請先同意以下內容！',
		all: '全部同意',
	},
	usage: {
		record: {
			title: '用<b>自己的聲音</b>錄下要教鸚鵡的單字',
			scene: '坐在平板旁棲木上的鸚鵡，以及用飼主聲音錄下的單字「你好」',
			voiceOwner: '飼主的聲音',
		},
		place: {
			title: '出門前，把<b>閒置的裝置</b>放在鳥籠旁，開始學習',
			scene: '接上充電器的平板放在鳥籠上的鸚鵡旁，正在學習中的照片',
			spareDevice: '閒置的裝置（平板、舊手機）',
			charger: '接上充電器',
		},
		live: {
			title: '在外面也能用<b>自己的手機</b>即時查看學習詳情',
			scene: '手機上顯示的學習詳情：學習時間、教的單字、模仿次數、緊急狀況和記錄',
		},
		sound: {
			title: '<b>鸚鵡專用 AI</b> 會偵測我家鳥寶的啾啾聲和模仿的話，顯示給你看',
			scene: '學習詳情中的聲音記錄：啾啾、模仿的話「你好」、驚叫',
		},
		motion: {
			title: '鸚鵡<b>消失或出現的瞬間</b>也會記錄下來',
			scene: '學習詳情中的活動記錄：「鸚鵡消失」影片和「鸚鵡出現」照片',
		},
		start: '開始',
	},
	permissions: {
		intro: 'BuddyBird 需要的權限',
		scene: '鳥籠前的手機聽到鸚鵡的聲音並傳送通知的畫面',
		buddyWord: '你好！',
		listening: '正在聆聽聲音',
		alert: {
			appName: 'BuddyBird',
			time: '現在',
			message: '學習結束囉',
		},
		purpose: {
			microphone: '錄製單字和記錄鸚鵡聲音',
			notifications: '學習消息通知',
		},
		continue: '繼續',
	},
	marketing: {
		intro: '要透過通知接收新功能和活動消息嗎？',
		scene: '站在棲木上的 Buddy 和貼在牆上的新消息',
		news: {
			features: '新功能',
			events: '活動',
		},
		hint: '隨時可以在「設定」的「通知」中變更。',
		night: '晚上 9 點～早上 8 點也接收',
		accept: '好，我要接收',
		decline: '先不用',
	},
	legacy: {
		uploading: '正在轉移這支手機上的鸚鵡和單字',
		uploadError: '無法轉移鸚鵡和單字，請確認網路連線後再試一次。',
		askTitle: '要新增這支手機上的鸚鵡和單字嗎？',
	},
};
