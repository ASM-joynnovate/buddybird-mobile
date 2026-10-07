import { type ReactNode, useEffect } from 'react';

import { AppState } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/types/apis/common';

import { useLogin } from '@/hooks/apis/auth';
import { apiKeys } from '@/hooks/apis/keys';

import i18next from '@/i18n';

import { apiErrorMessage } from '@/lib/api';
import { getSupabase } from '@/lib/supabase';

import { isAuthRetryableFetchError, type Session } from '@supabase/supabase-js';

import { loginCredential, takeAppleLoginCredential } from '@/services/auth/credential';
import { type AuthIdentity, getAuthTransition, signOutLocally } from '@/services/auth/session';
import { reportError } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useMessageStore } from '@/stores/message';
import { useReportStore } from '@/stores/report';
import { useSessionStore } from '@/stores/session';

interface Props {
	children: ReactNode;
}

/** 세션의 사용자 정보를 반환하는 함수 */
const identityOf = (session: Session | null) => {
	return session ? { id: session.user.id, anonymous: session.user.is_anonymous === true } : null;
};

/** 같은 사용자인지 비교하는 함수 */
const sameIdentity = (previous: AuthIdentity | null | undefined, nextIdentity: AuthIdentity | null) => {
	return (
		previous !== undefined && previous?.id === nextIdentity?.id && previous?.anonymous === nextIdentity?.anonymous
	);
};

/**
 * 로그인 상태를 관리하는 provider
 * @param children 감싸는 내용
 */
const AuthProvider = ({ children }: Props) => {
	const queryClient = useQueryClient();

	const { mutateAsync } = useLogin();

	const retryCount = useAuthStore((state) => state.retryCount);

	/** 인증 상태 변경 구독 */
	useEffect(() => {
		const { setStatus } = useAuthStore.getState();
		const auth = getSupabase().auth;

		let active = true;
		let currentIdentity: AuthIdentity | null | undefined;
		let loginAbort: AbortController | undefined;
		let receivedEvent = false;

		setStatus('loading');

		/** 저장된 로그인 정보를 지우고 로그인 화면으로 돌아가는 함수 */
		const clearSignedOutState = () => {
			takeAppleLoginCredential();
			useAccountStore.getState().clearRegistration();
			useDeviceSettingsStore.getState().setOnboardingCompleted(false);

			queryClient.clear();

			useSessionStore.getState().resetSetup();
			useReportStore.getState().resetPeriod();

			setStatus('signedOut');
		};

		/** 서버 로그인 함수 */
		const completeLogin = async (identity: AuthIdentity, linked: boolean) => {
			const controller = new AbortController();

			loginAbort = controller;

			if (!linked) {
				setStatus('completing');

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
					void queryClient.invalidateQueries({ queryKey: apiKeys.all() });
				}
			} catch (e) {
				if (!active || controller.signal.aborted) {
					return;
				}

				reportError(e, 'login');

				if (
					!(e instanceof ApiError) ||
					e.retryable ||
					e.code === 'CLIENT__INVALID_RESPONSE' ||
					(identity.anonymous && e.code !== 'AUTH__INVALID_TOKEN')
				) {
					currentIdentity = undefined;

					setStatus('error');

					return;
				}

				if (!identity.anonymous) {
					useMessageStore.getState().openPopup({ title: apiErrorMessage(e, i18next.t) });
				}

				try {
					await signOutLocally();
				} catch (signOutError) {
					reportError(signOutError, 'login_sign_out');

					if (active && !controller.signal.aborted) {
						setStatus('error');
					}
				}
			}
		};

		/** 새 세션을 반영하는 함수 */
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
				clearSignedOutState();

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
			// INITIAL_SESSION 이벤트는 세션 복원 실패도 null로 전달하므로 아래 getSession 결과를 사용
			if (event === 'INITIAL_SESSION') {
				return;
			}

			receivedEvent = true;

			// 콜백 안에서 SDK 호출을 await하면 인증 잠금이 풀리지 않으므로 await하지 않음
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
					reportError(error, 'auth_restore');

					setStatus('error');
				}
			})
			.catch((error: unknown) => {
				reportError(error, 'auth_restore');

				if (active && !receivedEvent) {
					setStatus('error');
				}
			});

		/** 앱이 foreground일 때만 토큰 자동 갱신 */
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
	}, [retryCount, mutateAsync, queryClient]);

	return children;
};

export default AuthProvider;
