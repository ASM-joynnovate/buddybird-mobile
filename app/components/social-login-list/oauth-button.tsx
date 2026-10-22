import { ActivityIndicator, StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import { font, loginProviderColors } from '@/theme';

import ProviderLogo from '@/components/social-login-list/provider-logo';
import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	provider: 'google' | 'kakao';
	loading: boolean;
	disabled: boolean;
	hint?: string;
	onPress: () => void;
}

/**
 * 소셜 로그인 버튼 컴포넌트
 * @param provider 로그인 방식
 * @param loading 로그인 진행 여부
 * @param disabled 비활성화 여부
 * @param hint 스크린 리더가 읽을 도움말
 * @param onPress 버튼을 누를 때 실행할 함수
 */
const OAuthButton = ({ provider, loading, disabled, hint, onPress }: Props) => {
	const { t } = useTranslation();

	const isGoogle = provider === 'google';

	return (
		<PressableSurface
			accessibilityLabel={loading ? t(`auth.signingIn.${provider}`) : t(`auth.continue.${provider}`)}
			accessibilityHint={hint}
			accessibilityState={{ busy: loading }}
			disabled={disabled || loading}
			onPress={onPress}
			depth="none"
			cornerRadius="control"
			faceColor={isGoogle ? loginProviderColors.google.background : loginProviderColors.kakao.background}
			edgeColor={isGoogle ? loginProviderColors.google.border : loginProviderColors.kakao.background}
			contentStyle={styles.button}
		>
			<ProviderLogo provider={provider} size={20} hidden={loading} />

			<Copy style={[styles.label, isGoogle ? styles.googleLabel : styles.kakaoLabel, loading && styles.hidden]}>
				{t(`auth.continue.${provider}`)}
			</Copy>

			{loading && (
				<ActivityIndicator
					color={isGoogle ? loginProviderColors.google.text : loginProviderColors.kakao.icon}
					style={StyleSheet.absoluteFill}
					pointerEvents="none"
					accessible={false}
				/>
			)}
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	button: {
		minHeight: 56,
		borderWidth: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 16,
	},
	label: {
		fontFamily: font.bold,
		fontSize: 16,
		lineHeight: 22,
		flexShrink: 1,
		textAlign: 'center',
	},
	googleLabel: { color: loginProviderColors.google.text },
	kakaoLabel: { color: loginProviderColors.kakao.text },
	hidden: { opacity: 0 },
});

export default OAuthButton;
