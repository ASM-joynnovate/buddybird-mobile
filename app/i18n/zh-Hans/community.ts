import type { CommunityMessages } from '@/i18n/types/community';

export const community: CommunityMessages = {
	title: '动态',
	me: '我',
	feedConsent: {
		title: '要在动态中公开吗？',
		message: '公开后，其他人可以看到你的学习记录和鹦鹉模仿的声音。',
		confirm: '公开',
	},
	countryScope: {
		world: '全球',
		mine: '我的国家/地区',
	},
	leaderboard: {
		title: '{{month}}学习时长排行榜',
		viewAll: '完整排名',
		unranked: {
			not_participating: {
				title: '你还没有参与排名',
				description: '参与后，其他人可以看到你的昵称、头像和学习时长',
				action: '参与',
			},
			no_nickname: {
				title: '你还没有昵称，所以不在排名中',
				action: '设置昵称',
			},
			anonymous: {
				title: '登录后即可上榜',
				action: '登录',
			},
			country_mismatch: {
				title: '你不在这个国家/地区的排名中',
			},
			no_record: {
				title: '本月还没有学习记录',
			},
		},
	},
	feed: {
		more: '更多',
		empty: '还没有动态',
		timeAgo: {
			minutes_one: '{{count}}分钟前',
			minutes_few: '{{count}}分钟前',
			minutes_many: '{{count}}分钟前',
			minutes_other: '{{count}}分钟前',
			hours_one: '{{count}}小时前',
			hours_few: '{{count}}小时前',
			hours_many: '{{count}}小时前',
			hours_other: '{{count}}小时前',
			days_one: '{{count}}天前',
			days_few: '{{count}}天前',
			days_many: '{{count}}天前',
			days_other: '{{count}}天前',
			yesterday: '昨天',
		},
		mimic: {
			label: '模仿的词语',
			word: '“{{word}}”',
			private: '录音未公开',
			play: '播放{{word}}',
		},
		totalLearningTime: '总学习时长达到<b>{{duration}}</b>啦！',
		monthlyLearningTime: '{{month}}学习时长达到<b>{{duration}}</b>啦！',
		wordPlayCount_one: '“{{word}}”已经播放了<b>{{count, number}}次</b>啦！',
		wordPlayCount_few: '“{{word}}”已经播放了<b>{{count, number}}次</b>啦！',
		wordPlayCount_many: '“{{word}}”已经播放了<b>{{count, number}}次</b>啦！',
		wordPlayCount_other: '“{{word}}”已经播放了<b>{{count, number}}次</b>啦！',
		artHours: '小时',
		artCount_one: '{{count, number}}次',
		artCount_few: '{{count, number}}次',
		artCount_many: '{{count, number}}次',
		artCount_other: '{{count, number}}次',
		like: '赞',
	},
	report: {
		action: '举报',
		title: '请选择举报原因',
		reasons: {
			spam: '垃圾信息',
			inappropriate_content: '不当内容',
			harassment: '骚扰',
			other: '其他',
		},
		description: '详细说明（可选）',
		sent: '举报已提交',
	},
	block: {
		action: '屏蔽',
		title: '要屏蔽{{nickname}}吗？',
		message: '你们将互相看不到对方的动态。',
		done: '已屏蔽{{nickname}}',
		undo: '撤销',
	},
	gate: {
		loginTitle: '登录',
		loginDescription: '登录后即可使用动态',
		nicknameTitle: '设置昵称',
		nicknameDescription: '这是在动态中显示的名字',
		start: '开始',
	},
};
