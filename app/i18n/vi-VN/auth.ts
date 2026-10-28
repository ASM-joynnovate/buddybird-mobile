import type { AuthMessages } from '@/i18n/types/auth';

export const auth: AuthMessages = {
	continue: {
		google: 'Tiếp tục với Google',
		kakao: 'Tiếp tục với Kakao',
		apple: 'Tiếp tục với Apple',
	},
	signingIn: {
		google: 'Đang đăng nhập bằng Google',
		kakao: 'Đang đăng nhập bằng Kakao',
		apple: 'Đang đăng nhập bằng Apple',
	},
	completing: 'Đang hoàn tất đăng nhập BuddyBird',
	existingAccount: {
		title: 'Bạn đã có tài khoản',
		message:
			'Bạn có muốn đăng nhập bằng tài khoản đó không? Dữ liệu bạn đã ghi lại đến nay sẽ không được chuyển sang.',
	},
	signInError: 'Không đăng nhập được. Vui lòng kiểm tra kết nối rồi chạm lại vào nút đăng nhập.',
	lastLogin: 'Đăng nhập gần đây',
	lastLoginHint: 'Cách bạn đăng nhập lần trước',
	signOutError: 'Không đăng xuất được. Vui lòng kiểm tra kết nối rồi thử lại.',
	signIn: 'Đăng nhập',
};
