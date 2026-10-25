import { type ReactNode, useEffect } from 'react';

import { AppState } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';

import { ApiError } from '@/types/apis/common';

import { useLogin } from '@/hooks/apis/auth';
import { apiKeys } from '@/hooks/apis/keys';

import i18next from '@/i18n';

import { apiErrorMessage } from '@/lib/api';
import { usesAuthorization } from '@/lib/query-client';
import { getSupabase } from '@/lib/supabase';

import { isAuthRetryableFetchError, type Session } from '@supabase/supabase-js';
import { toast } from 'sonner-native';

import { loginCredential, takeAppleLoginCredential } from '@/services/auth/credential';
import { type AuthIdentity, getAuthTransition, signOutLocally } from '@/services/auth/session';
import { reportError } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useReportStore } from '@/stores/report';
import { useSessionStore } from '@/stores/session';

import { Toast } from '@/components/ui/toast';

interface Props {
	children: ReactNode;
}

/** 세션의 사용자 정보를 반환하는 함수 */
const identityOf = (session: Session | null) => {
	return session ? { id: session.user.id, isAnonymous: session.user.is_anonymous === true } : null;
};

/** 같은 사용자인지 비교하는 함수 */
const sameIdentity = (previous: AuthIdentity | null | undefined, nextIdentity: AuthIdentity | null) => {
	return (
		previous !== undefined &&
		previous?.id === nextIdentity?.id &&
		previous?.isAnonymous === nextIdentity?.isAnonymous
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
		let loginAbortController: AbortController | undefined;
		let authEventReceived = false;

		setStatus('loading');

		/** 이전 사용자의 조회 결과 및 화면 설정 삭제 함수 */
		const clearUserData = () => {
			queryClient.removeQueries({ predicate: usesAuthorization });
			queryClient.getMutationCache().clear();

			useSessionStore.getState().resetSetup();
			useReportStore.getState().resetPeriod();
		};

		/** 로그인 정보 삭제 후 로그인 화면 이동 함수 */
		const resetToSignedOut = () => {
			takeAppleLoginCredential();
			useAuthStore.getState().clearRegistration();

			useAccountStore.getState().setServerUserId(null);

			clearUserData();

			setStatus('signedOut');
		};

		/** 서버 로그인 함수 */
		const completeLogin = async (identity: AuthIdentity, identityLinked: boolean) => {
			const controller = new AbortController();

			loginAbortController = controller;

			if (!identityLinked) {
				setStatus('completing');

				clearUserData();
			}

			try {
				const credential = await loginCredential();
				const { user_id, is_new_user } = await mutateAsync({
					data: credential,
					signal: controller.signal,
				});

				if (!active || controller.signal.aborted) {
					return;
				}

				// 새로 가입한 계정은 온보딩부터 표시
				if (is_new_user) {
					useDeviceSettingsStore.getState().setOnboardingCompleted(false);
				}

				const { loginProvider, setRegistration } = useAuthStore.getState();

				setRegistration(identity.id, identity.isAnonymous);

				useAccountStore.getState().setServerUserId(user_id);

				if (!identity.isAnonymous && loginProvider) {
					useDeviceSettingsStore.getState().setLastLoginProvider(loginProvider);
				}

				setStatus('signedIn');

				if (identityLinked) {
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
					(identity.isAnonymous && e.code !== 'AUTH__INVALID_TOKEN')
				) {
					currentIdentity = undefined;

					setStatus('error');

					return;
				}

				if (!identity.isAnonymous) {
					toast.custom(<Toast variant="error" message={apiErrorMessage(e, i18next.t)} />);
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

			loginAbortController?.abort();
			void queryClient.cancelQueries({ predicate: usesAuthorization });

			const { authUserId, isAnonymous } = useAuthStore.getState();
			const transition = getAuthTransition(authUserId ? { id: authUserId, isAnonymous } : null, nextIdentity);

			if (transition === 'signedOut' || nextIdentity === null) {
				resetToSignedOut();

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
			// getSession으로 복원 결과 확인
			if (event === 'INITIAL_SESSION') {
				return;
			}

			authEventReceived = true;

			// await하면 인증 잠금이 풀리지 않음
			void acceptSession(session);
		});

		void auth
			.getSession()
			.then(({ data: sessionData, error }) => {
				if (!active || authEventReceived) {
					return;
				}

				if (!error) {
					void acceptSession(sessionData.session);
				} else if (isAuthRetryableFetchError(error) && useAuthStore.getState().authUserId !== null) {
					setStatus('signedIn');
				} else {
					reportError(error, 'auth_restore');

					setStatus('error');
				}
			})
			.catch((error: unknown) => {
				reportError(error, 'auth_restore');

				if (active && !authEventReceived) {
					setStatus('error');
				}
			});

		/** 앱이 foreground일 때만 토큰 자동 갱신 */
		const setAutoRefreshByAppState = (appState: string) => {
			if (appState === 'active') {
				void auth.startAutoRefresh();
			} else {
				void auth.stopAutoRefresh();
			}
		};

		setAutoRefreshByAppState(AppState.currentState);

		const appStateSubscription = AppState.addEventListener('change', setAutoRefreshByAppState);

		return () => {
			active = false;
			loginAbortController?.abort();
			subscription.unsubscribe();
			appStateSubscription.remove();
			void auth.stopAutoRefresh();
		};
	}, [retryCount, mutateAsync, queryClient]);

	return children;
};

export default AuthProvider;
