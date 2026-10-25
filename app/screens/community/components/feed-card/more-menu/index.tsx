import { useRef, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { FeedItem } from '@/types/apis/feed';

import type { PopoverAnchor } from '@/types/community';

import { useTranslation } from 'react-i18next';

import { BanIcon, EllipsisIcon, FlagIcon } from 'lucide-react-native';

import { ArrowPopover } from '@/screens/community/components/arrow-popover';
import FeedCardMoreMenuItem from '@/screens/community/components/feed-card/more-menu/item';
import { useCommunityStore } from '@/stores/community';

import { IconButton } from '@/components/ui/icon-button';

const MENU_WIDTH = 168;

interface Props {
	feedItem: FeedItem;
}

/**
 * 피드 항목 더보기 메뉴 컴포넌트
 * @param feedItem 피드 항목
 */
const FeedCardMoreMenu = ({ feedItem }: Props) => {
	const { t } = useTranslation();

	const buttonRef = useRef<View>(null);

	const [anchor, setAnchor] = useState<PopoverAnchor | null>(null);

	const setReportTarget = useCommunityStore((state) => state.setReportTarget);
	const setBlockTarget = useCommunityStore((state) => state.setBlockTarget);

	const handleOpenMenu = () => {
		buttonRef.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
	};

	const handleReport = () => {
		setAnchor(null);
		setReportTarget({ feedItemId: feedItem.id, userId: feedItem.user.id });
	};

	const handleBlock = () => {
		setAnchor(null);
		setBlockTarget({ userId: feedItem.user.id, nickname: feedItem.user.nickname });
	};

	return (
		<>
			<View ref={buttonRef} collapsable={false} style={styles.moreButton}>
				<IconButton
					icon={EllipsisIcon}
					label={t('community.feed.more')}
					variant="muted"
					size="compact"
					onPress={handleOpenMenu}
				/>
			</View>

			{anchor && (
				<ArrowPopover anchor={anchor} align="end" width={MENU_WIDTH} onClose={() => setAnchor(null)}>
					<View accessibilityRole="menu" style={styles.menuContainer}>
						<FeedCardMoreMenuItem
							isFirstInGroup
							icon={FlagIcon}
							label={t('community.report.action')}
							onPress={handleReport}
						/>
						<FeedCardMoreMenuItem
							actionDestructive
							icon={BanIcon}
							label={t('community.block.action')}
							onPress={handleBlock}
						/>
					</View>
				</ArrowPopover>
			)}
		</>
	);
};

const styles = StyleSheet.create({
	moreButton: { alignSelf: 'flex-start', marginTop: -8, marginRight: -6 },
	menuContainer: { padding: 3 },
});

export default FeedCardMoreMenu;
