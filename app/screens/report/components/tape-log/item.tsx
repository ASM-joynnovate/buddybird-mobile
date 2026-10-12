import { memo } from 'react';

import { StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { getSessionSoundDurationOptions } from '@/hooks/apis/sessions';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import { PauseIcon, PlayIcon, ShareIcon } from 'lucide-react-native';
import Animated, {
	type SharedValue,
	useAnimatedReaction,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';

import { SECOND } from '@/config/units';
import { burstEasing } from '@/screens/report/components/session-detail-animations';
import { soundKindColors } from '@/screens/report/components/sound-kind-colors';
import { colors, font, radius } from '@/theme';
import { joinLabel } from '@/utils/a11y';
import type { TapeItem } from '@/utils/tape-log';

import { Copy } from '@/components/ui/copy';
import { IconButton } from '@/components/ui/icon-button';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const CARD_PADDING_TOP = 10;
const CARD_PADDING_HORIZONTAL = 12;
const PLAY_SIZE = 32;
const SHARE_SIZE = 36;
const ACTION_GAP = 4;
const RISE_DISTANCE = 8;
const RISE_MS = 320;
const RISE_DELAY_MS = 100;
const RISE_STAGGER_MS = 45;
const RISE_STAGGER_LIMIT = 6;
const PERCENT = 100;

interface Props {
	item: TapeItem;
	order: number;
	selected: boolean;
	playing: boolean;
	durationQueryEnabled: boolean;
	judgmentPending: boolean;
	wordName: string;
	rowRevealed: SharedValue<boolean>;
	onPress: (item: TapeItem) => void;
	onShare: (item: TapeItem) => void;
}

/**
 * 기록의 소리 카드 컴포넌트
 * @param item 카드에 담긴 소리
 * @param order 행 안에서의 순서
 * @param selected 선택한 카드인지 여부
 * @param playing 재생 중 여부
 * @param durationQueryEnabled 재생 길이를 조회할지 여부
 * @param judgmentPending 세션을 분석하는 중인지 여부
 * @param wordName 세션에서 학습한 단어
 * @param rowRevealed 행이 화면에 나타났는지 여부
 * @param onPress 누르면 실행할 함수
 * @param onShare 공유 버튼을 누르면 실행할 함수
 */
const TapeLogItem = memo(
	({
		item,
		order,
		selected,
		playing,
		durationQueryEnabled,
		judgmentPending,
		wordName,
		rowRevealed,
		onPress,
		onShare,
	}: Props) => {
		const { t } = useTranslation();

		const reducedMotion = useReducedMotion();

		const { data: soundDurationData } = useQuery({
			...getSessionSoundDurationOptions({ id: item.id, url: item.sounds.at(0)?.audio_file.url ?? '' }),
			enabled: durationQueryEnabled && item.kind !== 'emergency' && item.durationMs === null,
			throwOnError: false,
		});

		const rise = useSharedValue(reducedMotion ? 1 : 0);

		const palette = soundKindColors[item.kind];
		const kindName = t(`report.detail.kinds.${item.kind}`);
		const time = dayjs(item.startedAt).format('LT');
		const itemName = joinLabel(kindName, time);
		const shareShown = item.kind !== 'emergency';
		const durationMs = item.durationMs ?? soundDurationData ?? null;
		const durationText =
			durationMs === null ? null : t('common.duration.seconds', { value: (durationMs / SECOND).toFixed(1) });
		const percent = item.score === null ? null : Math.round(item.score * PERCENT);
		const percentText = percent === null ? null : t('report.detail.percent', { value: percent });
		const scorePending = judgmentPending && percent === null && item.kind !== 'emergency';
		const scoreRowShown = percent !== null || scorePending;
		const scoreKindLabel =
			item.kind === 'mimic'
				? t('report.detail.scores.mimic', { word: wordName })
				: t('report.detail.scores.parrot');
		const scoreLabel = scorePending ? t('report.judging') : scoreKindLabel;
		const PlayStateIcon = playing ? PauseIcon : PlayIcon;
		const riseStyle = useAnimatedStyle(() => ({
			opacity: rise.get(),
			transform: [{ translateY: (1 - rise.get()) * RISE_DISTANCE }],
		}));

		/** 행이 화면에 나타나면 순서대로 떠오름 */
		useAnimatedReaction(
			() => rowRevealed.get(),
			(shown, previouslyShown) => {
				if (!shown || previouslyShown || reducedMotion) {
					return;
				}

				rise.set(
					withDelay(
						Math.min(order, RISE_STAGGER_LIMIT) * RISE_STAGGER_MS + RISE_DELAY_MS,
						withTiming(1, { duration: RISE_MS, easing: burstEasing }),
					),
				);
			},
		);

		return (
			<Animated.View style={riseStyle}>
				<PressableSurface
					accessibilityLabel={joinLabel(itemName, durationText, scoreRowShown && scoreLabel, percentText)}
					accessibilityState={{ selected }}
					onPress={() => onPress(item)}
					depth="none"
					cornerRadius="control"
					faceColor={palette.face}
					edgeColor={palette.face}
					contentStyle={[styles.card, !scoreRowShown && styles.cardWithoutScore]}
				>
					<View style={styles.top}>
						<View style={[styles.titles, shareShown && styles.titlesBesideShare]}>
							<Copy numberOfLines={1} style={[styles.duration, { color: palette.text }]}>
								{durationText ?? time}
							</Copy>
							{item.kind === 'emergency' && (
								<Copy numberOfLines={1} style={[styles.kind, { color: palette.subText }]}>
									{kindName}
								</Copy>
							)}
						</View>

						<View style={[styles.play, { backgroundColor: palette.playFace }]}>
							<PlayStateIcon size={13} color={palette.playIcon} fill={palette.playIcon} />
						</View>
					</View>

					{scoreRowShown && (
						<>
							<View style={styles.score}>
								<Copy numberOfLines={1} style={[styles.scoreLabel, { color: palette.subText }]}>
									{scoreLabel}
								</Copy>
								{percentText !== null && (
									<Copy style={[styles.scoreValue, { color: palette.subText }]}>{percentText}</Copy>
								)}
							</View>

							<View style={[styles.scoreTrack, { backgroundColor: palette.scoreTrack }]}>
								{percent !== null && (
									<View
										style={[
											styles.scoreFill,
											{ width: `${percent}%`, backgroundColor: palette.scoreFill },
										]}
									/>
								)}
							</View>
						</>
					)}
				</PressableSurface>

				{shareShown && (
					<View style={styles.share}>
						<IconButton
							icon={ShareIcon}
							iconProps={{ size: 17, strokeWidth: 2.5, color: palette.subText }}
							label={t('report.detail.share', { name: itemName })}
							size="compact"
							onPress={() => onShare(item)}
						/>
					</View>
				)}

				{selected && <View pointerEvents="none" style={styles.selectedRing} />}
			</Animated.View>
		);
	},
);

const styles = StyleSheet.create({
	card: {
		paddingTop: CARD_PADDING_TOP,
		paddingHorizontal: CARD_PADDING_HORIZONTAL,
		paddingBottom: 12,
		borderWidth: 0,
	},
	cardWithoutScore: { paddingBottom: CARD_PADDING_TOP },
	top: { flexDirection: 'row', alignItems: 'center', gap: ACTION_GAP },
	titles: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
	titlesBesideShare: { marginRight: SHARE_SIZE + ACTION_GAP },
	duration: { fontFamily: font.black, fontSize: 16, lineHeight: 22, fontVariant: ['tabular-nums'] },
	kind: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 13, lineHeight: 18 },
	play: {
		width: PLAY_SIZE,
		height: PLAY_SIZE,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: radius.pill,
	},
	score: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 6 },
	scoreLabel: { flexShrink: 1, minWidth: 0, fontFamily: font.extraBold, fontSize: 12, lineHeight: 16 },
	scoreValue: { fontFamily: font.extraBold, fontSize: 12, lineHeight: 16, fontVariant: ['tabular-nums'] },
	scoreTrack: { height: 6, marginTop: 4, overflow: 'hidden', borderRadius: 3 },
	scoreFill: { height: '100%', borderRadius: 3 },
	share: {
		position: 'absolute',
		top: CARD_PADDING_TOP + (PLAY_SIZE - SHARE_SIZE) / 2,
		right: CARD_PADDING_HORIZONTAL + PLAY_SIZE + ACTION_GAP,
	},
	selectedRing: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		borderWidth: 3,
		borderColor: colors.text,
		borderRadius: radius.control,
		borderCurve: 'continuous',
	},
});

export default TapeLogItem;
