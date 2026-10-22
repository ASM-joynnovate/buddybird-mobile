import type { OnboardingMessages } from '@/i18n/types/onboarding';

export const onboarding: OnboardingMessages = {
	login: {
		tagline: '你不在家时，鹦鹉也能学说话',
		greeting: {
			title: '你好呀！',
			body: '登录后一起开始吧',
		},
		words: ['你好', '我爱你', '早上好', '吃饭啦', '真漂亮'],
	},
	consent: {
		intro: '使用 BuddyBird 前，请先同意以下条款！',
		all: '全部同意',
	},
	usage: {
		record: {
			title: '用<b>你的声音</b>录下想教鹦鹉的词语',
			scene: '正在录制的词语和麦克风',
			recording: '录音中',
		},
		place: {
			title: '把手机放在<b>鸟笼前</b>，点击开始，就会给鹦鹉播放词语',
			scene: '立在鸟笼前的手机正在给鹦鹉播放词语',
		},
		keepOn: {
			title: '学习期间请保持应用开启，<b>不要关闭屏幕</b>',
			scene: '在昏暗的房间里亮着屏幕充电的手机',
		},
		report: {
			title: '在<b>报告</b>中查看学习时长和记录',
			scene: '对比本周和上周学习时长的报告',
			lastWeek: '上周',
			comparedToLastWeek: '比上周 +{{duration}}',
		},
	},
	permissions: {
		intro: '这些是 BuddyBird 需要的权限',
		scene: '鸟笼前的手机听到鹦鹉的声音后发送通知',
		buddyWord: '你好！',
		listening: '正在聆听',
		alert: {
			appName: 'BuddyBird',
			time: '现在',
			message: '学习已完成',
		},
		purpose: {
			microphone: '录制词语和记录鹦鹉的声音',
			notifications: '学习动态通知',
		},
		continue: '继续',
	},
	marketing: {
		intro: '要通过通知接收新功能和活动消息吗？',
		scene: '站在栖木上的 Buddy 和贴在墙上的新消息',
		news: {
			features: '新功能',
			events: '活动',
		},
		hint: '随时可以在设置的“通知”中更改。',
		night: '晚上 9 点至早上 8 点也接收',
		accept: '接收',
		decline: '暂不需要',
	},
	legacy: {
		uploading: '正在迁移这台手机上的鹦鹉和词语',
		uploadError: '鹦鹉和词语迁移失败。请检查网络连接后重试。',
		askTitle: '要添加这台手机上的鹦鹉和词语吗？',
	},
};
