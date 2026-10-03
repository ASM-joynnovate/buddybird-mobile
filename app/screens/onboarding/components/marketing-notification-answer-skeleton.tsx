import { StyleSheet, View } from 'react-native';

import { colors, depths, radius } from '@/theme';

import { ui } from '@/components/ui/styles';

/** 마케팅 알림 동의 버튼을 불러오는 동안 보이는 컴포넌트 */
const MarketingNotificationAnswerSkeleton = () => {
	return (
		<View style={ui.actionsRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			<View style={[ui.action, styles.buttonBlock]} />
			<View style={[ui.action, styles.buttonBlock]} />
		</View>
	);
};

const styles = StyleSheet.create({
	buttonBlock: {
		height: 52,
		marginTop: depths.medium,
		borderRadius: radius.control,
		borderCurve: 'continuous',
		backgroundColor: colors.surface,
	},
});

export default MarketingNotificationAnswerSkeleton;
