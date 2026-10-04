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
		title: {
			google: string;
			kakao: string;
			apple: string;
		};
		body: string;
	};
	signInError: string;
	lastLogin: string;
	lastLoginHint: string;
	signOutError: string;
	signIn: string;
};
