import { ActivityIndicator, StyleSheet, View } from 'react-native';

import type { LoginProvider } from '@/types/account';

import { useTranslation } from 'react-i18next';

import * as AppleAuthentication from 'expo-apple-authentication';
import { ChevronRightIcon } from 'lucide-react-native';

import { useAccountStore } from '@/stores/account';
import { colors, loginProviderColors, radius } from '@/theme';

import LastLoginTag from '@/components/social-login-list/last-login-tag';
import OAuthButton from '@/components/social-login-list/oauth-button';
import ProviderLogo from '@/components/social-login-list/provider-logo';
import { Copy } from '@/components/ui/copy';
import { ItemGroup } from '@/components/ui/item/group';
import { itemStyles } from '@/components/ui/item/styles';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	providers: LoginProvider[];
	loadingProvider?: LoginProvider;
	disabled: boolean;
	appearance: 'button' | 'item';
	onSignIn: (provider: LoginProvider) => void;
}

/**
 * 소셜 로그인 방법 목록 컴포넌트
 * @param providers 사용할 수 있는 로그인 방식 목록
 * @param loadingProvider 로그인 중인 방식
 * @param disabled 버튼 비활성화 여부
 * @param appearance 로그인 버튼 모양 또는 설정 목록 모양
 * @param onSignIn 로그인 방식을 누를 때 실행할 함수
 */
const SocialLoginList = ({ providers, loadingProvider, disabled, appearance, onSignIn }: Props) => {
	const { t } = useTranslation();

	const lastLoginProvider = useAccountStore((state) => state.lastLoginProvider);

	const lastLoginHint = t('auth.lastLoginHint');

	if (appearance === 'item') {
		return (
			<ItemGroup>
				{providers.map((provider, index) => (
					<PressableSurface
						key={provider}
						accessibilityLabel={t(
							loadingProvider === provider ? `auth.signingIn.${provider}` : `auth.continue.${provider}`,
						)}
						accessibilityState={{ busy: loadingProvider === provider }}
						disabled={disabled}
						onPress={() => onSignIn(provider)}
						variant="plain"
						depth="none"
						cornerRadius="none"
						style={index > 0 && itemStyles.divider}
						contentStyle={itemStyles.pressRow}
					>
						<View style={[styles.logoContainer, provider === 'kakao' && styles.logoContainerKakao]}>
							<ProviderLogo provider={provider} size={provider === 'kakao' ? 14 : 22} />
						</View>

						<Copy style={[itemStyles.label, styles.label]}>{t(`auth.continue.${provider}`)}</Copy>

						{loadingProvider === provider ? (
							<ActivityIndicator color={colors.orange} />
						) : (
							<ChevronRightIcon size={18} color={colors.subtle} />
						)}
					</PressableSurface>
				))}
			</ItemGroup>
		);
	}

	return (
		<View style={styles.buttonContainer}>
			{providers.map((provider) => (
				<View key={provider} style={provider === 'apple' && styles.appleButton}>
					{lastLoginProvider === provider && <LastLoginTag label={t('auth.lastLogin')} />}

					{provider === 'apple' ? (
						<>
							<AppleAuthentication.AppleAuthenticationButton
								buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
								buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
								cornerRadius={radius.control}
								style={styles.appleButton}
								accessibilityLabel={t(
									loadingProvider === 'apple' ? 'auth.signingIn.apple' : 'auth.continue.apple',
								)}
								accessibilityHint={lastLoginProvider === 'apple' ? lastLoginHint : undefined}
								accessibilityState={{ disabled, busy: loadingProvider === 'apple' }}
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
						</>
					) : (
						<OAuthButton
							provider={provider}
							loading={loadingProvider === provider}
							disabled={disabled}
							hint={lastLoginProvider === provider ? lastLoginHint : undefined}
							onPress={() => onSignIn(provider)}
						/>
					)}
				</View>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	buttonContainer: { gap: 12 },
	appleButton: { width: '100%', height: 56 },
	appleProgress: {
		...StyleSheet.absoluteFill,
		backgroundColor: loginProviderColors.apple.background,
		borderRadius: radius.control,
		borderCurve: 'continuous',
	},
	logoContainer: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
	logoContainerKakao: { borderRadius: 6, backgroundColor: loginProviderColors.kakao.background },
	label: { flex: 1, minWidth: 0 },
});

export default SocialLoginList;
