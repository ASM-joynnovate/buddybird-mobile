import { type LoginRequest, type LoginResult, loginResultSchema, withdrawalSchema } from '@/types/apis/auth';

import type { MockProvider } from '@/mocks/seed';
import { mockServer } from '@/mocks/server';

export const postLogin = async ({
	data,
	signal,
}: {
	data: LoginRequest;
	signal: AbortSignal;
}): Promise<LoginResult> => {
	return loginResultSchema.parse(await mockServer.auth.login());
};

export const postLogout = async (): Promise<void> => {
	await mockServer.auth.logout();
};

export const withdrawal = async (): Promise<void> => {
	withdrawalSchema.parse(await mockServer.auth.withdraw());
};

export const mockGetSession = ({
	authUserId,
	isAnonymous,
}: {
	authUserId: string;
	isAnonymous: boolean;
}): ReturnType<typeof mockServer.auth.restore> => {
	return mockServer.auth.restore(authUserId, isAnonymous);
};

export const mockPutSessionUser = ({
	authUserId,
}: {
	authUserId: string | null;
}): ReturnType<typeof mockServer.auth.use> => {
	return mockServer.auth.use(authUserId);
};

export const mockPostSignIn = ({ provider }: { provider: MockProvider }): ReturnType<typeof mockServer.auth.signIn> => {
	return mockServer.auth.signIn(provider);
};

export const mockPostLinkIdentity = ({
	provider,
}: {
	provider: MockProvider;
}): ReturnType<typeof mockServer.auth.linkIdentity> => {
	return mockServer.auth.linkIdentity(provider);
};

export const mockPostSignUp = (): ReturnType<typeof mockServer.auth.signUpAnonymous> => {
	return mockServer.auth.signUpAnonymous();
};

export const mockGetIdentityLinked = ({
	provider,
}: {
	provider: MockProvider;
}): ReturnType<typeof mockServer.auth.isLinkedElsewhere> => {
	return mockServer.auth.isLinkedElsewhere(provider);
};
