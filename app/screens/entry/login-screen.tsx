import { useCallback, useEffect, useState } from 'react';

import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { LoginProvider } from '@/types/account';
import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import * as AppleAuthentication from 'expo-apple-authentication';

import { LastLoginTag } from '@/screens/entry/components/last-login-tag';
import { OAuthButton } from '@/screens/entry/components/oauth-button';
import { useLogin } from '@/screens/entry/hooks/use-login';
import { availableLoginProviders } from '@/services/auth/providers';
import { completeOnboardingStep, viewOnboardingStep } from '@/services/telemetry/onboarding';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';
import { colors, font, providerColors, radius } from '@/theme';

import { Mascot } from '@/components/mascot';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Copy, Title } from '@/components/ui/text';
import { TextButton } from '@/components/ui/text-button';

export function LoginScreen() {
	const { t } = useTranslation();

	const navigation = useNavigation();
	const { params } = useRoute<RouteProp<RootStackParamList, 'Login'>>();

	const status = useAuthStore((auth) => auth.status);

	const recent = useAccountStore((account) => account.lastLogin);
	const markLoginScreenSeen = useAccountStore((account) => account.markLoginScreenSeen);

	const entry = params?.source === 'entry';

	const login = useLogin(entry, () => navigation.goBack());

	const [providers, setProviders] = useState<LoginProvider[]>([]);

	const completing = status === 'completing';
	const disabled = login.attempt?.pending === true || completing;
	const loadingProvider = disabled ? login.attempt?.provider : undefined;
	const recentHint = t('auth.recentHint');

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
			if (entry) {
				viewOnboardingStep('login');
			}
		}, [entry]),
	);

	const progressLabel = loadingProvider
		? t(`auth.pending.${loadingProvider}`)
		: completing
			? t('auth.completing')
			: null;

	return (
		<View style={styles.root}>
			<Screen contentContainerStyle={styles.screen}>
				<ScreenHeader
					onBack={entry ? undefined : () => navigation.goBack()}
					right={
						entry ? (
							<TextButton
								label={t('common.skip')}
								tone="muted"
								disabled={disabled}
								onPress={() => {
									completeOnboardingStep('login', { login_method: 'skip' });

									markLoginScreenSeen();
								}}
							/>
						) : undefined
					}
				/>
				<View style={styles.intro}>
					<Mascot size={150} />
					<Title style={styles.product}>{t('entry.login.product')}</Title>
				</View>
				<View style={styles.actions}>
					{providers.includes('google') ? (
						<View>
							{recent === 'google' ? <LastLoginTag label={t('auth.recent')} /> : null}
							<OAuthButton
								provider="google"
								loading={loadingProvider === 'google'}
								disabled={disabled}
								hint={recent === 'google' ? recentHint : undefined}
								onPress={() => login.signIn('google')}
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
								onPress={() => login.signIn('kakao')}
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
								onPress={() => login.signIn('apple')}
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
