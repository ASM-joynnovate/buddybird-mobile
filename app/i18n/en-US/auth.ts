import type { AuthMessages } from '@/i18n/types/auth';

export const auth: AuthMessages = {
	continue: {
		google: 'Continue with Google',
		kakao: 'Continue with Kakao',
		apple: 'Continue with Apple',
	},
	signingIn: {
		google: 'Signing in with Google',
		kakao: 'Signing in with Kakao',
		apple: 'Signing in with Apple',
	},
	completing: 'Finishing your BuddyBird sign-in',
	existingAccount: {
		title: 'You already have an account',
		message: "Sign in to that account? What you've recorded so far won't be moved.",
	},
	signInError: "Couldn't sign in. Check your connection and tap a sign-in button to try again.",
	lastLogin: 'Last used',
	lastLoginHint: 'You last signed in this way',
	signOutError: "Couldn't sign out. Check your connection and try again.",
	signIn: 'Sign in',
};
