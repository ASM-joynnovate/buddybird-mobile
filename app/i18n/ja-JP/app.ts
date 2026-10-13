import type { AppMessages } from '@/i18n/types/app';

export const app: AppMessages = {
	startup: {
		loading: 'アプリを準備しています',
	},
	startupError: {
		title: 'アプリを起動できませんでした',
		message: 'インターネット接続を確認して、もう一度試してみてください。',
	},
	feedback: {
		sentMessage: '大切なご意見、しっかり受け取りました。もっと良いBuddyBirdづくりに活かしますね。',
		retry: 'もう一度送る',
		promptTitle: 'ご意見を聞かせてください',
		promptMessage:
			'BuddyBirdを使って感じたことや、こうなったらいいなと思うことを自由に書いてください。とても励みになります！',
		write: 'フィードバックを書く',
		title: 'フィードバックを送る',
		placeholder: '改善してほしいところ、使いにくいところ、ほしい機能を自由に書いてください。',
		privacy: '⚠ 名前や連絡先などの個人情報は入力しないでください。',
		send: '送信',
		sentTitle: 'ありがとうございます！',
		sendError: 'ご意見を送信できませんでした。内容は残してあるので、接続を確認してもう一度試してみてください。',
	},
	update: {
		title: 'アップデートのお知らせ',
		forcedTitle: 'アップデートが必要です',
		message: 'BuddyBird {{version}} が利用できます。',
		forcedMessage: '引き続き使うには、バージョン{{version}}にアップデートしてください。',
		forcedMessageWithoutVersion: '引き続き使うには、アプリをアップデートしてください。',
		accept: 'アップデート',
		openStoreError: 'ストアを開けませんでした。もう一度試してみてください。',
	},
};
