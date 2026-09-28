import { ActivityIndicator, StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import Svg, { Path } from 'react-native-svg';

import { font, loginProviderColors } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	provider: 'google' | 'kakao';
	loading: boolean;
	disabled: boolean;
	hint?: string;
	onPress(): void;
}

export function OAuthButton({ provider, loading, disabled, hint, onPress }: Props) {
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
			{isGoogle ? (
				// Google's branding configurator supplies these paths.
				<Svg width={20} height={20} viewBox="0 0 48 48" accessible={false} opacity={loading ? 0 : 1}>
					<Path
						fill={loginProviderColors.google.logo.red}
						d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
					/>
					<Path
						fill={loginProviderColors.google.logo.blue}
						d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
					/>
					<Path
						fill={loginProviderColors.google.logo.yellow}
						d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
					/>
					<Path
						fill={loginProviderColors.google.logo.green}
						d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
					/>
				</Svg>
			) : (
				<Svg width={20} height={20} viewBox="0 0 18 18" accessible={false} opacity={loading ? 0 : 1}>
					<Path
						fill={loginProviderColors.kakao.icon}
						d="M9 1C4.029 1 0 4.129 0 7.987c0 2.399 1.558 4.516 3.932 5.774l-1 3.665c-.09.323.28.58.563.393L7.87 14.87c.37.041.747.063 1.13.063 4.971 0 9-3.129 9-6.987C18 4.129 13.971 1 9 1Z"
					/>
				</Svg>
			)}
			<Copy style={[styles.label, isGoogle ? styles.googleLabel : styles.kakaoLabel, loading && styles.hidden]}>
				{t(`auth.continue.${provider}`)}
			</Copy>
			{loading ? (
				<ActivityIndicator
					color={isGoogle ? loginProviderColors.google.text : loginProviderColors.kakao.icon}
					style={StyleSheet.absoluteFill}
					pointerEvents="none"
					accessible={false}
				/>
			) : null}
		</PressableSurface>
	);
}

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
