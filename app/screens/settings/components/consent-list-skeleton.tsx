import { StyleSheet, View } from 'react-native';

import { ChevronRightIcon } from 'lucide-react-native';

import { colors, depths, radius } from '@/theme';

import { ItemGroup } from '@/components/ui/item/group';
import { itemStyles } from '@/components/ui/item/styles';

const PLACEHOLDER_ROW_COUNT = 3;

/** 약관 동의 목록을 불러오는 동안 보이는 컴포넌트 */
const ConsentListSkeleton = () => {
	return (
		<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			<ItemGroup>
				{Array.from({ length: PLACEHOLDER_ROW_COUNT }, (_, index) => (
					<View key={index} style={[itemStyles.pressRow, styles.row, index > 0 && itemStyles.divider]}>
						<View style={[itemStyles.textContainer, styles.textContainer]}>
							<View style={[styles.block, styles.captionBlock]} />
							<View style={[styles.block, styles.titleBlock]} />
						</View>
						<View style={styles.detailButton}>
							<ChevronRightIcon size={15} color={colors.muted} />
						</View>
						<View style={styles.checkbox} />
					</View>
				))}
			</ItemGroup>
		</View>
	);
};

const styles = StyleSheet.create({
	row: { minHeight: 60 },
	textContainer: { gap: 6 },
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	captionBlock: { width: 28, height: 12 },
	titleBlock: { width: 150, height: 16 },
	detailButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
	checkbox: {
		width: 26,
		height: 26 + depths.medium,
		borderWidth: 2,
		borderBottomWidth: 2 + depths.medium,
		borderColor: colors.border,
		borderRadius: radius.small,
	},
});

export default ConsentListSkeleton;
