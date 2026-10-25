import { StyleSheet } from 'react-native';

import type { FeedItem } from '@/types/apis/feed';

import { useLikeFeedItem, useUnlikeFeedItem } from '@/hooks/apis/feed';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { toast } from 'sonner-native';

import FeedCardLikeButtonCount from '@/screens/community/components/feed-card/like-button/count';
import FeedCardLikeButtonSeed from '@/screens/community/components/feed-card/like-button/seed';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { joinLabel } from '@/utils/a11y';

import { PressableSurface } from '@/components/ui/surface/pressable-surface';
import { Toast } from '@/components/ui/toast';

interface Props {
	feedItem: FeedItem;
}

/**
 * 좋아요 버튼 및 좋아요 수 컴포넌트
 * @param feedItem 피드 항목
 */
const FeedCardLikeButton = ({ feedItem }: Props) => {
	const { t } = useTranslation();

	const likeFeedItem = useLikeFeedItem();
	const unlikeFeedItem = useUnlikeFeedItem();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const likePending = likeFeedItem.isPending || unlikeFeedItem.isPending;
	const likeCountText = feedItem.like_count.toLocaleString(locale);

	const handleToggleLike = () => {
		if (likePending) {
			return;
		}

		/** 좋아요 실패 Toast 표시 함수 */
		const showLikeErrorToast = (error: unknown) => {
			toast.custom(<Toast variant="error" message={apiErrorMessage(error, t)} />);
		};

		if (feedItem.is_liked) {
			unlikeFeedItem.mutate({ id: feedItem.id }, { onError: showLikeErrorToast });
		} else {
			likeFeedItem.mutate({ id: feedItem.id }, { onError: showLikeErrorToast });
		}
	};

	return (
		<PressableSurface
			accessibilityLabel={joinLabel(t('community.feed.like'), likeCountText)}
			accessibilityState={{ selected: feedItem.is_liked, busy: likePending }}
			onPress={handleToggleLike}
			variant="neutral"
			depth="medium"
			cornerRadius="tile"
			contentStyle={styles.button}
		>
			<FeedCardLikeButtonSeed liked={feedItem.is_liked} />
			<FeedCardLikeButtonCount countText={likeCountText} liked={feedItem.is_liked} />
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	button: {
		minHeight: 40,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingLeft: 12,
		paddingRight: 14,
	},
});

export default FeedCardLikeButton;
