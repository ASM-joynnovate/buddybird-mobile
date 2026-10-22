import { useRef, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { FeedItem } from '@/types/apis/feed';

import { useTranslation } from 'react-i18next';

import { BanIcon, EllipsisIcon, FlagIcon, type LucideIcon } from 'lucide-react-native';

import { useCommunityStore } from '@/stores/community';
import { colors, font, radius } from '@/theme';

import { ArrowPopover, type PopoverAnchor } from '@/components/ui/arrow-popover';
import { Copy } from '@/components/ui/copy';
import { IconButton } from '@/components/ui/icon-button';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const MENU_WIDTH = 168;

interface MenuItemProps {
	icon: LucideIcon;
	label: string;
	danger?: boolean;
	first?: boolean;
	onPress: () => void;
}

/** 더보기 메뉴 항목 컴포넌트 */
const MenuItem = ({ icon: Icon, label, danger = false, first = false, onPress }: MenuItemProps) => {
	return (
		<PressableSurface
			accessibilityRole="menuitem"
			accessibilityLabel={label}
			onPress={onPress}
			variant="plain"
			depth="none"
			cornerRadius="small"
			style={!first && styles.divider}
			contentStyle={styles.menuItem}
		>
			<Icon size={17} color={danger ? colors.error : colors.muted} />
			<Copy style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Copy>
		</PressableSurface>
	);
};

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

	const setFeedItemToReport = useCommunityStore((state) => state.setFeedItemToReport);
	const setUserToBlock = useCommunityStore((state) => state.setUserToBlock);

	const handleOpenMenu = () => {
		buttonRef.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
	};

	const handleReport = () => {
		setAnchor(null);
		setFeedItemToReport(feedItem);
	};

	const handleBlock = () => {
		setAnchor(null);
		setUserToBlock(feedItem.user);
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
						<MenuItem first icon={FlagIcon} label={t('community.report.action')} onPress={handleReport} />
						<MenuItem danger icon={BanIcon} label={t('community.block.action')} onPress={handleBlock} />
					</View>
				</ArrowPopover>
			)}
		</>
	);
};

const styles = StyleSheet.create({
	moreButton: { alignSelf: 'flex-start', marginTop: -8, marginRight: -6 },
	menuContainer: { padding: 3 },
	menuItem: {
		minHeight: 40,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 10,
		borderWidth: 0,
		borderRadius: radius.small,
	},
	divider: { borderTopWidth: 2, borderTopColor: colors.surface },
	menuLabel: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 14 },
	menuLabelDanger: { color: colors.error },
});

export default FeedCardMoreMenu;
