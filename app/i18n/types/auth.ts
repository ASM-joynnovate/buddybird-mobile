export type AuthMessages = {
	continue: {
		google: string;
		kakao: string;
		apple: string;
	};
	signingIn: {
		google: string;
		kakao: string;
		apple: string;
	};
	completing: string;
	existingAccount: {
		title: string;
		message: string;
	};
	signInError: string;
	lastLogin: string;
	lastLoginHint: string;
	signOutError: string;
	signIn: string;
};
