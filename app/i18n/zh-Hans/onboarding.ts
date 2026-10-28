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
		intro: '使用BuddyBird App前，请先同意以下条款！',
		all: '全部同意',
	},
	usage: {
		record: {
			title: '用<b>你的声音</b>录下要教鹦鹉的词语',
			scene: '平板旁站杆上的鹦鹉，以及用主人声音录制的词语“你好”',
			voiceOwner: '主人的声音',
		},
		place: {
			title: '出门前，把<b>闲置设备</b>放在鸟笼旁并开始学习',
			scene: '连接充电器的平板放在鸟笼上，在鹦鹉旁边进行学习的照片',
			spareDevice: '闲置设备（平板、旧手机）',
			charger: '连接充电器',
		},
		live: {
			title: '在外面也能用<b>你的手机</b>实时查看学习详情',
			scene: '手机上显示的学习详情，包括学习时长、教的词语、模仿次数、紧急情况和记录',
		},
		sound: {
			title: '<b>鹦鹉专属AI</b>会识别你家鹦鹉的鸣叫和模仿的话，并展示给你',
			scene: '学习详情中的声音记录：鸣叫、模仿的话“你好”、焦躁鸣叫',
		},
		motion: {
			title: '鹦鹉<b>消失或出现的瞬间</b>也会被记录下来',
			scene: '学习详情中的移动记录：鹦鹉消失视频和鹦鹉出现照片',
		},
		start: '开始',
	},
	permissions: {
		intro: 'BuddyBird需要以下权限',
		scene: '鸟笼前的手机听到鹦鹉的声音并发送通知的画面',
		buddyWord: '你好！',
		listening: '正在听声音',
		alert: {
			appName: 'BuddyBird',
			time: '现在',
			message: '学习已完成',
		},
		purpose: {
			microphone: '录制词语和记录鹦鹉的声音',
			notifications: '学习消息通知',
		},
		continue: '继续',
	},
	marketing: {
		intro: '要通过通知接收新功能和活动消息吗？',
		scene: '站杆上的Buddy和墙上贴着的新消息',
		news: {
			features: '新功能',
			events: '活动',
		},
		hint: '可以随时在“设置”的“通知”中更改。',
		night: '晚上9点至早上8点也接收',
		accept: '接收',
		decline: '暂不需要',
	},
	legacy: {
		uploading: '正在转移此手机上的鹦鹉和词语',
		uploadError: '无法转移鹦鹉和词语，请检查网络连接后重试。',
		askTitle: '要添加此手机上的鹦鹉和词语吗？',
	},
};
