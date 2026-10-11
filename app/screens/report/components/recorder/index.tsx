import { memo, useCallback, useEffect } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from 'lucide-react-native';
import Animated, {
	type AnimatedRef,
	measure,
	type SharedValue,
	useAnimatedRef,
	useAnimatedStyle,
} from 'react-native-reanimated';
import { runOnUI } from 'react-native-worklets';

import RecorderKey from '@/screens/report/components/recorder/key';
import RecorderKindLabel from '@/screens/report/components/recorder/kind-label';
import RecorderTimeLabel from '@/screens/report/components/recorder/time-label';
import RecorderWaveform from '@/screens/report/components/recorder/waveform';
import TapeReel from '@/screens/report/components/tape-reel';
import { colors } from '@/theme';
import type { TapeItem } from '@/utils/tape-log';

export const DECK_EDGE = 8;
export const DECK_KEY_EDGE = 6;
export const DECK_REEL_SIZE = 86;

const KEY_HEIGHT = 56;

export interface LayoutRect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface RecorderParts {
	window: LayoutRect;
	reels: LayoutRect[];
	wave: LayoutRect;
	timeLabel: LayoutRect;
	time: LayoutRect;
	kindLabel: LayoutRect | null;
	sub: LayoutRect;
	keys: LayoutRect[];
	keyLabelWidth: number;
}

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
	feedRadius: SharedValue<number>;
	takeRadius: SharedValue<number>;
	deckLayout: SharedValue<LayoutRect>;
	deckParts: SharedValue<RecorderParts | null>;
}

/**
 * 선택한 소리를 재생하는 큰 녹음기 컴포넌트
 * @param item 선택한 알약, 없으면 내 목소리
 * @param playing 재생 중 여부
 * @param pinned 접히는 녹음기가 대신 보이는지 여부
 * @param previousDisabled 이전 버튼 비활성 여부
 * @param nextDisabled 다음 버튼 비활성 여부
 * @param playDisabled 재생 버튼 비활성 여부
 * @param onPrevious 이전 버튼을 누르면 실행할 함수
 * @param onTogglePlay 재생 버튼을 누르면 실행할 함수
 * @param onNext 다음 버튼을 누르면 실행할 함수
 * @param scrollY 화면 스크롤 위치
 * @param feedRadius 왼쪽 릴에 감긴 테이프 반지름
 * @param takeRadius 오른쪽 릴에 감긴 테이프 반지름
 * @param deckLayout 녹음기 위치를 저장할 값
 * @param deckParts 녹음기 부분별 위치를 저장할 값
 */
