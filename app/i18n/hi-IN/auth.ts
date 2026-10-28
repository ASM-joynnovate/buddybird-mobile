import type { AuthMessages } from '@/i18n/types/auth';

export const auth: AuthMessages = {
	continue: {
		google: 'Google से जारी रखें',
		kakao: 'Kakao से जारी रखें',
		apple: 'Apple से जारी रखें',
	},
	signingIn: {
		google: 'Google से साइन इन हो रहा है',
		kakao: 'Kakao से साइन इन हो रहा है',
		apple: 'Apple से साइन इन हो रहा है',
	},
	completing: 'BuddyBird में साइन इन पूरा हो रहा है',
	existingAccount: {
		title: 'आपका खाता पहले से मौजूद है',
		message: 'क्या उस खाते से साइन इन करना है? अब तक सेव किया गया रिकॉर्ड उस खाते में नहीं जाएगा।',
	},
	signInError: 'साइन इन नहीं हो सका। कनेक्शन जाँचें और साइन इन बटन पर फिर से टैप करें।',
	lastLogin: 'पिछली बार इस्तेमाल किया',
	lastLoginHint: 'आपने पिछली बार इसी तरीके से साइन इन किया था',
	signOutError: 'साइन आउट नहीं हो सका। कनेक्शन जाँचें और फिर से कोशिश करें।',
	signIn: 'साइन इन करें',
};
