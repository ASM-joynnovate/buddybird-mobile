import type { AuthMessages } from '@/i18n/types/auth';

export const auth: AuthMessages = {
	continue: {
		google: 'Continue with Google',
		kakao: 'Continue with Kakao',
		apple: 'Continue with Apple',
	},
	signingIn: {
		google: 'Logging in with Google',
		kakao: 'Logging in with Kakao',
		apple: 'Logging in with Apple',
	},
	completing: 'Finishing your BuddyBird login',
	existingAccount: {
		title: 'You already have an account',
		message: "Log in to that account? What you've recorded so far won't be moved.",
	},
	signInError: "Couldn't log in. Check your connection and tap a login button to try again.",
	lastLogin: 'Last used',
	lastLoginHint: 'You last logged in this way',
	signOutError: "Couldn't log out. Check your connection and try again.",
	signIn: 'Log in',
};
