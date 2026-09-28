import { useCallback, useEffect, useRef, useState } from 'react';

import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import type { LoginProvider } from '@/types/account';
import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as AppleAuthentication from 'expo-apple-authentication';

import { LastLoginTag } from '@/screens/onboarding/components/last-login-tag';
import { OAuthButton } from '@/screens/onboarding/components/oauth-button';
import { availableLoginProviders } from '@/services/auth/providers';
import { linkAccount, switchAccount } from '@/services/auth/sign-in';
import { reportError } from '@/services/telemetry/client';
import { completeOnboardingStep, viewOnboardingStep } from '@/services/telemetry/onboarding';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import { colors, font, providerColors, radius } from '@/theme';

import { Mascot } from '@/components/mascot';
import { Copy } from '@/components/ui/copy';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextButton } from '@/components/ui/text-button';
import { Title } from '@/components/ui/title';

interface LoginAttempt {
	provider: LoginProvider;
	pending: boolean;
}

/** Apple 로그인 취소 여부 */
const isAppleLoginCanceled = (provider: LoginProvider, e: unknown) =>
	provider === 'apple' &&
	e instanceof Error &&
	'code' in e &&
	(e.code === 'ERR_REQUEST_CANCELED' || e.code === 'ERR_REQUEST_UNKNOWN');

export function LoginScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation();
	const { params } = useRoute<RouteProp<RootStackParamList, 'Login'>>();

	const [providers, setProviders] = useState<LoginProvider[]>([]);
	const [loginAttempt, setLoginAttempt] = useState<LoginAttempt | null>(null);

	const signingInRef = useRef(false);

	const status = useAuthStore((auth) => auth.status);

	const recent = useAccountStore((account) => account.lastLoginProvider);
	const setLoginScreenSeen = useAccountStore((account) => account.setLoginScreenSeen);

	const fromOnboarding = params?.source === 'onboarding';
	const completing = status === 'completing';
	const disabled = loginAttempt?.pending === true || completing;
	const loadingProvider = disabled ? loginAttempt?.provider : undefined;
	const recentHint = t('auth.recentHint');
	const progressLabel = loadingProvider
		? t(`auth.pending.${loadingProvider}`)
		: completing
			? t('auth.completing')
			: null;

	useEffect(() => {
		let active = true;

		void availableLoginProviders().then((list) => {
			if (active) {
				setProviders(list);
			}
		});

		return () => {
			active = false;
		};
	}, []);

	useFocusEffect(
		useCallback(() => {
			if (fromOnboarding) {
				viewOnboardingStep('login');
			}
		}, [fromOnboarding]),
	);

	/** 소셜 계정 연결, 이미 연결된 계정으로 전환, 로그인 단계 완료 전송 */
	const handleSignIn = async (provider: LoginProvider) => {
		if (signingInRef.current) {
			return;
		}

		signingInRef.current = true;

		setLoginAttempt({ provider, pending: true });

		try {
			const linkResult = await linkAccount(provider);

			if (linkResult === 'exists') {
				await switchAccount(provider);
			} else if (linkResult === 'linked' && !fromOnboarding) {
				navigation.goBack();
			}

			if (fromOnboarding && linkResult !== 'cancelled') {
				completeOnboardingStep('login', { login_method: provider });
			}
		} catch (e) {
			if (!isAppleLoginCanceled(provider, e)) {
				reportError(e, 'sign_in');

				Alert.alert(t('auth.signInError'));
			}
		} finally {
			signingInRef.current = false;

			setLoginAttempt({ provider, pending: false });
		}
	};

	return (
		<View style={styles.root}>
			<Screen contentContainerStyle={styles.screen}>
				{/*헤더*/}
				<ScreenHeader
					onBack={fromOnboarding ? undefined : () => navigation.goBack()}
					right={
						fromOnboarding ? (
							<TextButton
								label={t('common.skip')}
								variant="muted"
								disabled={disabled}
								onPress={() => {
									completeOnboardingStep('login', { login_method: 'skip' });

									setLoginScreenSeen(true);
								}}
							/>
						) : undefined
					}
				/>

				{/*소개*/}
				<View style={styles.intro}>
					<Mascot size={150} />
					<Title style={styles.product}>{t('entry.login.product')}</Title>
				</View>

				{/*로그인 버튼*/}
				<View style={styles.actions}>
					{providers.includes('google') ? (
						<View>
							{recent === 'google' ? <LastLoginTag label={t('auth.recent')} /> : null}
							<OAuthButton
								provider="google"
								loading={loadingProvider === 'google'}
								disabled={disabled}
								hint={recent === 'google' ? recentHint : undefined}
								onPress={() => void handleSignIn('google')}
							/>
						</View>
					) : null}

					{providers.includes('kakao') ? (
						<View>
							{recent === 'kakao' ? <LastLoginTag label={t('auth.recent')} /> : null}
							<OAuthButton
								provider="kakao"
								loading={loadingProvider === 'kakao'}
								disabled={disabled}
								hint={recent === 'kakao' ? recentHint : undefined}
								onPress={() => void handleSignIn('kakao')}
							/>
						</View>
					) : null}

					{providers.includes('apple') ? (
						<View style={styles.appleButton}>
							{recent === 'apple' ? <LastLoginTag label={t('auth.recent')} /> : null}
							<AppleAuthentication.AppleAuthenticationButton
								buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
								buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
								cornerRadius={radius.control}
								style={styles.appleButton}
								accessibilityLabel={t(
									loadingProvider === 'apple' ? 'auth.pending.apple' : 'auth.apple',
								)}
								accessibilityHint={recent === 'apple' ? recentHint : undefined}
								accessibilityState={{
									disabled,
									busy: loadingProvider === 'apple',
								}}
								pointerEvents={disabled ? 'none' : 'auto'}
								onPress={() => void handleSignIn('apple')}
							/>
							{loadingProvider === 'apple' ? (
								<ActivityIndicator
									color={colors.onAccent}
									style={styles.appleProgress}
									pointerEvents="none"
									accessible={false}
								/>
							) : null}
						</View>
					) : null}
				</View>
			</Screen>

			{/*로그인 진행 표시*/}
			{progressLabel ? (
				<View style={styles.progress} accessibilityLiveRegion="polite" accessibilityViewIsModal>
					<ActivityIndicator color={colors.orange} size="large" />
					<Copy style={styles.progressText}>{progressLabel}</Copy>
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	screen: { gap: 36 },
	intro: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
	product: { fontSize: 34, lineHeight: 40, textAlign: 'center' },
	actions: { gap: 12 },
	appleButton: { width: '100%', height: 56 },
	appleProgress: {
		...StyleSheet.absoluteFill,
		backgroundColor: providerColors.apple.background,
		borderRadius: radius.control,
		borderCurve: 'continuous',
	},
	progress: {
		...StyleSheet.absoluteFill,
		backgroundColor: colors.background,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 16,
	},
	progressText: { fontFamily: font.extraBold, fontSize: 16, textAlign: 'center' },
});
