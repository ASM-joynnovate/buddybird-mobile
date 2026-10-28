import type { CommunityMessages } from '@/i18n/types/community';

export const community: CommunityMessages = {
	title: '動態',
	me: '我',
	feedConsent: {
		title: '要公開到動態嗎？',
		message: '公開後，其他人就能看到你的學習記錄和鸚鵡模仿的聲音。',
		confirm: '公開',
	},
	countryScope: {
		world: '全世界',
		mine: '我的國家或地區',
	},
	leaderboard: {
		title: '{{month}}學習時間排名',
		viewAll: '完整排名',
		unranked: {
			not_participating: {
				title: '你目前沒有參加排名',
				description: '參加後，其他人就能看到你的暱稱、照片和學習時間',
				action: '參加',
			},
			no_nickname: {
				title: '還沒有暱稱，所以不在排名中',
				action: '設定暱稱',
			},
			anonymous: {
				title: '登入後就能加入排名',
				action: '登入',
			},
			country_mismatch: {
				title: '這個國家或地區的排名中沒有你',
			},
			no_record: {
				title: '這個月還沒有學習記錄',
			},
		},
	},
	feed: {
		more: '更多',
		empty: '還沒有任何動態',
		timeAgo: {
			minutes_one: '{{count}} 分鐘前',
			minutes_few: '{{count}} 分鐘前',
			minutes_many: '{{count}} 分鐘前',
			minutes_other: '{{count}} 分鐘前',
			hours_one: '{{count}} 小時前',
			hours_few: '{{count}} 小時前',
			hours_many: '{{count}} 小時前',
			hours_other: '{{count}} 小時前',
			days_one: '{{count}} 天前',
			days_few: '{{count}} 天前',
			days_many: '{{count}} 天前',
			days_other: '{{count}} 天前',
			yesterday: '昨天',
		},
		mimic: {
			label: '模仿的單字',
			word: '「{{word}}」',
			private: '未公開錄音',
			play: '播放「{{word}}」',
		},
		totalLearningTime: '總學習時間達到 <b>{{duration}}</b> 了！',
		monthlyLearningTime: '{{month}}學習時間達到 <b>{{duration}}</b> 了！',
		wordPlayCount_one: '「{{word}}」已經播放 <b>{{count, number}} 次</b>了！',
		wordPlayCount_few: '「{{word}}」已經播放 <b>{{count, number}} 次</b>了！',
		wordPlayCount_many: '「{{word}}」已經播放 <b>{{count, number}} 次</b>了！',
		wordPlayCount_other: '「{{word}}」已經播放 <b>{{count, number}} 次</b>了！',
		artHours: '小時',
		artCount_one: '{{count, number}} 次',
		artCount_few: '{{count, number}} 次',
		artCount_many: '{{count, number}} 次',
		artCount_other: '{{count, number}} 次',
		like: '讚',
	},
	report: {
		action: '檢舉',
		title: '請選擇檢舉原因',
		reasons: {
			spam: '垃圾訊息',
			inappropriate_content: '不當內容',
			harassment: '騷擾',
			other: '其他',
		},
		description: '詳細說明（選填）',
		sent: '已送出檢舉',
	},
	block: {
		action: '封鎖',
		title: '要封鎖{{nickname}}嗎？',
		message: '你們將看不到彼此的動態。',
		done: '已封鎖{{nickname}}',
		undo: '復原',
	},
	gate: {
		loginTitle: '登入',
		loginDescription: '登入後就能使用動態',
		nicknameTitle: '設定暱稱',
		nicknameDescription: '這是在動態中顯示的名稱',
		start: '開始',
	},
};
