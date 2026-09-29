import { type ReactNode, useEffect } from 'react';

import { Alert, AppState } from 'react-native';

import { ApiError } from '@/types/apis/common';

import { useLogin } from '@/hooks/apis/auth';
import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';

import i18next from '@/i18n';

import { apiErrorMessage } from '@/lib/api';
import { queryClient } from '@/lib/query-client';

import { isAuthRetryableFetchError, type Session } from '@supabase/supabase-js';

import { authClient } from '@/services/auth/client';
import { loginCredential, takeAppleLoginCredential } from '@/services/auth/credential';
import { type AuthIdentity, getAuthTransition, signOutLocally, signUpAnonymously } from '@/services/auth/session';
import { reportError } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useReportStore } from '@/stores/report';
import { useSessionStore } from '@/stores/session';

interface Props {
	children: ReactNode;
}

/** 세션 사용자의 ID와 익명 여부, 세션이 없으면 null */
const identityOf = (session: Session | null) => {
	return session ? { id: session.user.id, anonymous: session.user.is_anonymous === true } : null;
};

/** 앞서 받은 사용자와 새 사용자의 ID와 익명 여부가 같은지 확인 */
const sameIdentity = (previous: AuthIdentity | null | undefined, nextIdentity: AuthIdentity | null) => {
	return (
		previous !== undefined && previous?.id === nextIdentity?.id && previous?.anonymous === nextIdentity?.anonymous
	);
};

/**
 * 로그인한 사용자가 바뀔 때마다 익명 가입이나 서버 로그인을 하고 인증 상태를 갱신하는 provider
 * @param children 감싸는 내용
 */
const AuthProvider = ({ children }: Props) => {
	const { mutateAsync } = useLogin();

	const retryCount = useAuthStore((state) => state.retryCount);

	/** 처음 그릴 때와 인증을 다시 시도할 때 저장된 세션 복원, 로그인 상태 변경 구독, 토큰 자동 갱신 시작 */
	useEffect(() => {
		const { setStatus } = useAuthStore.getState();
		const auth = authClient();

		let active = true;
		let currentIdentity: AuthIdentity | null | undefined;
		let loginAbort: AbortController | undefined;
		let receivedEvent = false;

		setStatus('loading');

		/** 로그인 정보, 캐시, 학습 설정, 리포트 기간을 비운 뒤 익명으로 다시 가입 */
		const restartAsAnonymous = async () => {
			takeAppleLoginCredential();
			useAccountStore.getState().clearRegistration();
			useDeviceSettingsStore.getState().setOnboardingCompleted(false);

			queryClient.clear();

			useSessionStore.getState().resetSetup();
			useReportStore.getState().resetPeriod();

			setStatus('signingUp');

			const error = await signUpAnonymously();

			if (error && active) {
				alertFailure(error);

				setStatus('error');
			}
		};

		/** 서버 로그인과 서버 사용자 ID 저장, 실패하면 오류 상태로 바꾸거나 로그아웃 */
		const completeLogin = async (identity: AuthIdentity, linked: boolean) => {
			const controller = new AbortController();

			loginAbort = controller;

			setStatus('completing');

			if (!linked) {
				queryClient.clear();

				useSessionStore.getState().resetSetup();
				useReportStore.getState().resetPeriod();
			}

			try {
				const credential = await loginCredential();
				const { user_id } = await mutateAsync({
					data: {
						...credential,
						language: useDeviceSettingsStore.getState().locale === 'ko-KR' ? 'ko' : 'en',
					},
					signal: controller.signal,
				});

				if (!active || controller.signal.aborted) {
					return;
				}

				useAccountStore.getState().setRegistration(identity.id, user_id, identity.anonymous);

				setStatus('signedIn');

				if (linked) {
					void invalidate(apiKeys.all());
				}
			} catch (e) {
				if (!active || controller.signal.aborted) {
					return;
				}

				alertFailure(e);

				if (
					identity.anonymous ||
					!(e instanceof ApiError) ||
					e.retryable ||
					e.code === 'CLIENT__INVALID_RESPONSE'
				) {
					currentIdentity = undefined;

					setStatus('error');

					return;
				}

				try {
					await signOutLocally();
				} catch (signOutError) {
					reportError(signOutError, 'login_sign_out');

					if (active && !controller.signal.aborted) {
						Alert.alert(i18next.t('auth.signOutError'));

						setStatus('error');
					}
				}
			}
		};

		/** 새 세션의 사용자 변화에 따라 익명 재가입, 로그인 상태 반영, 서버 로그인 중 하나 실행 */
		const acceptSession = async (session: Session | null) => {
			const nextIdentity = identityOf(session);

			if (!active || sameIdentity(currentIdentity, nextIdentity)) {
				return;
			}

			currentIdentity = nextIdentity;

			loginAbort?.abort();
			void queryClient.cancelQueries();

			const { authUserId, isAnonymous } = useAccountStore.getState();
			const transition = getAuthTransition(
				authUserId ? { id: authUserId, anonymous: isAnonymous } : null,
				nextIdentity,
			);

			if (transition === 'signedOut' || nextIdentity === null) {
				await restartAsAnonymous();

				return;
			}

			if (transition === 'signedIn') {
				setStatus('signedIn');

				return;
			}

			await completeLogin(nextIdentity, transition === 'linked');
		};

		const {
			data: { subscription },
		} = auth.onAuthStateChange((event, session) => {
			// INITIAL_SESSION은 세션 복원 실패를 null로 가리므로 아래 getSession 결과로 처리
			if (event === 'INITIAL_SESSION') {
				return;
			}

			receivedEvent = true;

			// 콜백 안에서 SDK 호출을 기다리면 인증 잠금이 풀리지 않으므로 콜백은 동기로 유지
			void acceptSession(session);
		});

		void auth
			.getSession()
			.then(({ data: sessionData, error }) => {
				if (!active || receivedEvent) {
					return;
				}

				if (!error) {
					void acceptSession(sessionData.session);
				} else if (isAuthRetryableFetchError(error) && useAccountStore.getState().authUserId !== null) {
					setStatus('signedIn');
				} else {
					Alert.alert(i18next.t('auth.restoreError'));

					setStatus('error');
				}
			})
			.catch((error: unknown) => {
				reportError(error, 'auth_restore');

				if (active && !receivedEvent) {
					Alert.alert(i18next.t('auth.restoreError'));

					setStatus('error');
				}
			});

		/** 앱이 앞에 있을 때만 토큰 자동 갱신 */
		const toggleAutoRefresh = (appState: string) => {
			if (appState === 'active') {
				void auth.startAutoRefresh();
			} else {
				void auth.stopAutoRefresh();
			}
		};

		toggleAutoRefresh(AppState.currentState);

		const appStateSubscription = AppState.addEventListener('change', toggleAutoRefresh);

		return () => {
			active = false;
			loginAbort?.abort();
			subscription.unsubscribe();
			appStateSubscription.remove();
			void auth.stopAutoRefresh();
		};
	}, [retryCount, mutateAsync]);

	return children;
};

/** 실패 문구와 서버 오류 코드를 경고창으로 표시 */
const alertFailure = (error: unknown) => {
	Alert.alert(apiErrorMessage(error, i18next.t), error instanceof ApiError ? error.code : undefined);
};

export default AuthProvider;
