import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: '設定',
	saveError: '設定を保存できなかったので、元の設定に戻しました。\nもう一度試してみてください。',
	notifications: {
		title: '通知',
		all: 'すべての通知',
		permissionOff: '通知の許可がオフのため、通知を受け取れません',
	},
	general: {
		language: 'アプリの言語',
		korean: '한국어',
		english: 'English',
		japanese: '日本語',
		russian: 'Русский',
		spanish: 'Español',
		country: '国',
		countryChoose: '選択してください',
		countrySearchHint: '国名で検索',
		countrySearchClear: '検索ワードを消す',
		countryNotFound: '「{{query}}」に合う国がありません',
		devices: 'ログイン中の端末',
	},
	account: {
		signOut: 'ログアウト',
		withdraw: '退会',
	},
	support: {
		title: 'サポート',
		feedback: 'フィードバックを送る',
		consents: '規約への同意',
		version: 'アプリのバージョン {{version}}',
	},
	signOutDialog: {
		title: 'ログアウト',
		message: 'この端末からログアウトしますか？',
		confirm: 'ログアウト',
	},
	withdrawDialog: {
		title: '退会',
		message: 'バディがとてもさみしがります。本当に退会しますか？',
		warning: '退会すると元に戻せません。',
		confirm: '退会する',
	},
	consents: {
		title: '規約への同意',
		saveError: '同意の変更を保存できませんでした。もう一度試してみてください。',
	},
	devices: {
		title: 'ログイン中の端末',
		thisDevice: 'この端末',
		runningSession: '練習中',
		lastSeen: '最終アクセス {{time}}',
		delete: '{{name}}を削除',
		deleteMessage: '削除すると、この端末に通知が届かなくなります。',
		sessionEnds: 'この端末で進行中の練習は終了します。',
		deleteError: '端末を削除できませんでした。もう一度試してみてください。',
	},
};
