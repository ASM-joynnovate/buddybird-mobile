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
			scene: 'タブレットの横の止まり木にいるインコと、飼い主の声で録音した言葉「こんにちは」',
			voiceOwner: '飼い主の声',
		},
		place: {
			title: '出かける前に<b>使っていない端末</b>をケージに置いて、練習を始めます。',
			scene: '充電中のタブレットがケージの上のインコの横で練習している写真',
			spareDevice: '使っていない端末(タブレット・古いスマホ)',
			charger: '充電器につなぐ',
		},
		live: {
			title: '外出先でも<b>自分のスマホ</b>で練習の詳細をリアルタイムで確認できます',
			scene: 'スマホに表示された練習の詳細。練習時間、教えた言葉、まねした回数、緊急と記録',
		},
		sound: {
			title: '<b>インコ専用AI</b>がうちの子の鳴き声やまねした言葉を見つけて表示します。',
			scene: '練習の詳細の音の記録。まねした言葉「こんにちは」、鳴き声、激しい鳴き声',
		},
		motion: {
			title: 'インコが<b>画面から消えたり戻ってきたりした瞬間</b>も記録されます。',
			scene: '練習の詳細の動きの記録。インコが画面外に出た動画と画面内に戻った写真',
		},
		start: 'はじめる',
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
