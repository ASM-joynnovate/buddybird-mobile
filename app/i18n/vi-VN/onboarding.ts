import type { OnboardingMessages } from '@/i18n/types/onboarding';

export const onboarding: OnboardingMessages = {
	login: {
		tagline: 'Vẹt vẫn học nói cả khi bạn vắng nhà',
		greeting: {
			title: 'Rất vui được gặp bạn!',
			body: 'Đăng nhập và cùng bắt đầu nhé',
		},
		words: ['Xin chào', 'Yêu lắm', 'Chào buổi sáng', 'Ăn cơm thôi', 'Đẹp quá'],
	},
	consent: {
		intro: 'Vui lòng đồng ý để sử dụng ứng dụng BuddyBird!',
		all: 'Đồng ý tất cả',
	},
	usage: {
		record: {
			title: 'Ghi âm những từ muốn dạy vẹt bằng <b>giọng của bạn</b>',
			scene: 'Con vẹt đậu trên cành cạnh máy tính bảng và từ Xin chào được ghi âm bằng giọng chủ nuôi',
			voiceOwner: 'Giọng chủ nuôi',
		},
		place: {
			title: 'Trước khi ra ngoài, đặt <b>thiết bị không dùng đến</b> cạnh lồng rồi bắt đầu buổi học',
			scene: 'Ảnh máy tính bảng đang cắm sạc, chạy buổi học bên cạnh con vẹt trên nóc lồng',
			spareDevice: 'Thiết bị không dùng đến (máy tính bảng, điện thoại cũ)',
			charger: 'Cắm sạc',
		},
		live: {
			title: 'Ở ngoài vẫn xem được chi tiết buổi học theo thời gian thực trên <b>điện thoại của bạn</b>',
			scene: 'Chi tiết buổi học trên điện thoại: thời gian học, từ đã dạy, số lần bắt chước, tình huống khẩn cấp và nhật ký',
		},
		sound: {
			title: '<b>AI chuyên về vẹt</b> nhận biết tiếng kêu và những lời bé vẹt nhà bạn bắt chước',
			scene: 'Nhật ký âm thanh trong chi tiết buổi học: tiếng kêu, lời bắt chước Xin chào và tiếng kêu hoảng sợ',
		},
		motion: {
			title: 'Cả những lúc vẹt <b>biến mất hay xuất hiện</b> cũng được ghi lại',
			scene: 'Nhật ký chuyển động trong chi tiết buổi học: video Vẹt biến mất và ảnh Vẹt xuất hiện',
		},
		start: 'Bắt đầu',
	},
	permissions: {
		intro: 'Các quyền BuddyBird cần',
		scene: 'Điện thoại trước lồng nghe tiếng vẹt và gửi thông báo',
		buddyWord: 'Xin chào!',
		listening: 'Đang nghe',
		alert: {
			appName: 'BuddyBird',
			time: 'bây giờ',
			message: 'Buổi học đã kết thúc',
		},
		purpose: {
			microphone: 'Ghi âm từ và ghi lại tiếng vẹt',
			notifications: 'Thông báo về buổi học',
		},
		continue: 'Tiếp tục',
	},
	marketing: {
		intro: 'Bạn có muốn nhận thông báo về tính năng mới và sự kiện không?',
		scene: 'Buddy đậu trên cành và tin mới dán trên tường',
		news: {
			features: 'Tính năng mới',
			events: 'Sự kiện',
		},
		hint: 'Bạn có thể thay đổi bất cứ lúc nào trong Cài đặt > Thông báo.',
		night: 'Nhận cả trong khung 21:00 - 08:00',
		accept: 'Nhận thông báo',
		decline: 'Không, cảm ơn',
	},
	legacy: {
		uploading: 'Đang chuyển vẹt và từ vựng trên điện thoại này',
		uploadError: 'Không chuyển được vẹt và từ vựng. Vui lòng kiểm tra kết nối rồi thử lại.',
		askTitle: 'Thêm vẹt và từ vựng trên điện thoại này?',
	},
};
