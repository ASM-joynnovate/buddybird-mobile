import { useCallback, useEffect, useRef, useState } from 'react';

import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import type { LoginProvider } from '@/types/account';
import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as AppleAuthentication from 'expo-apple-authentication';

import LastLoginTag from '@/screens/onboarding/components/last-login-tag';
import OAuthButton from '@/screens/onboarding/components/oauth-button';
import { availableLoginProviders } from '@/services/auth/providers';
import { linkAccount, signIn } from '@/services/auth/sign-in';
import { reportError } from '@/services/telemetry/client';
import { trackOnboardingStepCompleted, trackOnboardingStepViewed } from '@/services/telemetry/onboarding';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import { colors, font, loginProviderColors, radius } from '@/theme';

import Mascot from '@/components/mascot';
import { Copy } from '@/components/ui/copy';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextButton } from '@/components/ui/text-button';
import { Title } from '@/components/ui/title';

interface LoginAttempt {
	provider: LoginProvider;
	pending: boolean;
}

/** Apple 로그인 취소 여부를 반환하는 함수 */
const isAppleLoginCanceled = (provider: LoginProvider, e: unknown) =>
	provider === 'apple' &&
	e instanceof Error &&
	'code' in e &&
	(e.code === 'ERR_REQUEST_CANCELED' || e.code === 'ERR_REQUEST_UNKNOWN');

/** 로그인 화면 */
const LoginScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation();
	const { params } = useRoute<RouteProp<RootStackParamList, 'Login'>>();

	const [providers, setProviders] = useState<LoginProvider[]>([]);
	const [loginAttempt, setLoginAttempt] = useState<LoginAttempt | null>(null);

	const signingInRef = useRef(false);

	const authStatus = useAuthStore((state) => state.status);

	const lastLoginProvider = useAccountStore((state) => state.lastLoginProvider);
	const setLoginScreenSeen = useAccountStore((state) => state.setLoginScreenSeen);

	const fromOnboarding = params?.source === 'onboarding';
	const completing = authStatus === 'completing';
	const disabled = loginAttempt?.pending === true || completing;
	const loadingProvider = disabled ? loginAttempt?.provider : undefined;
	const lastLoginHint = t('auth.lastLoginHint');
	const progressLabel = loadingProvider
		? t(`auth.signingIn.${loadingProvider}`)
		: completing
			? t('auth.completing')
			: null;

	/** 화면 진입 시 사용할 수 있는 로그인 방식 조회 */
	useEffect(() => {
		let active = true;

		void availableLoginProviders().then((loadedProviders) => {
			if (active) {
				setProviders(loadedProviders);
			}
		});

		return () => {
			active = false;
		};
	}, []);

	/** 온보딩에서 화면 진입 시 onboarding_step_viewed 이벤트 전송 */
	useFocusEffect(
		useCallback(() => {
			if (fromOnboarding) {
				trackOnboardingStepViewed('login');
			}
		}, [fromOnboarding]),
	);

	const handleSignIn = async (provider: LoginProvider) => {
		if (signingInRef.current) {
			return;
		}

		signingInRef.current = true;

		setLoginAttempt({ provider, pending: true });

		try {
			const linkResult = await linkAccount(provider);

			if (linkResult === 'identityExists') {
				await signIn(provider);
			} else if (linkResult === 'linked' && !fromOnboarding) {
				navigation.goBack();
			}

			if (fromOnboarding && linkResult !== 'cancelled') {
				trackOnboardingStepCompleted('login', { login_method: provider });
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

	const handleSkip = () => {
		trackOnboardingStepCompleted('login', { login_method: 'skip' });

		setLoginScreenSeen(true);
	};

	return (
		<View style={styles.container}>
			<Screen contentContainerStyle={styles.screen}>
				<ScreenHeader
					onBack={fromOnboarding ? undefined : () => navigation.goBack()}
					trailing={
						fromOnboarding ? (
							<TextButton
								label={t('common.skip')}
								variant="muted"
								disabled={disabled}
								onPress={handleSkip}
							/>
						) : undefined
					}
				/>

				<View style={styles.introContainer}>
					<Mascot size={150} />
					<Title style={styles.product}>{t('onboarding.login.product')}</Title>
				</View>

				<View style={styles.actionsContainer}>
					{providers.includes('google') && (
						<View>
							{lastLoginProvider === 'google' && <LastLoginTag label={t('auth.lastLogin')} />}
							<OAuthButton
								provider="google"
								loading={loadingProvider === 'google'}
								disabled={disabled}
								hint={lastLoginProvider === 'google' ? lastLoginHint : undefined}
								onPress={() => void handleSignIn('google')}
							/>
						</View>
					)}

					{providers.includes('kakao') && (
						<View>
							{lastLoginProvider === 'kakao' && <LastLoginTag label={t('auth.lastLogin')} />}
							<OAuthButton
								provider="kakao"
								loading={loadingProvider === 'kakao'}
								disabled={disabled}
								hint={lastLoginProvider === 'kakao' ? lastLoginHint : undefined}
								onPress={() => void handleSignIn('kakao')}
							/>
						</View>
					)}

					{providers.includes('apple') && (
						<View style={styles.appleButton}>
							{lastLoginProvider === 'apple' && <LastLoginTag label={t('auth.lastLogin')} />}
							<AppleAuthentication.AppleAuthenticationButton
								buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
								buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
								cornerRadius={radius.control}
								style={styles.appleButton}
								accessibilityLabel={t(
									loadingProvider === 'apple' ? 'auth.signingIn.apple' : 'auth.continue.apple',
								)}
								accessibilityHint={lastLoginProvider === 'apple' ? lastLoginHint : undefined}
								accessibilityState={{
									disabled,
									busy: loadingProvider === 'apple',
								}}
								pointerEvents={disabled ? 'none' : 'auto'}
								onPress={() => void handleSignIn('apple')}
							/>
							{loadingProvider === 'apple' && (
								<ActivityIndicator
									color={colors.onFilled}
									style={styles.appleProgress}
									pointerEvents="none"
									accessible={false}
								/>
							)}
						</View>
					)}
				</View>
			</Screen>

			{!!progressLabel && (
				<View style={styles.progress} accessibilityLiveRegion="polite" accessibilityViewIsModal>
					<ActivityIndicator color={colors.orange} size="large" />
					<Copy style={styles.progressText}>{progressLabel}</Copy>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1 },
	screen: { gap: 36 },
	introContainer: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
	product: { fontSize: 34, lineHeight: 40, textAlign: 'center' },
	actionsContainer: { gap: 12 },
	appleButton: { width: '100%', height: 56 },
	appleProgress: {
		...StyleSheet.absoluteFill,
		backgroundColor: loginProviderColors.apple.background,
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

export default LoginScreen;
