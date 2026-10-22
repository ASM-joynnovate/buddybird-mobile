import type { RefObject } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { BlurView } from 'expo-blur';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import CommunityGateLoginForm from '@/screens/community/components/community-gate/login-form';
import CommunityGateNicknameForm from '@/screens/community/components/community-gate/nickname-form';
import { useAccountStore } from '@/stores/account';
import { colors, contentMaxWidth, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

const BLUR_INTENSITY = 20;

interface Props {
	blurTarget: RefObject<View | null>;
}

/**
 * 커뮤니티 입장 팝업 컴포넌트
 * @param blurTarget Android에서 흐리게 할 화면
 */
const CommunityGate = ({ blurTarget }: Props) => {
	const { t } = useTranslation();

	const isAnonymous = useAccountStore((state) => state.isAnonymous);

	return (
		<View style={StyleSheet.absoluteFill}>
			<BlurView
				intensity={BLUR_INTENSITY}
				tint="light"
				blurTarget={blurTarget}
				blurMethod="dimezisBlurViewSdk31Plus"
				style={StyleSheet.absoluteFill}
			/>
			<View style={[StyleSheet.absoluteFill, styles.scrim]} />

			<KeyboardAvoidingView behavior="padding" style={styles.keyboardContainer}>
				<View accessibilityViewIsModal style={styles.gateCard}>
					<View style={styles.titleContainer}>
						<Copy accessibilityRole="header" style={styles.title}>
							{t(isAnonymous ? 'community.gate.loginTitle' : 'community.gate.nicknameTitle')}
						</Copy>
						<Copy style={styles.description}>
							{t(isAnonymous ? 'community.gate.loginDescription' : 'community.gate.nicknameDescription')}
						</Copy>
					</View>

					<View style={styles.formContainer}>
						{isAnonymous ? <CommunityGateLoginForm /> : <CommunityGateNicknameForm />}
					</View>
				</View>
			</KeyboardAvoidingView>
		</View>
	);
};

const styles = StyleSheet.create({
	scrim: { backgroundColor: colors.backdrop },
	keyboardContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, paddingBottom: '8%' },
	gateCard: {
		width: '100%',
		maxWidth: contentMaxWidth,
		alignSelf: 'center',
		overflow: 'hidden',
		borderRadius: radius.card,
		borderCurve: 'continuous',
		backgroundColor: colors.background,
	},
	titleContainer: {
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 16,
		borderBottomWidth: 2,
		borderBottomColor: colors.border,
	},
	title: { fontFamily: font.black, fontSize: 16, lineHeight: 22 },
	description: { marginTop: 4, fontFamily: font.bold, fontSize: 14, lineHeight: 20, color: colors.muted },
	formContainer: { gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
});

export default CommunityGate;
