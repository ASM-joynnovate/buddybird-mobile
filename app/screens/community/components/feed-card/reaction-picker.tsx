import { useRef, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import type { FeedItem, FeedReactionType } from '@/types/apis/feed';

import { useAddFeedReaction, useDeleteFeedReaction, useGetFeedReactionTypeList } from '@/hooks/apis/feed';

import { useTranslation } from 'react-i18next';

import { apiErrorMessage } from '@/lib/api';

import { PartyPopperIcon } from 'lucide-react-native';

import FeedCardReactionImage from '@/screens/community/components/feed-card/reaction-image';
import { useMessageStore } from '@/stores/message';
import { colors, font } from '@/theme';

import { ArrowPopover, type PopoverAnchor } from '@/components/ui/arrow-popover';
import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const POPOVER_WIDTH = 312;

export type ReactionVerb = 'praise' | 'celebrate';

const reactionButtonLabelKeys = {
	praise: { action: 'community.feed.reaction.praise', done: 'community.feed.reaction.praised' },
	celebrate: { action: 'community.feed.reaction.celebrate', done: 'community.feed.reaction.celebrated' },
} as const;

interface Props {
	feedItem: FeedItem;
	reactionVerb: ReactionVerb;
}

/**
 * 반응 버튼 및 반응 선택 팝오버 컴포넌트
 * @param feedItem 피드 항목
 * @param reactionVerb 칭찬 또는 축하
 */
const FeedCardReactionPicker = ({ feedItem, reactionVerb }: Props) => {
	const { t } = useTranslation();

	const buttonRef = useRef<View>(null);

	const [anchor, setAnchor] = useState<PopoverAnchor | null>(null);

	const { data: reactionTypesData } = useGetFeedReactionTypeList();

	const addFeedReaction = useAddFeedReaction();
	const deleteFeedReaction = useDeleteFeedReaction();

	const openPopup = useMessageStore((state) => state.openPopup);

	const reactionPending = addFeedReaction.isPending || deleteFeedReaction.isPending;
	const myReactionTypes = reactionTypesData.filter((reactionType) =>
		feedItem.reactions.some((reaction) => reaction.reaction_type_id === reactionType.id && reaction.is_mine),
	);
	const reactionSelected = myReactionTypes.length > 0;
	const buttonLabel = t(
		reactionSelected ? reactionButtonLabelKeys[reactionVerb].done : reactionButtonLabelKeys[reactionVerb].action,
	);

	const handleOpenPopover = () => {
		buttonRef.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
	};

	const handleToggleReaction = (reactionType: FeedReactionType) => {
		if (reactionPending) {
			return;
		}

		const handleError = (error: unknown) => openPopup({ title: apiErrorMessage(error, t) });

		if (myReactionTypes.includes(reactionType)) {
			deleteFeedReaction.mutate({ id: feedItem.id, reactionTypeId: reactionType.id }, { onError: handleError });
		} else {
			addFeedReaction.mutate({ id: feedItem.id, reactionTypeId: reactionType.id }, { onError: handleError });
		}
	};

	return (
		<>
			<View ref={buttonRef} collapsable={false}>
				<PressableSurface
					accessibilityLabel={buttonLabel}
					accessibilityState={{ expanded: anchor !== null }}
					onPress={handleOpenPopover}
					variant="neutral"
					depth="medium"
					cornerRadius="tile"
					edgeColor={anchor ? colors.orangeDark : undefined}
					contentStyle={styles.reactionButton}
				>
					{reactionSelected ? (
						<View style={styles.selectedImageRow}>
							{myReactionTypes.map((reactionType, index) => (
								<View key={reactionType.id} style={index > 0 && styles.imageOverlapped}>
									<FeedCardReactionImage url={reactionType.image_file.url} size={20} />
								</View>
							))}
						</View>
					) : (
						<PartyPopperIcon size={18} color={colors.orange} />
					)}
					<Copy style={[styles.reactionLabel, reactionSelected && styles.reactionLabelSelected]}>
						{buttonLabel}
					</Copy>
				</PressableSurface>
			</View>

			{anchor && (
				<ArrowPopover anchor={anchor} align="end" width={POPOVER_WIDTH} onClose={() => setAnchor(null)}>
					<View style={styles.reactionTypeContainer}>
						{reactionTypesData.map((reactionType) => {
							const reactionTypeSelected = myReactionTypes.includes(reactionType);

							return (
								<PressableSurface
									key={reactionType.id}
									accessibilityRole="checkbox"
									accessibilityLabel={reactionType.name}
									accessibilityState={{ checked: reactionTypeSelected }}
									disabled={reactionPending}
									onPress={() => handleToggleReaction(reactionType)}
									variant={reactionTypeSelected ? 'primary' : 'neutral'}
									depth="low"
									cornerRadius="tile"
									style={styles.reactionTypeButton}
									contentStyle={styles.reactionTypeContent}
								>
									<View style={reactionTypeSelected && styles.reactionTypeImageSelected}>
										<FeedCardReactionImage
											url={reactionType.image_file.url}
											size={reactionTypeSelected ? 20 : 24}
										/>
									</View>
									<Copy
										numberOfLines={2}
										style={[
											styles.reactionTypeName,
											reactionTypeSelected && styles.reactionTypeNameSelected,
										]}
									>
										{reactionType.name}
									</Copy>
								</PressableSurface>
							);
						})}
					</View>
				</ArrowPopover>
			)}
		</>
	);
};

const styles = StyleSheet.create({
	reactionButton: {
		minHeight: 40,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingLeft: 12,
		paddingRight: 14,
	},
	selectedImageRow: { flexDirection: 'row' },
	imageOverlapped: { marginLeft: -5 },
	reactionLabel: { fontFamily: font.extraBold, fontSize: 14 },
	reactionLabelSelected: { color: colors.orangeDark },
	reactionTypeContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 6,
		paddingTop: 8,
		paddingHorizontal: 8,
		paddingBottom: 5,
	},
	reactionTypeButton: { flexGrow: 1, flexBasis: '45%' },
	reactionTypeContent: {
		minHeight: 46,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingVertical: 6,
		paddingLeft: 8,
		paddingRight: 10,
	},
	reactionTypeImageSelected: { padding: 2, borderRadius: 12, backgroundColor: colors.background },
	reactionTypeName: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 13, lineHeight: 16, color: colors.muted },
	reactionTypeNameSelected: { color: colors.onFilled },
});

export default FeedCardReactionPicker;
