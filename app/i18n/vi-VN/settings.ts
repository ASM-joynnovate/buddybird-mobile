import type { SettingsMessages } from '@/i18n/types/settings';

export const settings: SettingsMessages = {
	title: 'Cài đặt',
	saveError: 'Không lưu được cài đặt nên đã khôi phục giá trị trước đó.\nVui lòng thử lại.',
	notifications: {
		title: 'Thông báo',
		all: 'Tất cả thông báo',
		permissionOff: 'Quyền thông báo đang tắt nên bạn sẽ không nhận được thông báo',
	},
	general: {
		title: 'Chung',
		languageAndCountry: 'Ngôn ngữ và quốc gia',
		language: 'Ngôn ngữ ứng dụng',
		languageSearchHint: 'Tìm tên ngôn ngữ',
		languageNotFound: 'Không có ngôn ngữ nào khớp với “{{query}}”',
		country: 'Quốc gia',
		countryChoose: 'Vui lòng chọn',
		countrySearchHint: 'Tìm tên quốc gia',
		countrySearchClear: 'Xóa nội dung tìm kiếm',
		countryNotFound: 'Không có quốc gia nào khớp với “{{query}}”',
		devices: 'Thiết bị đã kết nối',
	},
	privacy: {
		title: 'Quyền riêng tư',
		feed: 'Công khai trên bảng tin',
		feedDetail: 'Người khác sẽ thấy lịch sử học và âm thanh vẹt đã bắt chước của bạn',
		leaderboard: 'Tham gia bảng xếp hạng',
		leaderboardDetail: 'Người khác sẽ thấy biệt danh, ảnh và thời gian học của bạn',
		consents: 'Điều khoản đã đồng ý',
	},
	account: {
		signOut: 'Đăng xuất',
		withdraw: 'Xóa tài khoản',
	},
	support: {
		title: 'Hỗ trợ',
		feedback: 'Gửi góp ý',
		version: 'Phiên bản ứng dụng {{version}}',
	},
	signOutDialog: {
		title: 'Đăng xuất',
		message: 'Đăng xuất khỏi thiết bị này?',
		confirm: 'Đăng xuất',
	},
	withdrawDialog: {
		title: 'Xóa tài khoản',
		message: 'Buddy sẽ buồn lắm đó. Bạn thật sự muốn rời đi sao?',
		warning: 'Sau khi xóa tài khoản, bạn không thể hoàn tác.',
		confirm: 'Xóa tài khoản',
	},
	consents: {
		title: 'Điều khoản đã đồng ý',
		saveError: 'Không lưu được thay đổi. Vui lòng thử lại.',
	},
	devices: {
		title: 'Thiết bị đã kết nối',
		thisDevice: 'Thiết bị này',
		runningSession: 'Đang học',
		lastSeen: 'Truy cập lần cuối {{time}}',
		delete: 'Xóa {{name}}',
		deleteMessage: 'Sau khi xóa, thiết bị này sẽ không nhận thông báo nữa.',
		sessionEnds: 'Buổi học đang diễn ra trên thiết bị này sẽ kết thúc.',
		deleteError: 'Không xóa được thiết bị. Vui lòng thử lại.',
	},
};
