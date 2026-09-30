import { useCallback, useEffect, useRef, useState } from 'react';

import { Alert, AppState, type LayoutChangeEvent, StatusBar, StyleSheet, View } from 'react-native';

import type { LoginProvider } from '@/types/account';
import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useFocusEffect, useIsFocused, useNavigation, useRoute } from '@react-navigation/native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import FloatingWords from '@/screens/onboarding/components/floating-words';
import LoginSheet from '@/screens/onboarding/components/login-sheet';
import { availableLoginProviders } from '@/services/auth/providers';
import { linkAccount, signIn } from '@/services/auth/sign-in';
import { reportError } from '@/services/telemetry/client';
import { trackOnboardingStepCompleted, trackOnboardingStepViewed } from '@/services/telemetry/onboarding';
import { useAccountStore } from '@/stores/account';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { colors, contentMaxWidth, font } from '@/theme';

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
	const focused = useIsFocused();
	const { params } = useRoute<RouteProp<RootStackParamList, 'Login'>>();

	const [providers, setProviders] = useState<LoginProvider[] | null>(null);
	const [loginAttempt, setLoginAttempt] = useState<LoginAttempt | null>(null);
	const [wordSpace, setWordSpace] = useState(0);
	const [appActive, setAppActive] = useState(AppState.currentState === 'active');

	const signingInRef = useRef(false);

	const authStatus = useAuthStore((state) => state.status);

	const splashFinished = useAppStore((state) => state.splashFinished);

	const setLoginScreenSeen = useAccountStore((state) => state.setLoginScreenSeen);

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
	const wordsActive = focused && appActive && !progressLabel && riseHeight >= MIN_RISE_HEIGHT;

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
											onPress={handleSkip}
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
