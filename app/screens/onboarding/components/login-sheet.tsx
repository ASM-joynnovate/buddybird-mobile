import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { LoginProvider } from '@/types/account';

import useStartupLanding from '@/hooks/use-startup-landing';

import { useTranslation } from 'react-i18next';

import * as AppleAuthentication from 'expo-apple-authentication';
import Animated, { Easing, FadeInUp, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SECOND } from '@/config/units';
import LastLoginTag from '@/screens/onboarding/components/last-login-tag';
import OAuthButton from '@/screens/onboarding/components/oauth-button';
import { useAccountStore } from '@/stores/account';
import { colors, contentMaxWidth, font, loginProviderColors, radius } from '@/theme';

import Mascot from '@/components/mascot';
import { Copy } from '@/components/ui/copy';
import { SpeechBubble } from '@/components/ui/speech-bubble';

const SHEET_MS = 0.7 * SECOND;
const GREETING_DELAY_MS = 700;

const sheetEasing = Easing.bezier(0.16, 1, 0.3, 1);

interface Props {
	providers: LoginProvider[];
	loadingProvider?: LoginProvider;
	disabled: boolean;
	progressLabel: string | null;
	existingAccountProvider: LoginProvider | null;
	introAnimated: boolean;
	onSignIn: (provider: LoginProvider) => void;
}

/**
 * 버디의 인사와 로그인 버튼이 있는 흰 시트 컴포넌트
 * @param providers 사용할 수 있는 로그인 방식 목록
 * @param loadingProvider 로그인 중인 방식
 * @param disabled 버튼 비활성화 여부
 * @param progressLabel 로그인 진행 문구
 * @param existingAccountProvider 이미 가입한 계정이라 연결하지 못한 로그인 방식
 * @param introAnimated 첫 등장 애니메이션 실행 여부
 * @param onSignIn 로그인 버튼을 누를 때 실행할 함수
 */
const LoginSheet = ({
	providers,
	loadingProvider,
	disabled,
	progressLabel,
	existingAccountProvider,
	introAnimated,
	onSignIn,
}: Props) => {
	const { t } = useTranslation();

	const insets = useSafeAreaInsets();

	const { buddyRef, sheetRef, buddyStyle } = useStartupLanding();

	const lastLoginProvider = useAccountStore((state) => state.lastLoginProvider);

	const lastLoginHint = t('auth.lastLoginHint');

	return (
		<Animated.View
			ref={sheetRef}
			entering={introAnimated ? SlideInDown.duration(SHEET_MS).easing(sheetEasing) : undefined}
			style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
		>
			<View style={styles.content}>
				<View style={styles.greetingContainer}>
					<Animated.View ref={buddyRef} style={[styles.mascot, buddyStyle]}>
						<Mascot size={92} />
					</Animated.View>

					<Animated.View
						entering={introAnimated ? FadeInUp.delay(GREETING_DELAY_MS) : undefined}
						style={styles.bubbleContainer}
						accessibilityLiveRegion="polite"
					>
						<SpeechBubble pointerSide="left">
							<Copy style={styles.greetingTitle}>
								{existingAccountProvider
									? t(`auth.existingAccount.title.${existingAccountProvider}`)
									: t('onboarding.login.greeting.title')}
							</Copy>
							<Copy style={styles.greetingBody}>
								{existingAccountProvider
									? t('auth.existingAccount.body')
									: t('onboarding.login.greeting.body')}
							</Copy>
						</SpeechBubble>
					</Animated.View>
				</View>

				<View style={styles.authContainer}>
					<View
						accessibilityElementsHidden={!!progressLabel}
						importantForAccessibility={progressLabel ? 'no-hide-descendants' : 'auto'}
						style={[styles.actionsContainer, !!progressLabel && styles.hidden]}
					>
						{providers.includes('google') && (
							<View>
								{lastLoginProvider === 'google' && <LastLoginTag label={t('auth.lastLogin')} />}
								<OAuthButton
									provider="google"
									loading={loadingProvider === 'google'}
									disabled={disabled}
									hint={lastLoginProvider === 'google' ? lastLoginHint : undefined}
									onPress={() => onSignIn('google')}
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
									onPress={() => onSignIn('kakao')}
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
									onPress={() => onSignIn('apple')}
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

					{/*로그인 중에는 버튼 자리에 진행 표시*/}
					{!!progressLabel && (
						<View style={styles.progress} accessibilityLiveRegion="polite">
							<ActivityIndicator color={colors.orange} size="large" />
							<Copy style={styles.progressText}>{progressLabel}</Copy>
						</View>
					)}
				</View>
			</View>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	sheet: {
		width: '100%',
		paddingTop: 28,
		paddingHorizontal: 24,
		borderTopLeftRadius: radius.sheet,
		borderTopRightRadius: radius.sheet,
		borderCurve: 'continuous',
		backgroundColor: colors.background,
	},
	content: { width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center', gap: 24 },
	greetingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
	mascot: { marginLeft: -8 },
	bubbleContainer: { flex: 1, minWidth: 0 },
	greetingTitle: { fontFamily: font.black, fontSize: 20, lineHeight: 26 },
	greetingBody: { fontSize: 14, lineHeight: 20, color: colors.muted },
	authContainer: { minHeight: 80, justifyContent: 'center' },
	actionsContainer: { gap: 12 },
	hidden: { opacity: 0 },
	appleButton: { width: '100%', height: 56 },
	appleProgress: {
		...StyleSheet.absoluteFill,
		backgroundColor: loginProviderColors.apple.background,
		borderRadius: radius.control,
		borderCurve: 'continuous',
	},
	progress: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 16 },
	progressText: { fontFamily: font.extraBold, fontSize: 16, textAlign: 'center' },
});

export default LoginSheet;
