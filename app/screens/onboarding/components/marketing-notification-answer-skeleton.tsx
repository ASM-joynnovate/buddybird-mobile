import { StyleSheet, View } from 'react-native';

import { colors, depths, radius } from '@/theme';

import { ui } from '@/components/ui/styles';

/** 마케팅 알림 동의 버튼을 불러오는 동안 보이는 컴포넌트 */
const MarketingNotificationAnswerSkeleton = () => {
	return (
		<View style={styles.container} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			<View style={styles.checkboxBlock} />

			<View style={ui.actionsRow}>
				<View style={[ui.action, styles.buttonBlock]} />
				<View style={[ui.action, styles.buttonBlock]} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { gap: 12 },
	checkboxBlock: {
		height: 56,
		borderRadius: radius.card,
		borderCurve: 'continuous',
		backgroundColor: colors.surface,
	},
	buttonBlock: {
		height: 52,
		marginTop: depths.medium,
		borderRadius: radius.control,
		borderCurve: 'continuous',
		backgroundColor: colors.surface,
	},
});

export default MarketingNotificationAnswerSkeleton;
