import { memo } from 'react';

import { StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from 'lucide-react-native';
import Animated, {
	Easing,
	interpolate,
	type SharedValue,
	useAnimatedStyle,
	useDerivedValue,
	useReducedMotion,
} from 'react-native-reanimated';

import {
	DECK_EDGE,
	DECK_KEY_EDGE,
	DECK_REEL_SIZE,
	type LayoutRect,
	type RecorderParts,
} from '@/screens/report/components/recorder';
import RecorderKey from '@/screens/report/components/recorder/key';
import RecorderKindLabel from '@/screens/report/components/recorder/kind-label';
import RecorderTimeLabel from '@/screens/report/components/recorder/time-label';
import RecorderWaveform from '@/screens/report/components/recorder/waveform';
import TapeReel from '@/screens/report/components/tape-reel';
import { colors, font } from '@/theme';
import type { TapeItem } from '@/utils/tape-log';

import { Copy } from '@/components/ui/copy';

const MINI_SIDE = 16;
const MINI_HEIGHT = 68;
const MINI_PADDING_TOP = 10;
const MINI_PADDING_RIGHT = 10;
const MINI_PADDING_LEFT = 12;
const MINI_GAP = 8;
const MINI_KEY_SIZE = 44;
const MINI_KEY_GAP = 6;
const MINI_FACE_HEIGHT = 44;
const MINI_FACE_PADDING_LEFT = 6;
const MINI_FACE_PADDING_RIGHT = 10;
const MINI_REEL_SIZE = 24;
const MINI_REEL_HEIGHT = 26;
const MINI_REEL_GAP = 2;
const MINI_TIME_HEIGHT = 18;
const MINI_SUB_HEIGHT = 15;
const MINI_EDGE = 6;
const MINI_BAND_MARGIN = 14;
const DECK_BAND_MARGIN = 8;
const KEY_LABEL_MARGIN = 8;
const KEY_LABEL_SHRINK_SPEED = 1.4;
const WAVE_FADE_SPEED = 2.2;
const KEY_LABEL_FADE_SPEED = 2;

export const PINNED_BAND_HEIGHT = MINI_HEIGHT + MINI_BAND_MARGIN;

const collapseEasing = Easing.inOut(Easing.cubic);

/** 사각형을 진행률만큼 옮기는 함수 */
const interpolateRect = (from: LayoutRect, to: LayoutRect, progress: number) => {
	'worklet';

	return {
		x: interpolate(progress, [0, 1], [from.x, to.x]),
		y: interpolate(progress, [0, 1], [from.y, to.y]),
		width: interpolate(progress, [0, 1], [from.width, to.width]),
		height: interpolate(progress, [0, 1], [from.height, to.height]),
	};
};

/** 글자를 목표 자리에 맞춰 라벨을 옮기는 함수 */
const labelRectForText = (label: LayoutRect, text: LayoutRect, target: LayoutRect) => {
	'worklet';

	return {
		x: target.x - (text.x - label.x),
		y: target.y - (text.y - label.y),
		width: label.width,
		height: label.height,
	};
};

/** 작은 녹음기 부분별 위치를 반환하는 함수 */
const miniParts = (viewportWidth: number) => {
	'worklet';

	const width = viewportWidth - MINI_SIDE * 2;
	const nextKeyX = width - MINI_PADDING_RIGHT - MINI_KEY_SIZE;
	const playKeyX = nextKeyX - MINI_KEY_GAP - MINI_KEY_SIZE;
	const previousKeyX = playKeyX - MINI_KEY_GAP - MINI_KEY_SIZE;
	const faceWidth = previousKeyX - MINI_GAP - MINI_PADDING_LEFT;
	const reelX = MINI_PADDING_LEFT + MINI_FACE_PADDING_LEFT;
	const reelY = MINI_PADDING_TOP + (MINI_FACE_HEIGHT - MINI_REEL_HEIGHT) / 2;
	const textX = reelX + MINI_REEL_SIZE * 2 + MINI_REEL_GAP + MINI_GAP;
	const textWidth = MINI_PADDING_LEFT + faceWidth - MINI_FACE_PADDING_RIGHT - textX;
	const textY = MINI_PADDING_TOP + (MINI_FACE_HEIGHT - MINI_TIME_HEIGHT - MINI_SUB_HEIGHT) / 2;
	const keyRect = (x: number) => ({ x, y: MINI_PADDING_TOP, width: MINI_KEY_SIZE, height: MINI_KEY_SIZE });

	return {
		body: { x: MINI_SIDE, y: 0, width, height: MINI_HEIGHT },
		window: { x: MINI_PADDING_LEFT, y: MINI_PADDING_TOP, width: faceWidth, height: MINI_FACE_HEIGHT },
		reels: [
			{ x: reelX, y: reelY, width: MINI_REEL_SIZE, height: MINI_REEL_HEIGHT },
			{ x: reelX + MINI_REEL_SIZE + MINI_REEL_GAP, y: reelY, width: MINI_REEL_SIZE, height: MINI_REEL_HEIGHT },
		],
		time: { x: textX, y: textY, width: textWidth, height: MINI_TIME_HEIGHT },
		sub: { x: textX, y: textY + MINI_TIME_HEIGHT, width: textWidth, height: MINI_SUB_HEIGHT },
		keys: [keyRect(previousKeyX), keyRect(playKeyX), keyRect(nextKeyX)],
	};
};

interface Props {
	item: TapeItem | null;
	playing: boolean;
	pinned: boolean;
	previousDisabled: boolean;
	nextDisabled: boolean;
	playDisabled: boolean;
	onPrevious: () => void;
	onTogglePlay: () => void;
	onNext: () => void;
	scrollY: SharedValue<number>;
	viewportWidth: SharedValue<number>;
	feedRadius: SharedValue<number>;
	takeRadius: SharedValue<number>;
	deckLayout: SharedValue<LayoutRect>;
	deckParts: SharedValue<RecorderParts | null>;
}

/**
 * 화면 위에 작게 접히는 녹음기 컴포넌트
 * @param item 선택한 소리, 없으면 내 목소리
 * @param playing 재생 중 여부
 * @param pinned 화면 위에 고정되었는지 여부
 * @param previousDisabled 이전 버튼 비활성 여부
 * @param nextDisabled 다음 버튼 비활성 여부
 * @param playDisabled 재생 버튼 비활성 여부
 * @param onPrevious 이전 버튼을 누르면 실행할 함수
 * @param onTogglePlay 재생 버튼을 누르면 실행할 함수
 * @param onNext 다음 버튼을 누르면 실행할 함수
 * @param scrollY 화면 스크롤 위치
 * @param viewportWidth 화면 폭
 * @param feedRadius 왼쪽 릴에 감긴 테이프 반지름
 * @param takeRadius 오른쪽 릴에 감긴 테이프 반지름
 * @param deckLayout 큰 녹음기 위치
 * @param deckParts 큰 녹음기 부분별 위치
 */
const RecorderPinned = memo(
	({
		item,
		playing,
		pinned,
		previousDisabled,
		nextDisabled,
		playDisabled,
		onPrevious,
		onTogglePlay,
		onNext,
		scrollY,
		viewportWidth,
		feedRadius,
		takeRadius,
		deckLayout,
		deckParts,
	}: Props) => {
		const { t } = useTranslation();

		const reducedMotion = useReducedMotion();

		const time = item ? dayjs(item.startedAt).format('LT') : t('report.detail.myVoice');
		const keyLabel = item ? t('report.detail.soundAt', { time }) : t('report.detail.playMyVoice');
		const sub = item ? t(`report.detail.kinds.${item.kind}`) : t('report.detail.noMimic');

		// 높이 차이만큼 스크롤하는 동안 접힘
		const collapse = useDerivedValue(() => {
			const deck = deckLayout.get();
			const travel = Math.min((scrollY.get() - deck.y) / Math.max(deck.height - MINI_HEIGHT, 1), 1);

			if (travel <= 0) {
				return 0;
			}

			return collapseEasing(reducedMotion ? Math.round(travel) : travel);
		});
		const morph = useDerivedValue(() => {
			const parts = deckParts.get();
			const deck = deckLayout.get();

			if (!parts || deck.width === 0) {
				return null;
			}

			const mini = miniParts(viewportWidth.get());
			const progress = collapse.get();

			return {
				progress,
				body: interpolateRect({ x: deck.x, y: 0, width: deck.width, height: deck.height }, mini.body, progress),
				window: interpolateRect(parts.window, mini.window, progress),
				reels: parts.reels.map((reel, index) => interpolateRect(reel, mini.reels[index], progress)),
				wave: interpolateRect(
					parts.wave,
					{ ...mini.time, width: parts.wave.width, height: parts.wave.height },
					progress,
				),
				timeLabel: interpolateRect(
					parts.timeLabel,
					labelRectForText(parts.timeLabel, parts.time, mini.time),
					progress,
				),
				kindLabel: parts.kindLabel
					? interpolateRect(parts.kindLabel, labelRectForText(parts.kindLabel, parts.sub, mini.sub), progress)
					: null,
				time: interpolateRect(parts.time, mini.time, progress),
				sub: interpolateRect(parts.sub, mini.sub, progress),
				keys: parts.keys.map((key, index) => interpolateRect(key, mini.keys[index], progress)),
				keyLabelWidth: parts.keyLabelWidth,
			};
		});

		const overlayStyle = useAnimatedStyle(() => ({
			opacity: morph.get() && scrollY.get() > deckLayout.get().y ? 1 : 0,
		}));
		const bandStyle = useAnimatedStyle(() => {
			const current = morph.get();

			return {
				height: current
					? current.body.y +
						current.body.height +
						interpolate(current.progress, [0, 1], [DECK_BAND_MARGIN, MINI_BAND_MARGIN])
					: 0,
			};
		});
		const bodyStyle = useAnimatedStyle(() => {
			const current = morph.get();

			return current
				? {
						width: current.body.width,
						height: current.body.height,
						transform: [{ translateX: current.body.x }, { translateY: current.body.y }],
					}
				: {};
		});
		const bodyEdgeStyle = useAnimatedStyle(() => {
			const progress = morph.get()?.progress ?? 0;
			const edge = interpolate(progress, [0, 1], [DECK_EDGE, MINI_EDGE]);

			return { top: edge, bottom: -edge, borderRadius: interpolate(progress, [0, 1], [24, 20]) };
		});
		const bodyFaceStyle = useAnimatedStyle(() => ({
			borderRadius: interpolate(morph.get()?.progress ?? 0, [0, 1], [24, 20]),
		}));
		const windowStyle = useAnimatedStyle(() => {
			const current = morph.get();

			return current
				? {
						width: current.window.width,
						height: current.window.height,
						borderRadius: interpolate(current.progress, [0, 1], [16, 14]),
						transform: [{ translateX: current.window.x }, { translateY: current.window.y }],
					}
				: {};
		});
		const leftReelStyle = useAnimatedStyle(() => {
			const reel = morph.get()?.reels[0];

			return reel
				? {
						transform: [
							{ translateX: reel.x },
							{ translateY: reel.y },
							{ scale: reel.width / DECK_REEL_SIZE },
						],
					}
				: {};
		});
		const rightReelStyle = useAnimatedStyle(() => {
			const reel = morph.get()?.reels[1];

			return reel
				? {
						transform: [
							{ translateX: reel.x },
							{ translateY: reel.y },
							{ scale: reel.width / DECK_REEL_SIZE },
						],
					}
				: {};
		});
		const waveStyle = useAnimatedStyle(() => {
			const current = morph.get();

			return current
				? {
						width: current.wave.width,
						height: current.wave.height,
						opacity: Math.max(1 - current.progress * WAVE_FADE_SPEED, 0),
						transform: [{ translateX: current.wave.x }, { translateY: current.wave.y }],
					}
				: {};
		});
		const timeLabelStyle = useAnimatedStyle(() => {
			const current = morph.get();

			return current
				? {
						opacity: 1 - current.progress,
						transform: [{ translateX: current.timeLabel.x }, { translateY: current.timeLabel.y }],
					}
				: {};
		});
		const kindLabelStyle = useAnimatedStyle(() => {
			const current = morph.get();

			return current?.kindLabel
				? {
						opacity: 1 - current.progress,
						transform: [{ translateX: current.kindLabel.x }, { translateY: current.kindLabel.y }],
					}
				: {};
		});
		const timeStyle = useAnimatedStyle(() => {
			const current = morph.get();

			return current
				? {
						opacity: current.progress,
						transform: [{ translateX: current.time.x }, { translateY: current.time.y }],
					}
				: {};
		});
		const subStyle = useAnimatedStyle(() => {
			const current = morph.get();

			return current
				? {
						opacity: current.progress,
						transform: [{ translateX: current.sub.x }, { translateY: current.sub.y }],
					}
				: {};
		});
		const previousKeyStyle = useAnimatedStyle(() => {
			const key = morph.get()?.keys[0];

			return key
				? {
						width: key.width,
						height: key.height + DECK_KEY_EDGE,
						transform: [{ translateX: key.x }, { translateY: key.y }],
					}
				: {};
		});
		const playKeyStyle = useAnimatedStyle(() => {
			const key = morph.get()?.keys[1];

			return key
				? {
						width: key.width,
						height: key.height + DECK_KEY_EDGE,
						transform: [{ translateX: key.x }, { translateY: key.y }],
					}
				: {};
		});
		const nextKeyStyle = useAnimatedStyle(() => {
			const key = morph.get()?.keys[2];

			return key
				? {
						width: key.width,
						height: key.height + DECK_KEY_EDGE,
						transform: [{ translateX: key.x }, { translateY: key.y }],
					}
				: {};
		});
		const keyLabelStyle = useAnimatedStyle(() => {
			const current = morph.get();
			const shrink = Math.min((current?.progress ?? 0) * KEY_LABEL_SHRINK_SPEED, 1);

			return {
				opacity: Math.max(1 - (current?.progress ?? 0) * KEY_LABEL_FADE_SPEED, 0),
				maxWidth: interpolate(shrink, [0, 1], [current?.keyLabelWidth ?? 0, 0]),
				marginLeft: interpolate(shrink, [0, 1], [KEY_LABEL_MARGIN, 0]),
			};
		});

		return (
			<Animated.View pointerEvents={pinned ? 'box-none' : 'none'} style={[styles.overlay, overlayStyle]}>
				{/*녹음기 뒤로 지나가는 내용을 가리는 흰 띠*/}
				<Animated.View pointerEvents="none" style={[styles.band, bandStyle]} />

				<Animated.View pointerEvents="box-none" style={[styles.part, bodyStyle]}>
					<Animated.View pointerEvents="none" style={[styles.bodyEdge, bodyEdgeStyle]} />
					<Animated.View pointerEvents="none" style={[styles.bodyFace, bodyFaceStyle]} />

					<Animated.View pointerEvents="none" style={[styles.part, styles.window, windowStyle]} />

					<Animated.View pointerEvents="none" style={[styles.part, styles.reel, leftReelStyle]}>
						<TapeReel
							size={DECK_REEL_SIZE}
							side="left"
							radius={feedRadius}
							scrollY={scrollY}
							playing={playing}
						/>
					</Animated.View>

					<Animated.View pointerEvents="none" style={[styles.part, styles.reel, rightReelStyle]}>
						<TapeReel
							size={DECK_REEL_SIZE}
							side="right"
							radius={takeRadius}
							scrollY={scrollY}
							playing={playing}
						/>
					</Animated.View>

					<Animated.View pointerEvents="none" style={[styles.part, styles.wave, waveStyle]}>
						<RecorderWaveform active={item !== null} playing={playing} />
					</Animated.View>

					<Animated.View pointerEvents="none" style={[styles.part, timeLabelStyle]}>
						<RecorderTimeLabel item={item} />
					</Animated.View>

					{item && (
						<Animated.View pointerEvents="none" style={[styles.part, kindLabelStyle]}>
							<RecorderKindLabel kind={item.kind} />
						</Animated.View>
					)}

					<Animated.View pointerEvents="none" style={[styles.part, timeStyle]}>
						<Copy numberOfLines={1} style={styles.time}>
							{time}
						</Copy>
					</Animated.View>

					<Animated.View pointerEvents="none" style={[styles.part, subStyle]}>
						<Copy numberOfLines={1} style={styles.sub}>
							{sub}
						</Copy>
					</Animated.View>

					<Animated.View style={[styles.part, previousKeyStyle]}>
						<RecorderKey
							variant="side"
							icon={SkipBackIcon}
							accessibilityLabel={t('report.detail.previous')}
							disabled={previousDisabled}
							onPress={onPrevious}
						/>
					</Animated.View>

					<Animated.View style={[styles.part, playKeyStyle]}>
						<RecorderKey
							variant="main"
							icon={playing ? PauseIcon : PlayIcon}
							accessibilityLabel={playing ? t('common.sound.stopNamed', { name: keyLabel }) : keyLabel}
							disabled={playDisabled}
							label={keyLabel}
							labelStyle={keyLabelStyle}
							onPress={onTogglePlay}
						/>
					</Animated.View>

					<Animated.View style={[styles.part, nextKeyStyle]}>
						<RecorderKey
							variant="side"
							icon={SkipForwardIcon}
							accessibilityLabel={t('report.detail.next')}
							disabled={nextDisabled}
							onPress={onNext}
						/>
					</Animated.View>
				</Animated.View>
			</Animated.View>
		);
	},
);

const styles = StyleSheet.create({
	overlay: { position: 'absolute', top: 0, right: 0, left: 0, zIndex: 3 },
	band: { position: 'absolute', top: 0, right: 0, left: 0, backgroundColor: colors.background },
	part: { position: 'absolute', top: 0, left: 0 },
	bodyEdge: { position: 'absolute', right: 0, left: 0, backgroundColor: colors.orangeDark },
	bodyFace: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.orange },
	window: { backgroundColor: colors.background },
	reel: { transformOrigin: 'left top' },
	wave: { alignItems: 'center', justifyContent: 'center' },
	time: { fontFamily: font.black, fontSize: 15, lineHeight: MINI_TIME_HEIGHT, fontVariant: ['tabular-nums'] },
	sub: { fontFamily: font.extraBold, fontSize: 12, lineHeight: MINI_SUB_HEIGHT, color: colors.muted },
});

export default RecorderPinned;
