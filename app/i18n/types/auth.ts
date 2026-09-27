export type AuthMessages = {
	title: string
	description: string
	google: string
	kakao: string
	apple: string
	pending: {
		google: string
		kakao: string
		apple: string
	}
	completing: string
	signInError: string
	restoreError: string
	recent: string
	recentHint: string
	signOut: string
	signOutError: string
	signIn: string
	signInRequired: string
}
