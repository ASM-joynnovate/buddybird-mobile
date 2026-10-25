import type { ComponentType } from 'react';

import { StyleSheet, View } from 'react-native';

import type { FeedItem } from '@/types/apis/feed';

import type { SoundPlayer } from '@/types/sound-player';

import { useGetMe } from '@/hooks/apis/users';

import { useTranslation } from 'react-i18next';

import { formatTimeAgo } from '@/i18n/format';

import FeedCardLikeButton from '@/screens/community/components/feed-card/like-button';
import FeedCardMimicBody from '@/screens/community/components/feed-card/mimic-body';
import FeedCardMonthlyLearningTimeBody from '@/screens/community/components/feed-card/monthly-learning-time-body';
import FeedCardMoreMenu from '@/screens/community/components/feed-card/more-menu';
import FeedCardTotalLearningTimeBody from '@/screens/community/components/feed-card/total-learning-time-body';
import FeedCardWordPlayCountBody from '@/screens/community/components/feed-card/word-play-count-body';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font, radius } from '@/theme';

import MascotArtwork from '@/components/mascot/artwork';
import { Avatar } from '@/components/ui/avatar';
import { Copy } from '@/components/ui/copy';
import { Flag } from '@/components/ui/flag';

interface Props {
	feedItem: FeedItem;
	player: SoundPlayer;
}

export const feedCardKinds: Record<string, ComponentType<Props>> = {
	mimic_succeeded: FeedCardMimicBody,
	total_learning_time_reached: FeedCardTotalLearningTimeBody,
	monthly_learning_time_reached: FeedCardMonthlyLearningTimeBody,
	word_play_count_reached: FeedCardWordPlayCountBody,
};

/**
 * 피드 항목 하나를 표시하는 카드 컴포넌트
 * @param feedItem 피드 항목
 * @param player useSoundPlayer 결과
 */
const FeedCard = ({ feedItem, player }: Props) => {
	const { t } = useTranslation();

	const { data: meData } = useGetMe();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const KindBody = feedCardKinds[feedItem.kind];
	const authorIsMe = feedItem.user.id === meData.id;

	return (
		<View style={styles.card}>
			<View style={styles.authorRow}>
				<Avatar uri={feedItem.user.photo_file?.url} placeholder=<MascotArtwork /> size="small" />

				<View style={styles.textContainer}>
					<View style={styles.nameRow}>
						<Copy numberOfLines={1} style={styles.nickname}>
							{feedItem.user.nickname}
						</Copy>
						<Flag country={feedItem.user.country} />
						{authorIsMe && <Copy style={styles.me}>{t('community.me')}</Copy>}
					</View>
					<Copy style={styles.time}>{formatTimeAgo(feedItem.created_at, locale)}</Copy>
				</View>

				{!authorIsMe && <FeedCardMoreMenu feedItem={feedItem} />}
			</View>

			<KindBody feedItem={feedItem} player={player} />

			<View style={styles.likeRow}>
				<FeedCardLikeButton feedItem={feedItem} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	card: {
		paddingHorizontal: 16,
		paddingTop: 16,
		paddingBottom: 14,
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: radius.card,
		borderCurve: 'continuous',
		backgroundColor: colors.background,
	},
	authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	textContainer: { flex: 1, minWidth: 0 },
	nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
	nickname: { flexShrink: 1, fontFamily: font.black, fontSize: 15, lineHeight: 20 },
	me: { fontFamily: font.extraBold, fontSize: 12, color: colors.orangeDark },
	time: { marginTop: 1, fontFamily: font.extraBold, fontSize: 13, lineHeight: 17, color: colors.subtle },
	likeRow: { flexDirection: 'row', marginTop: 14 },
});

export default FeedCard;
