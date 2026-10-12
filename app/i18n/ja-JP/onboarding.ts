import type { OnboardingMessages } from '@/i18n/types/onboarding';

export const onboarding: OnboardingMessages = {
	login: {
		tagline: 'お留守番のあいだも、インコが言葉を覚えます',
		greeting: {
			title: 'ようこそ！',
			body: 'ログインして、いっしょに始めましょう',
		},
		words: ['こんにちは', 'だいすき', 'おはよう', 'ごはんだよ', 'かわいいね'],
	},
	consent: {
		intro: 'BuddyBirdを使うために、同意をお願いします！',
		all: 'すべてに同意',
	},
	usage: {
		record: {
			title: 'インコに教える言葉を<b>自分の声</b>で録音します',
			scene: '録音中の言葉とマイク',
			recording: '録音中',
		},
		place: {
			title: 'スマホを<b>ケージの前</b>に置いて「練習開始」をタップすると、インコに言葉を聞かせます',
			scene: 'ケージの前に立てたスマホがインコに言葉を聞かせている様子',
		},
		keepOn: {
			title: '練習中はアプリを開いたまま、<b>画面を消さないでください</b>',
			scene: '暗い部屋で画面をつけたまま充電しているスマホ',
		},
		report: {
			title: '<b>レポート</b>で練習した時間と記録を確認できます',
			scene: '今週と先週の練習時間を比べるレポート',
			lastWeek: '先週',
			comparedToLastWeek: '先週比 +{{duration}}',
		},
	},
	permissions: {
		intro: 'BuddyBirdを使うには、次の許可が必要です',
		scene: 'ケージの前のスマホがインコの声を聞いて通知を送る様子',
		buddyWord: 'こんにちは！',
		listening: '聞き取り中',
		alert: {
			appName: 'BuddyBird',
			time: '今',
			message: '練習が終わりました',
		},
		purpose: {
			microphone: '言葉の録音とインコの声の記録',
			notifications: '練習の通知',
		},
		continue: '続ける',
	},
	marketing: {
		intro: '新機能やイベントのお知らせを通知で受け取りますか？',
		scene: '止まり木の上のバディと壁に貼られたお知らせ',
		news: {
			features: '新機能',
			events: 'イベント',
		},
		hint: '設定の通知からいつでも変更できます。',
		night: '夜9時〜朝8時も受け取る',
		accept: '受け取る',
		decline: 'やめておく',
	},
	legacy: {
		uploading: 'このスマホのインコと言葉のデータを引き継いでいます',
		uploadError: 'インコと言葉のデータを引き継げませんでした。接続を確認して、もう一度試してみてください。',
		askTitle: 'このスマホのインコと言葉を追加しますか？',
	},
};
