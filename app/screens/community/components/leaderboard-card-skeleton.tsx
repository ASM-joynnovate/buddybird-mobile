import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { formatMonth } from '@/i18n/format';

import dayjs from 'dayjs';

import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

const PLACEHOLDER_STEPS = [
	{ place: 2, photoSize: 38, frontHeight: 58 },
	{ place: 1, photoSize: 46, frontHeight: 70 },
	{ place: 3, photoSize: 38, frontHeight: 50 },
] as const;

/** 순위 카드를 불러오는 동안 표시하는 컴포넌트 */
const LeaderboardCardSkeleton = () => {
	const { t } = useTranslation();

	return (
		<View style={styles.card} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			<View style={styles.titleRow}>
				<Copy style={styles.title}>
					{t('community.leaderboard.title', { month: formatMonth(dayjs.utc()) })}
				</Copy>
				<Copy style={styles.viewAllLabel}>{t('community.leaderboard.viewAll')}</Copy>
			</View>

			{/*시상대 자리*/}
			<View>
				<View style={styles.stepContainer}>
					{PLACEHOLDER_STEPS.map((step) => (
						<View key={step.place} style={styles.step}>
							<View
								style={[styles.block, styles.photo, { width: step.photoSize, height: step.photoSize }]}
							/>
							<View style={[styles.block, styles.namePill]} />
							<View style={[styles.front, { height: step.frontHeight }]} />
						</View>
					))}
				</View>
				<View style={styles.floor} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		gap: 16,
		padding: 16,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.card,
		borderCurve: 'continuous',
	},
	titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
	title: { flex: 1, minWidth: 0, fontFamily: font.black, fontSize: 17, lineHeight: 22 },
	viewAllLabel: { fontFamily: font.extraBold, fontSize: 14, color: colors.orangeDark },
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	stepContainer: { flexDirection: 'row', alignItems: 'flex-end' },
	step: { flex: 1, alignItems: 'center' },
	photo: { borderRadius: radius.tile },
	namePill: { width: '60%', height: 20, marginTop: 6, borderRadius: radius.pill },
	front: { width: '100%', marginTop: 18, backgroundColor: colors.surface },
	floor: { height: 2, marginHorizontal: -16, backgroundColor: colors.border },
});

export default LeaderboardCardSkeleton;
