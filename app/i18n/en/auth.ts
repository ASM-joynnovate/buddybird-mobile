import type { AuthMessages } from "@/i18n/types/auth"

export const auth: AuthMessages = {
	title: "Log in to BuddyBird",
	description: "Log in to start learning with your parrot.",
	google: "Continue with Google",
	kakao: "Continue with Kakao",
	apple: "Continue with Apple",
	pending: {
		google: "Logging in with Google",
		kakao: "Logging in with Kakao",
		apple: "Logging in with Apple",
	},
	completing: "Finishing your BuddyBird login",
	signInError: "Couldn't log in. Check your connection and tap a login button to try again.",
	restoreError: "Couldn't restore your login. Please try again.",
	recent: "Last used",
	recentHint: "You last logged in this way",
	signOut: "Log out on this device",
	signOutError: "Couldn't log out. Check your connection and try again.",
	signIn: "Log in",
	signInRequired: "Log in to see the sounds your parrot mimicked",
	merge: {
		title: "Merge this phone's records?",
		message:
			"This social account already has a BuddyBird account. Merging moves the parrots, words, and learning records on this phone into that account, and keeps that account's nickname and photo. If you registered the same parrot twice, delete one in Profile after merging.",
		confirm: "Merge",
	},
}
