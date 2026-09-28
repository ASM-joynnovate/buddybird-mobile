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
import { loginCredential, takeCredential } from '@/services/auth/credential';
import { type AuthIdentity, nextAuthState, signOutToAnonymous, signUpAnonymously } from '@/services/auth/session';
import { reportError } from '@/services/telemetry/client';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { useReportStore } from '@/stores/report';
import { useSessionStore } from '@/stores/session';

interface Props {
	children: ReactNode;
}

function identityOf(session: Session | null): AuthIdentity | null {
	return session ? { id: session.user.id, anonymous: session.user.is_anonymous === true } : null;
}

function sameIdentity(previous: AuthIdentity | null | undefined, next: AuthIdentity | null) {
	return previous !== undefined && previous?.id === next?.id && previous?.anonymous === next?.anonymous;
}

export function AuthProvider({ children }: Props) {
	const { mutateAsync } = useLogin();

	const retryCount = useAuthStore((auth) => auth.retryCount);

	useEffect(() => {
		const { setStatus } = useAuthStore.getState();
		const auth = authClient();

		let active = true;
		let current: AuthIdentity | null | undefined;
		let loginAbort: AbortController | undefined;
		let receivedEvent = false;

		setStatus('loading');

		async function signUp() {
			takeCredential();
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
		}

		async function completeLogin(identity: AuthIdentity, linked: boolean) {
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
			} catch (error) {
				if (!active || controller.signal.aborted) {
					return;
				}

				alertFailure(error);

				if (
					identity.anonymous ||
					!(error instanceof ApiError) ||
					error.retryable ||
					error.code === 'CLIENT__INVALID_RESPONSE'
				) {
					current = undefined;

					setStatus('error');

					return;
				}

				try {
					await signOutToAnonymous();
				} catch (signOutError) {
					reportError(signOutError, 'login_sign_out');

					if (active && !controller.signal.aborted) {
						Alert.alert(i18next.t('auth.signOutError'));

						setStatus('error');
					}
				}
			}
		}

		async function acceptSession(session: Session | null) {
			const next = identityOf(session);

			if (!active || sameIdentity(current, next)) {
				return;
			}

			current = next;

			loginAbort?.abort();
			void queryClient.cancelQueries();

			const { authUserId, isAnonymous } = useAccountStore.getState();
			const transition = nextAuthState(authUserId ? { id: authUserId, anonymous: isAnonymous } : null, next);

			if (transition === 'signedOut' || next === null) {
				await signUp();

				return;
			}

			if (transition === 'signedIn') {
				setStatus('signedIn');

				return;
			}

			await completeLogin(next, transition === 'linked');
		}

		const {
			data: { subscription },
		} = auth.onAuthStateChange((event, session) => {
			// getSession below reports restoration errors that INITIAL_SESSION masks as null.
			if (event === 'INITIAL_SESSION') {
				return;
			}

			receivedEvent = true;

			// The callback stays synchronous so SDK calls never hold its auth lock.
			void acceptSession(session);
		});

		void auth
			.getSession()
			.then(({ data, error }) => {
				if (!active || receivedEvent) {
					return;
				}

				if (!error) {
					void acceptSession(data.session);
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

		const refresh = (next: string) => {
			if (next === 'active') {
				void auth.startAutoRefresh();
			} else {
				void auth.stopAutoRefresh();
			}
		};

		refresh(AppState.currentState);

		const lifecycle = AppState.addEventListener('change', refresh);

		return () => {
			active = false;
			loginAbort?.abort();
			subscription.unsubscribe();
			lifecycle.remove();
			void auth.stopAutoRefresh();
		};
	}, [retryCount, mutateAsync]);

	return children;
}

function alertFailure(error: unknown) {
	Alert.alert(apiErrorMessage(error, i18next.t), error instanceof ApiError ? error.code : undefined);
}