const Recorder = memo(
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
		feedRadius,
		takeRadius,
		deckLayout,
		deckParts,
	}: Props) => {
		const { t } = useTranslation();

		const deckRef = useAnimatedRef<Animated.View>();
		const windowRef = useAnimatedRef<Animated.View>();
		const leftReelRef = useAnimatedRef<Animated.View>();
		const rightReelRef = useAnimatedRef<Animated.View>();
		const waveRef = useAnimatedRef<Animated.View>();
		const timeLabelRef = useAnimatedRef<Animated.View>();
		const timeRef = useAnimatedRef<Animated.View>();
		const recordingRef = useAnimatedRef<Animated.View>();
		const kindLabelRef = useAnimatedRef<Animated.View>();
		const kindNameRef = useAnimatedRef<Animated.View>();
		const previousKeyRef = useAnimatedRef<Animated.View>();
		const playKeyRef = useAnimatedRef<Animated.View>();
		const nextKeyRef = useAnimatedRef<Animated.View>();
		const keyLabelRef = useAnimatedRef<Animated.View>();

		const keyLabel = item
			? t('report.detail.soundAt', { time: dayjs(item.startedAt).format('LT') })
			: t('report.detail.playMyVoice');
		const hiddenStyle = useAnimatedStyle(() => ({ opacity: scrollY.get() > deckLayout.get().y ? 0 : 1 }));

		/** 녹음기 부분별 위치를 녹음기 기준으로 재는 함수 */
		const measureParts = useCallback(() => {
			'worklet';

			const deck = measure(deckRef);

			if (!deck) {
				return;
			}

			const rectOf = (ref: AnimatedRef<Animated.View>) => {
				const part = ref() ? measure(ref) : null;

				return part
					? { x: part.pageX - deck.pageX, y: part.pageY - deck.pageY, width: part.width, height: part.height }
					: null;
			};
			const window = rectOf(windowRef);
			const leftReel = rectOf(leftReelRef);
			const rightReel = rectOf(rightReelRef);
			const wave = rectOf(waveRef);
			const timeLabel = rectOf(timeLabelRef);
			const time = rectOf(timeRef);
			const sub = rectOf(kindNameRef) ?? rectOf(recordingRef) ?? time;
			const keys = [rectOf(previousKeyRef), rectOf(playKeyRef), rectOf(nextKeyRef)];

			if (!window || !leftReel || !rightReel || !wave || !timeLabel || !time || !sub) {
				return;
			}

			const measuredKeys = keys.filter((key) => key !== null);

			if (measuredKeys.length !== keys.length) {
				return;
			}

			deckParts.set({
				window,
				reels: [leftReel, rightReel],
				wave,
				timeLabel,
				time,
				kindLabel: rectOf(kindLabelRef),
				sub,
				keys: measuredKeys.map((key) => ({ ...key, height: key.height - DECK_KEY_EDGE })),
				keyLabelWidth: measure(keyLabelRef)?.width ?? 0,
			});
		}, [
			deckParts,
			deckRef,
			keyLabelRef,
			kindLabelRef,
			kindNameRef,
			leftReelRef,
			nextKeyRef,
			playKeyRef,
			previousKeyRef,
			recordingRef,
			rightReelRef,
			timeLabelRef,
			timeRef,
			waveRef,
			windowRef,
		]);

		/** 선택한 소리가 바뀌면 다시 잼 */
		useEffect(() => {
			runOnUI(measureParts)();
		}, [item, measureParts]);

		const handleLayout = (event: LayoutChangeEvent) => {
			const { x, y, width, height } = event.nativeEvent.layout;

			deckLayout.set({ x, y, width, height: height - DECK_EDGE });

			runOnUI(measureParts)();
		};

		return (
			<Animated.View
				ref={deckRef}
				pointerEvents={pinned ? 'none' : 'auto'}
				style={[styles.deck, hiddenStyle]}
				onLayout={handleLayout}
			>
				<View style={styles.edge} />

				<View style={styles.face}>
					{/*선택한 소리 라벨*/}
					<View style={styles.top}>
						<RecorderTimeLabel
							item={item}
							labelRef={timeLabelRef}
							timeRef={timeRef}
							recordingRef={recordingRef}
						/>
						{item && <RecorderKindLabel kind={item.kind} labelRef={kindLabelRef} nameRef={kindNameRef} />}
					</View>

					<Animated.View ref={windowRef} style={styles.window}>
						<View style={styles.reels}>
							<Animated.View ref={leftReelRef}>
								<TapeReel
									size={DECK_REEL_SIZE}
									side="left"
									radius={feedRadius}
									scrollY={scrollY}
									playing={playing}
								/>
							</Animated.View>

							<Animated.View ref={waveRef} style={styles.between}>
								<RecorderWaveform active={item !== null} playing={playing} />
							</Animated.View>

							<Animated.View ref={rightReelRef}>
								<TapeReel
									size={DECK_REEL_SIZE}
									side="right"
									radius={takeRadius}
									scrollY={scrollY}
									playing={playing}
								/>
							</Animated.View>
						</View>
					</Animated.View>

					<View style={styles.keys}>
						<Animated.View ref={previousKeyRef} style={styles.sideKey}>
							<RecorderKey
								variant="side"
								icon={SkipBackIcon}
								accessibilityLabel={t('report.detail.previous')}
								disabled={previousDisabled}
								onPress={onPrevious}
							/>
						</Animated.View>

						<Animated.View ref={playKeyRef} style={styles.mainKey}>
							<RecorderKey
								variant="main"
								icon={playing ? PauseIcon : PlayIcon}
								accessibilityLabel={
									playing ? t('common.sound.stopNamed', { name: keyLabel }) : keyLabel
								}
								disabled={playDisabled}
								label={keyLabel}
								labelRef={keyLabelRef}
								onPress={onTogglePlay}
							/>
						</Animated.View>

						<Animated.View ref={nextKeyRef} style={styles.sideKey}>
							<RecorderKey
								variant="side"
								icon={SkipForwardIcon}
								accessibilityLabel={t('report.detail.next')}
								disabled={nextDisabled}
								onPress={onNext}
							/>
						</Animated.View>
					</View>
				</View>
			</Animated.View>
		);
	},
);

const styles = StyleSheet.create({
	deck: { marginTop: 32, paddingBottom: DECK_EDGE },
	edge: {
		position: 'absolute',
		top: DECK_EDGE,
		right: 0,
		bottom: 0,
		left: 0,
		borderRadius: 24,
		backgroundColor: colors.orangeDark,
	},
	face: {
		paddingTop: 16,
		paddingHorizontal: 16,
		paddingBottom: 18,
		borderRadius: 24,
		backgroundColor: colors.orange,
	},
	top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
	window: { padding: 12, borderRadius: 16, backgroundColor: colors.background },
	reels: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 10,
		paddingHorizontal: 14,
	},
	between: { flex: 1, alignItems: 'center' },
	keys: { flexDirection: 'row', gap: 10, marginTop: 16 },
	sideKey: { flex: 1, height: KEY_HEIGHT + DECK_KEY_EDGE },
	mainKey: { flex: 1.6, height: KEY_HEIGHT + DECK_KEY_EDGE },
});

export default Recorder;
