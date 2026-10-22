import type { AuthMessages } from '@/i18n/types/auth';

export const auth: AuthMessages = {
	continue: {
		google: 'ดำเนินการต่อด้วย Google',
		kakao: 'ดำเนินการต่อด้วย Kakao',
		apple: 'ดำเนินการต่อด้วย Apple',
	},
	signingIn: {
		google: 'กำลังเข้าสู่ระบบด้วย Google',
		kakao: 'กำลังเข้าสู่ระบบด้วย Kakao',
		apple: 'กำลังเข้าสู่ระบบด้วย Apple',
	},
	completing: 'กำลังเข้าสู่ระบบ BuddyBird',
	existingAccount: {
		title: 'คุณมีบัญชีที่สมัครไว้แล้ว',
		message: 'ต้องการเข้าสู่ระบบด้วยบัญชีนั้นไหม ข้อมูลที่บันทึกไว้จนถึงตอนนี้จะไม่ถูกย้ายไปด้วย',
	},
	signInError: 'เข้าสู่ระบบไม่สำเร็จ โปรดตรวจสอบการเชื่อมต่อแล้วกดปุ่มเข้าสู่ระบบอีกครั้ง',
	lastLogin: 'ใช้ล่าสุด',
	lastLoginHint: 'วิธีที่คุณใช้เข้าสู่ระบบครั้งล่าสุด',
	signOutError: 'ออกจากระบบไม่สำเร็จ โปรดตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง',
	signIn: 'เข้าสู่ระบบ',
};
