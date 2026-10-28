import type { AppMessages } from '@/i18n/types/app';

export const app: AppMessages = {
	startup: {
		loading: 'অ্যাপ তৈরি হচ্ছে',
	},
	startupError: {
		title: 'অ্যাপ চালু করা যায়নি',
		message: 'ইন্টারনেট কানেকশন চেক করে আবার চেষ্টা করুন।',
	},
	feedback: {
		sentMessage: 'আপনার মূল্যবান মতামত আমাদের কাছে পৌঁছেছে। BuddyBird-কে আরও ভালো করতে আমরা এটি কাজে লাগাব।',
		retry: 'আবার পাঠান',
		promptTitle: 'আপনার মতামত জানান',
		promptMessage: 'BuddyBird ব্যবহার করে কেমন লাগছে বা কী চান, নির্দ্বিধায় লিখে জানান। এতে আমাদের অনেক সাহায্য হয়!',
		write: 'মতামত লিখুন',
		title: 'মতামত পাঠান',
		placeholder: 'কী আরও ভালো হতে পারে, কোথায় অসুবিধা হচ্ছে বা কোন ফিচার চান, নির্দ্বিধায় লিখুন।',
		privacy: '⚠ নাম, ফোন নম্বরের মতো ব্যক্তিগত তথ্য লিখবেন না।',
		send: 'পাঠান',
		sentTitle: 'ধন্যবাদ!',
		sendError: 'মতামত পাঠানো যায়নি। আপনার লেখা রেখে দেওয়া হয়েছে, কানেকশন চেক করে আবার চেষ্টা করুন।',
	},
	update: {
		title: 'আপডেট পাওয়া যাচ্ছে',
		forcedTitle: 'আপডেট করা দরকার',
		message: 'BuddyBird-এর {{version}} ভার্সন এখন পাওয়া যাচ্ছে।',
		forcedMessage: 'ব্যবহার চালিয়ে যেতে {{version}} ভার্সনে আপডেট করুন।',
		forcedMessageWithoutVersion: 'ব্যবহার চালিয়ে যেতে অ্যাপটি আপডেট করুন।',
		accept: 'আপডেট করুন',
		openStoreError: 'স্টোর খোলা যায়নি। আবার চেষ্টা করুন।',
	},
};
