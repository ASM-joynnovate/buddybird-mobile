import type { AppMessages } from '@/i18n/types/app';

export const app: AppMessages = {
	startup: {
		loading: 'Đang chuẩn bị ứng dụng',
	},
	startupError: {
		title: 'Không khởi động được ứng dụng',
		message: 'Vui lòng kiểm tra kết nối Internet rồi thử lại.',
	},
	feedback: {
		sentMessage: 'Góp ý quý giá của bạn đã được gửi. BuddyBird sẽ ghi nhận để ngày càng tốt hơn.',
		retry: 'Gửi lại',
		promptTitle: 'Chia sẻ ý kiến của bạn nhé',
		promptMessage:
			'Bạn cứ thoải mái chia sẻ cảm nhận hoặc mong muốn khi dùng BuddyBird. Góp ý của bạn là động lực rất lớn với chúng tôi!',
		write: 'Viết góp ý',
		title: 'Gửi góp ý',
		placeholder: 'Bạn cứ thoải mái viết điều cần cải thiện, điều chưa tiện hoặc tính năng bạn mong muốn.',
		privacy: '⚠ Vui lòng không nhập thông tin cá nhân như họ tên, số điện thoại.',
		send: 'Gửi',
		sentTitle: 'Cảm ơn bạn!',
		sendError: 'Không gửi được góp ý. Nội dung vẫn được giữ lại, bạn hãy kiểm tra kết nối rồi thử lại nhé.',
	},
	update: {
		title: 'Thông báo cập nhật',
		forcedTitle: 'Cần cập nhật ứng dụng',
		message: 'Đã có BuddyBird phiên bản {{version}}.',
		forcedMessage: 'Vui lòng cập nhật lên phiên bản {{version}} để tiếp tục sử dụng.',
		forcedMessageWithoutVersion: 'Vui lòng cập nhật ứng dụng để tiếp tục sử dụng.',
		accept: 'Cập nhật',
		openStoreError: 'Không mở được cửa hàng ứng dụng. Vui lòng thử lại.',
	},
};
