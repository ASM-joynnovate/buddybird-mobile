import { StyleSheet, View } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';

import { getMeOptions } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import LeaderboardCardSkeleton from '@/screens/community/components/leaderboard-card-skeleton';
import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

const PLACEHOLDER_CARD_COUNT = 3;

/** 피드를 불러오는 동안 표시하는 컴포넌트 */
const CommunityFeedSkeleton = () => {
	const { t } = useTranslation();

	const queryClient = useQueryClient();

	const countryScopeLabels = [
		t('community.countryScope.world'),
		...(queryClient.getQueryData(getMeOptions().queryKey)?.country ? [t('community.countryScope.mine')] : []),
	];

	return (
		<View style={styles.container} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
			<View>
				<LeaderboardCardSkeleton />
				<View style={styles.divider} />
				{/*국가 토글 자리*/}
				<View style={styles.toggle}>
					{countryScopeLabels.map((label) => (
						<View key={label} style={styles.toggleOption}>
							<View style={styles.toggleIcon} />
							<Copy style={styles.toggleLabel}>{label}</Copy>
						</View>
					))}
				</View>
			</View>

			{Array.from({ length: PLACEHOLDER_CARD_COUNT }, (_, index) => (
				<View key={index} style={styles.card}>
					<View style={styles.authorRow}>
						<View style={[styles.block, styles.avatar]} />
						<View style={styles.authorText}>
							<View style={[styles.block, styles.nicknameBlock]} />
							<View style={[styles.block, styles.timeBlock]} />
						</View>
					</View>

					<View style={[styles.block, styles.body]} />
					<View style={[styles.block, styles.likeBlock]} />
				</View>
			))}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1, overflow: 'hidden', gap: 12, paddingHorizontal: 16, paddingTop: 16 },
	divider: { height: 2, marginTop: 20, marginBottom: 8, marginHorizontal: -16, backgroundColor: colors.border },
	block: { borderRadius: radius.small, backgroundColor: colors.surface },
	toggle: {
		flexDirection: 'row',
		alignSelf: 'flex-start',
		padding: 3,
		borderRadius: radius.pill,
		backgroundColor: colors.surface,
	},
	toggleOption: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 },
	toggleIcon: { width: 16, height: 16 },
	toggleLabel: { fontFamily: font.extraBold, fontSize: 13, color: colors.backgroundTransparent },
	card: {
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 14,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.card,
		borderCurve: 'continuous',
	},
	authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	avatar: { width: 40, height: 40, borderRadius: radius.pill },
	authorText: { gap: 6 },
	nicknameBlock: { width: 96, height: 15 },
	timeBlock: { width: 48, height: 13 },
	body: { height: 96, marginTop: 14, borderRadius: radius.control },
	likeBlock: { width: 64, height: 40, marginTop: 14, borderRadius: radius.pill },
});

export default CommunityFeedSkeleton;
