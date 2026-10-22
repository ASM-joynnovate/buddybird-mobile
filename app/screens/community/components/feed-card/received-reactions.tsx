import { StyleSheet, View } from 'react-native';

import type { FeedItemReaction } from '@/types/apis/feed';

import { useGetFeedReactionTypeList } from '@/hooks/apis/feed';

import FeedCardReactionImage from '@/screens/community/components/feed-card/reaction-image';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

const SHOWN_REACTION_COUNT = 3;

interface Props {
	reactions: FeedItemReaction[];
}

/**
 * 받은 반응 그림 및 개수 컴포넌트
 * @param reactions 피드 항목이 받은 반응 목록
 */
const FeedCardReceivedReactions = ({ reactions }: Props) => {
	const { data: reactionTypesData } = useGetFeedReactionTypeList();

	const locale = useDeviceSettingsStore((state) => state.locale);

	if (reactions.length === 0) {
		return null;
	}

	const totalCount = reactions.reduce((sum, reaction) => sum + reaction.count, 0);
	const shownReactionTypes = reactionTypesData
		.filter((reactionType) => reactions.some((reaction) => reaction.reaction_type_id === reactionType.id))
		.slice(0, SHOWN_REACTION_COUNT);

	return (
		<View style={styles.container}>
			<View style={styles.imageRow}>
				{shownReactionTypes.map((reactionType, index) => (
					<View key={reactionType.id} style={[styles.imageCircle, index > 0 && styles.imageCircleOverlapped]}>
						<FeedCardReactionImage url={reactionType.image_file.url} size={16} />
					</View>
				))}
			</View>
			<Copy style={styles.count}>{totalCount.toLocaleString(locale)}</Copy>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	imageRow: { flexDirection: 'row' },
	imageCircle: {
		width: 30,
		height: 30,
		padding: 5,
		borderRadius: 15,
		borderWidth: 2,
		borderColor: colors.border,
		backgroundColor: colors.background,
	},
	imageCircleOverlapped: { marginLeft: -10 },
	count: { fontFamily: font.extraBold, fontSize: 14, color: colors.subtle, fontVariant: ['tabular-nums'] },
});

export default FeedCardReceivedReactions;
