import type { AuthMessages } from '@/i18n/types/auth';

export const auth: AuthMessages = {
	continue: {
		google: 'Google দিয়ে চালিয়ে যান',
		kakao: 'Kakao দিয়ে চালিয়ে যান',
		apple: 'Apple দিয়ে চালিয়ে যান',
	},
	signingIn: {
		google: 'Google দিয়ে সাইন-ইন করা হচ্ছে',
		kakao: 'Kakao দিয়ে সাইন-ইন করা হচ্ছে',
		apple: 'Apple দিয়ে সাইন-ইন করা হচ্ছে',
	},
	completing: 'BuddyBird-এ সাইন-ইন শেষ করা হচ্ছে',
	existingAccount: {
		title: 'আপনার আগে থেকেই একটি অ্যাকাউন্ট আছে',
		message: 'ওই অ্যাকাউন্টে সাইন-ইন করবেন? এখন পর্যন্ত যা রেকর্ড করেছেন তা সরানো হবে না।',
	},
	signInError: 'সাইন-ইন করা যায়নি। কানেকশন চেক করে সাইন-ইন বাটনে আবার ট্যাপ করুন।',
	lastLogin: 'শেষবার ব্যবহৃত',
	lastLoginHint: 'শেষবার এভাবে সাইন-ইন করেছিলেন',
	signOutError: 'সাইন-আউট করা যায়নি। কানেকশন চেক করে আবার চেষ্টা করুন।',
	signIn: 'সাইন-ইন',
};
