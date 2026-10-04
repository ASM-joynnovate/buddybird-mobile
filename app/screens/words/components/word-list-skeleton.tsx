import { StyleSheet, View } from 'react-native';

import { TrashIcon } from 'lucide-react-native';

import { colors, depths, radius } from '@/theme';

const PLACEHOLDER_CARD_COUNT = 6;

/** 단어 목록을 불러오는 동안 보이는 컴포넌트 */
const WordListSkeleton = () => {
	return (
		<View style={styles.container} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			{Array.from({ length: PLACEHOLDER_CARD_COUNT }, (_, index) => (
				<View key={index} style={styles.card}>
					<View style={[styles.block, styles.nameBlock]} />

					{/*삭제 버튼과 재생 버튼 자리*/}
					<View style={styles.actionsRow}>
						<View style={styles.deleteButton}>
							<TrashIcon size={20} color={colors.muted} />
						</View>
						<View style={[styles.block, styles.playBlock]} />
					</View>
				</View>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, overflow: 'hidden', gap: 12, paddingTop: 8 },
	card: {
		minHeight: 84 + depths.low,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingLeft: 16,
		paddingRight: 14,
		borderWidth: 2,
		borderBottomWidth: 2 + depths.low,
		borderColor: colors.border,
		borderRadius: radius.card,
		borderCurve: 'continuous',
	},
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	nameBlock: { width: 88, height: 18 },
	actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
	deleteButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
	playBlock: { width: 44, height: 44, borderRadius: radius.pill },
});

export default WordListSkeleton;
