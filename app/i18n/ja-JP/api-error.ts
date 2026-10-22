import type { ApiErrorMessages } from '@/i18n/types/api-error';

export const apiError: ApiErrorMessages = {
	COMMON__BAD_REQUEST: 'リクエストを処理できませんでした。入力した内容を確認してください。',
	COMMON__RESOURCE_NOT_FOUND: '情報が見つかりません。すでに削除されたかもしれません。',
	COMMON__FILE_SIZE_EXCEEDED: 'ファイルが大きすぎます。5MB以下のファイルだけアップロードできます。',
	COMMON__IDEMPOTENCY_KEY_REQUIRED:
		'リクエストを処理できませんでした。問題が続く場合は、アプリを最新バージョンにアップデートしてください。',
	COMMON__REQUEST_VALIDATION_ERROR:
		'リクエストの内容を確認できませんでした。問題が続く場合は、アプリを最新バージョンにアップデートしてください。',
	COMMON__RESPONSE_VALIDATION_ERROR:
		'サーバーからの応答に問題があります。しばらくしてから、もう一度試してみてください。',
	COMMON__INTERNAL_SERVER_ERROR: 'サーバーで問題が起きました。しばらくしてから、もう一度試してみてください。',
	AUTH__INVALID_TOKEN: 'ログインの有効期限が切れました。もう一度ログインしてください。',
	AUTH__SERVICE_UNAVAILABLE:
		'ログインサービスを一時的に利用できません。しばらくしてから、もう一度試してみてください。',
	AUTH__INVALID_PROVIDER_CREDENTIAL: 'ソーシャルログインの情報を確認できませんでした。もう一度ログインしてください。',
	AUTH__PROVIDER_CREDENTIAL_REQUIRED: 'ソーシャルログインの情報が必要です。もう一度ログインしてください。',
	AUTH__WITHDRAWAL_SAVE_UNAVAILABLE: '退会の申請が受け付けられたか確認できませんでした。もう一度申請してください。',
	USER__SAVE_UNAVAILABLE: 'アカウント情報を保存できませんでした。しばらくしてから、もう一度試してみてください。',
	USER__DUPLICATE_NICKNAME: 'ほかの人が使っているニックネームです。別のニックネームを入力してください。',
	USER__INVALID_PROFILE_PHOTO: 'JPEGまたはPNGの写真だけアップロードできます。',
	DEVICE__NOT_REGISTERED: 'この端末の登録情報を確認できませんでした。アプリを起動し直してください。',
	DEVICE__NOT_STATION: 'ケージの前に置いた端末でのみ操作できます。',
	DEVICE__SAVE_UNAVAILABLE: '端末情報を保存できませんでした。しばらくしてから、もう一度試してみてください。',
	PARROT__SAVE_UNAVAILABLE: 'インコの情報を保存できませんでした。しばらくしてから、もう一度試してみてください。',
	WORD__SAVE_UNAVAILABLE: '言葉を保存できませんでした。しばらくしてから、もう一度試してみてください。',
	WORD__RECORDING_REQUIRED: '言葉ごとに録音が1つ以上必要です。',
	WORD__INVALID_RECORDING: 'm4a、wav、mp3の録音ファイルだけアップロードできます。',
	SESSION__SAVE_UNAVAILABLE: '練習情報を保存できませんでした。しばらくしてから、もう一度試してみてください。',
	SESSION__ALREADY_RUNNING: 'すでに進行中の練習があります。',
	SESSION__NOT_RUNNING: '進行中の練習がありません。',
	SESSION__INVALID_SOUND: 'wavの音声ファイルだけアップロードできます。',
	FEEDBACK__SAVE_UNAVAILABLE: 'ご意見を保存できませんでした。しばらくしてから、もう一度試してみてください。',
	CONSENT__SAVE_UNAVAILABLE: '同意内容を保存できませんでした。しばらくしてから、もう一度試してみてください。',
	NOTIFICATION__READ_FAILED: '通知を既読にできませんでした。しばらくしてから、もう一度試してみてください。',
	CLIENT__NETWORK: 'ネットワーク接続を確認してください。',
	CLIENT__TIMEOUT: '応答に時間がかかっています。ネットワーク接続を確認してください。',
	CLIENT__INVALID_RESPONSE:
		'サーバーからの応答を確認できませんでした。しばらくしてから、もう一度試してみてください。',
	USER__SELF_TARGET: '自分自身をブロックしたり報告したりすることはできません。',
	FEED__SAVE_UNAVAILABLE: 'リアクションを保存できませんでした。しばらくしてから、もう一度試してみてください。',
	ABUSE_REPORT__SAVE_UNAVAILABLE: '報告を送信できませんでした。しばらくしてから、もう一度試してみてください。',
};
