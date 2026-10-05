import { useCallback, useEffect, useRef, useState } from 'react';

import { AppState, type LayoutChangeEvent, StatusBar, StyleSheet, View } from 'react-native';

import type { LoginProvider } from '@/types/account';
import type { RootStackParamList } from '@/types/navigation';

import { useLogout } from '@/hooks/apis/auth';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useFocusEffect, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import FloatingWords from '@/screens/onboarding/components/floating-words';
import LoginSheet from '@/screens/onboarding/components/login-sheet';
import { availableLoginProviders } from '@/services/auth/providers';
import { signUpAnonymously } from '@/services/auth/session';
import { linkAccount, signIn } from '@/services/auth/sign-in';
import { reportError } from '@/services/telemetry/client';
import { trackOnboardingStepCompleted, trackOnboardingStepViewed } from '@/services/telemetry/onboarding';
import { useAccountStore } from '@/stores/account';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useMessageStore } from '@/stores/message';
import { colors, contentMaxWidth, font } from '@/theme';

import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Copy } from '@/components/ui/copy';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextButton } from '@/components/ui/text-button';

const WORDMARK_DELAY_MS = 200;
const TAGLINE_DELAY_MS = 400;
const HEADER_DELAY_MS = 700;
const MAX_RISE_HEIGHT = 200;
const MIN_RISE_HEIGHT = 80;
const WORD_OVERLAP = 16;

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
	const screenFocused = useIsFocused();
	const { params } = useRoute<RouteProp<RootStackParamList, 'Login'>>();

	const [providers, setProviders] = useState<LoginProvider[] | null>(null);
	const [loginAttempt, setLoginAttempt] = useState<LoginAttempt | null>(null);
	const [existingAccountProvider, setExistingAccountProvider] = useState<LoginProvider | null>(null);
	const [wordSpace, setWordSpace] = useState(0);
	const [appActive, setAppActive] = useState(AppState.currentState === 'active');

	const signingInRef = useRef(false);

	const { mutateAsync } = useLogout();

	const authStatus = useAuthStore((state) => state.status);
	const setAuthStatus = useAuthStore((state) => state.setStatus);

	const splashFinished = useAppStore((state) => state.splashFinished);

	const setLoginScreenSeen = useAccountStore((state) => state.setLoginScreenSeen);

	const openPopup = useMessageStore((state) => state.openPopup);

	const fromOnboarding = params?.source === 'onboarding';
	const introReady = !fromOnboarding || splashFinished;
	const completing = authStatus === 'completing';
	const disabled = loginAttempt?.pending === true || completing;
	const loadingProvider = disabled ? loginAttempt?.provider : undefined;
	const progressLabel = loadingProvider
		? t(`auth.signingIn.${loadingProvider}`)
		: completing
			? t('auth.completing')
			: null;
	const riseHeight = Math.min(wordSpace + WORD_OVERLAP, MAX_RISE_HEIGHT);
	const wordsActive = screenFocused && appActive && !progressLabel && riseHeight >= MIN_RISE_HEIGHT;

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

	/** 앱이 백그라운드로 가거나 돌아올 때 활성 여부 변경 */
	useEffect(() => {
		const subscription = AppState.addEventListener('change', (appState) => setAppActive(appState === 'active'));

		return () => subscription.remove();
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
			if (fromOnboarding) {
				if (await signIn(provider)) {
					trackOnboardingStepCompleted('login', { login_method: provider });
				}

				return;
			}

			// 이미 가입한 계정 다이얼로그에서 로그인을 누르면 그 계정으로 로그인
			if (existingAccountProvider === provider) {
				setExistingAccountProvider(null);

				try {
					await mutateAsync();
				} catch {
					openPopup({ title: t('auth.signInError') });

					return;
				}

				await signIn(provider);

				return;
			}

			const linkResult = await linkAccount(provider);

			// 첫 번째 브라우저가 닫히는 중에는 새 브라우저를 열 수 없으므로 다이얼로그로 확인한 뒤 로그인
			if (linkResult === 'accountExists') {
				setExistingAccountProvider(provider);
			} else if (linkResult === 'linked') {
				navigation.goBack();
			}
		} catch (e) {
			if (!isAppleLoginCanceled(provider, e)) {
				reportError(e, 'sign_in');

				openPopup({ title: t('auth.signInError') });
			}
		} finally {
			signingInRef.current = false;

			setLoginAttempt({ provider, pending: false });
		}
	};

	const handleSignInExistingAccount = () => {
		if (existingAccountProvider) {
			void handleSignIn(existingAccountProvider);
		}
	};

	const handleSkip = async () => {
		if (signingInRef.current) {
			return;
		}

		trackOnboardingStepCompleted('login', { login_method: 'skip' });

		setLoginScreenSeen(true);

		if (authStatus !== 'signedOut') {
			return;
		}

		signingInRef.current = true;

		const error = await signUpAnonymously();

		signingInRef.current = false;

		if (error) {
			reportError(error, 'anonymous_sign_up');

			setAuthStatus('error');
		}
	};

	/** 소개 문구 아래 빈 높이 저장 */
	const handleLayoutWordSpace = (event: LayoutChangeEvent) => {
		setWordSpace(event.nativeEvent.layout.height);
	};

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" />

			{/*스플래시가 끝나기 전에는 빨간 바탕만 표시*/}
			<SafeAreaView edges={['top', 'left', 'right']} style={styles.stageContainer}>
				{introReady && (
					<View style={styles.stage}>
						<Animated.View entering={fromOnboarding ? FadeIn.delay(HEADER_DELAY_MS) : undefined}>
							<ScreenHeader
								onBack={fromOnboarding ? undefined : () => navigation.goBack()}
								backVariant="onBrand"
								trailing={
									fromOnboarding ? (
										<TextButton
											label={t('common.skip')}
											variant="onBrand"
											disabled={disabled}
											onPress={() => void handleSkip()}
										/>
									) : undefined
								}
							/>
						</Animated.View>

						<View style={styles.introContainer}>
							<Animated.View entering={fromOnboarding ? FadeInUp.delay(WORDMARK_DELAY_MS) : undefined}>
								<Copy accessibilityRole="header" style={styles.wordmark}>
									BuddyBird
								</Copy>
							</Animated.View>

							<Animated.View entering={fromOnboarding ? FadeInUp.delay(TAGLINE_DELAY_MS) : undefined}>
								<Copy style={styles.tagline}>{t('onboarding.login.tagline')}</Copy>
							</Animated.View>
						</View>

						<View style={styles.wordSpace} onLayout={handleLayoutWordSpace} />
					</View>
				)}
			</SafeAreaView>

			{/*로그인 방식 조회가 끝난 뒤 시트 표시*/}
			{introReady && providers && (
				<View style={styles.bottomContainer}>
					<FloatingWords
						words={t('onboarding.login.words', { returnObjects: true })}
						active={wordsActive}
						riseHeight={riseHeight}
					/>

					<LoginSheet
						providers={providers}
						loadingProvider={loadingProvider}
						disabled={disabled}
						progressLabel={progressLabel}
						introAnimated={fromOnboarding}
						onSignIn={(provider) => void handleSignIn(provider)}
					/>
				</View>
			)}

			<ConfirmDialog
				visible={existingAccountProvider !== null}
				text={{
					title: t('auth.existingAccount.title'),
					message: t('auth.existingAccount.message'),
					confirm: t('auth.signIn'),
				}}
				onConfirm={handleSignInExistingAccount}
				onClose={() => setExistingAccountProvider(null)}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.brand },
	stageContainer: { flex: 1 },
	stage: {
		flex: 1,
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		paddingHorizontal: 24,
		paddingTop: 20,
	},
	introContainer: { alignItems: 'center', gap: 12, paddingTop: 28 },
	wordmark: { fontFamily: font.splash, fontSize: 40, lineHeight: 48, color: colors.onBrand },
	tagline: { fontFamily: font.extraBold, fontSize: 16, lineHeight: 22, color: colors.onBrand, textAlign: 'center' },
	wordSpace: { flex: 1 },
	bottomContainer: { alignItems: 'center' },
});

export default LoginScreen;
