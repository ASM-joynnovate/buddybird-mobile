import { Fragment, useEffect, useRef, useState } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import { MoonIcon } from 'lucide-react-native';
import Animated, {
	type AnimatedRef,
	Easing,
	scrollTo,
	type SharedValue,
	useAnimatedReaction,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withDelay,
	withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { runOnUI } from 'react-native-worklets';

import { HOUR } from '@/config/units';
import { burstEasing } from '@/screens/report/components/session-detail-animations';
import { soundKindColors } from '@/screens/report/components/sound-kind-colors';
import TapeLogDetail from '@/screens/report/components/tape-log/detail';
import TapeLogItem from '@/screens/report/components/tape-log/item';
import { colors, font } from '@/theme';
import { getTapeLineIndex, type SoundKind, type TapeItem, type TapeRow } from '@/utils/tape-log';

import { Copy } from '@/components/ui/copy';

const SLEEP_COLORS = {
	light: '#fafafa',
	dark: '#ececec',
	lanes: {
		parrot: 'rgba(234, 247, 255, 0.85)',
		mimic: 'rgba(249, 241, 255, 0.85)',
		emergency: 'rgba(255, 240, 240, 0.9)',
	},
};

const LANE_GAP = 6;
const ROW_PADDING = 3;
const SLEEP_ROW_PADDING = 6;
const PANEL_GAP = 8;
const REVEAL_RATIO = 0.35;
const OPEN_MS = 300;
const RESIZE_MS = 220;
const CLOSE_MS = 200;
const FADE_IN_DELAY_MS = 40;
const FADE_IN_MS = 200;
const FADE_OUT_MS = 140;
const SHRINK_MS = 160;
const REDUCED_FADE_MS = 150;
const CLOSED_SCALE = 0.94;

export interface RowLayout {
	y: number;
	height: number;
	panelHeight: number;
	start: number;
	end: number;
}

export interface LineLayout {
	y: number;
	height: number;
}

interface OpenedPanel {
	itemId: string;
	lineIndex: number;
}

interface Props {
	row: TapeRow;
	index: number;
	lanes: SoundKind[];
	selectedItem: TapeItem | null;
	pressedItemHeld: boolean;
	playing: boolean;
	wordName: string;
	scrollRef: AnimatedRef<Animated.ScrollView>;
	scrollY: SharedValue<number>;
	viewportHeight: SharedValue<number>;
	logY: SharedValue<number>;
	rowLayouts: SharedValue<RowLayout[]>;
	lineLayouts: SharedValue<LineLayout[][]>;
	onSelectItem: (item: TapeItem) => void;
	onTogglePlay: () => void;
	onShareItem: (item: TapeItem) => void;
}

/**
 * 알약을 종류별 칸에 담는 행 컴포넌트
 * @param row 행의 시각 범위 및 알약
 * @param index 테이프 기록 안에서의 행 순서
 * @param lanes 보여 줄 소리 종류 칸
 * @param selectedItem 이 행에서 선택한 알약
 * @param pressedItemHeld 누른 알약을 제자리에 둘지 여부
 * @param playing 선택한 알약의 재생 중 여부
 * @param wordName 세션에서 학습한 단어
 * @param scrollRef 화면 ScrollView ref
 * @param scrollY 화면 스크롤 위치
 * @param viewportHeight 화면 높이
 * @param logY 테이프 기록 위치
 * @param rowLayouts 행 위치를 저장할 값
 * @param lineLayouts 줄 위치를 저장할 값
 * @param onSelectItem 알약을 선택하면 실행할 함수
 * @param onTogglePlay 패널의 재생 버튼을 누르면 실행할 함수
 * @param onShareItem 패널의 공유 버튼을 누르면 실행할 함수
 */
const TapeLogRow = ({
	row,
	index,
	lanes,
	selectedItem,
	pressedItemHeld,
	playing,
	wordName,
	scrollRef,
	scrollY,
	viewportHeight,
	logY,
	rowLayouts,
	lineLayouts,
	onSelectItem,
	onTogglePlay,
	onShareItem,
}: Props) => {
	const { t } = useTranslation();

	const reducedMotion = useReducedMotion();

	const rowY = useSharedValue(0);
	const rowHeight = useSharedValue(0);
	const rowRevealed = useSharedValue(false);
	const panelHeight = useSharedValue(0);
	const panelOpacity = useSharedValue(0);
	const panelScale = useSharedValue(CLOSED_SCALE);
	const scrollHeld = useSharedValue(false);
	const heldScrollY = useSharedValue(0);

	const [panelItem, setPanelItem] = useState(selectedItem);
	const [panelContentHeight, setPanelContentHeight] = useState(0);
	const [panelWidth, setPanelWidth] = useState(0);
	const [openedAtMount] = useState(selectedItem !== null);

	const instantOpenRef = useRef(selectedItem !== null);
	const openedPanelRef = useRef<OpenedPanel | null>(null);

	if (selectedItem && selectedItem !== panelItem) {
		setPanelItem(selectedItem);
	}

	const panelOpen = selectedItem !== null;
	const laneItems = lanes.map((kind) => row.items.filter((item) => item.kind === kind));
	const lineCount = Math.max(...laneItems.map((items) => items.length), 1);
	const lines = Array.from({ length: lineCount }, (_, lineIndex) => laneItems.map((items) => items.at(lineIndex)));
	const panelLineIndex = panelItem ? getTapeLineIndex(row, panelItem) : -1;
	const laneWidth = (panelWidth - LANE_GAP * (lanes.length - 1)) / lanes.length;
	const panelLaneIndex = panelItem ? lanes.indexOf(panelItem.kind) : 0;
	const panelOriginX = panelLaneIndex * (laneWidth + LANE_GAP) + laneWidth / 2;
	const panelClipStyle = useAnimatedStyle(() => ({ height: panelHeight.get() }));
	const panelStyle = useAnimatedStyle(() => ({
		opacity: panelOpacity.get(),
		transform: [{ scale: panelScale.get() }],
	}));

	/** 행이 35% 넘게 보이면 알약을 띄움 */
	useAnimatedReaction(
		() => {
			const height = rowHeight.get();

			if (height === 0) {
				return false;
			}

			const top = logY.get() + rowY.get();
			const visibleTop = Math.max(top, scrollY.get());
			const visibleBottom = Math.min(top + height, scrollY.get() + viewportHeight.get());

			return (visibleBottom - visibleTop) / height >= REVEAL_RATIO;
		},
		(visible) => {
			if (visible) {
				rowRevealed.set(true);
			}
		},
	);

	/** 패널 높이를 행 위치에 저장 */
	useAnimatedReaction(
		() => panelHeight.get(),
		(height) => {
			rowLayouts.modify((layouts) => {
				'worklet';

				if (layouts[index]) {
					layouts[index] = { ...layouts[index], panelHeight: height };
				}

				return layouts;
			});
		},
	);

	/** 패널이 접히는 만큼 스크롤을 올림 */
	useAnimatedReaction(
		() => panelHeight.get(),
		(height, previousHeight) => {
			if (!scrollHeld.get() || previousHeight === null) {
				return;
			}

			if (height < previousHeight) {
				heldScrollY.set(Math.max(heldScrollY.get() - (previousHeight - height), 0));
				scrollTo(scrollRef, 0, heldScrollY.get(), false);
			}

			if (height === 0) {
				scrollHeld.set(false);
			}
		},
	);

	/** 선택에 따라 패널을 펼치거나 옮기거나 접음 */
	useEffect(() => {
		const openedPanel = openedPanelRef.current;

		if (!selectedItem) {
			openedPanelRef.current = null;

			if (!openedPanel) {
				return;
			}

			if (pressedItemHeld) {
				heldScrollY.set(scrollY.get());
				scrollHeld.set(true);
			}

			panelHeight.set(reducedMotion ? 0 : withTiming(0, { duration: CLOSE_MS, easing: burstEasing }));
			panelOpacity.set(
				withTiming(0, { duration: reducedMotion ? REDUCED_FADE_MS : FADE_OUT_MS, easing: Easing.ease }),
			);
			panelScale.set(reducedMotion ? 1 : withTiming(CLOSED_SCALE, { duration: SHRINK_MS, easing: Easing.ease }));

			return;
		}

		if (panelContentHeight === 0) {
			return;
		}

		openedPanelRef.current = { itemId: selectedItem.id, lineIndex: panelLineIndex };

		if (instantOpenRef.current) {
			instantOpenRef.current = false;

			panelHeight.set(panelContentHeight);
			panelOpacity.set(1);
			panelScale.set(1);

			return;
		}

		const panelMoved =
			openedPanel !== null && openedPanel.itemId !== selectedItem.id && openedPanel.lineIndex !== panelLineIndex;

		// 패널이 누른 알약 위에 있었으면 스크롤을 올림
		if (panelMoved && pressedItemHeld && openedPanel.lineIndex < panelLineIndex) {
			runOnUI(() => {
				'worklet';

				scrollTo(scrollRef, 0, Math.max(scrollY.get() - panelHeight.get(), 0), false);
			})();
		}

		if (panelMoved) {
			panelOpacity.set(0);
			panelScale.set(CLOSED_SCALE);
		}

		if (reducedMotion) {
			panelHeight.set(panelContentHeight);
			panelOpacity.set(withTiming(1, { duration: REDUCED_FADE_MS }));
			panelScale.set(1);

			return;
		}

		panelHeight.set(
			withTiming(panelContentHeight, { duration: openedPanel ? RESIZE_MS : OPEN_MS, easing: burstEasing }),
		);

		if (!openedPanel || panelMoved) {
			panelOpacity.set(withDelay(FADE_IN_DELAY_MS, withTiming(1, { duration: FADE_IN_MS, easing: burstEasing })));
			panelScale.set(withTiming(1, { duration: OPEN_MS, easing: burstEasing }));
		}
	}, [
		heldScrollY,
		panelContentHeight,
		panelHeight,
		panelLineIndex,
		panelOpacity,
		panelScale,
		pressedItemHeld,
		reducedMotion,
		scrollHeld,
		scrollRef,
		scrollY,
		selectedItem,
	]);

	const handleLayout = (event: LayoutChangeEvent) => {
		const { y, height } = event.nativeEvent.layout;

		rowY.set(y);
		rowHeight.set(height);

		rowLayouts.modify((layouts) => {
			'worklet';

			layouts[index] = { y, height, panelHeight: panelHeight.get(), start: row.start, end: row.end };

			return layouts;
		});
	};

	const handleLineLayout = (lineIndex: number, event: LayoutChangeEvent) => {
		const { y, height } = event.nativeEvent.layout;
		const rowPadding = row.sleeping ? SLEEP_ROW_PADDING : ROW_PADDING;

		lineLayouts.modify((layouts) => {
			'worklet';

			layouts[index] = layouts[index] ?? [];
			layouts[index][lineIndex] = { y: rowPadding + y, height };

			return layouts;
		});
	};

	return (
		<View style={[styles.row, row.sleeping && styles.sleepRow]} onLayout={handleLayout}>
			{/*수면 구간의 빗금 바탕*/}
			{row.sleeping && (
				<View style={styles.sleepBackground}>
					<Svg width="100%" height="100%">
						<Defs>
							<Pattern
								id="sleep"
								width="16"
								height="16"
								patternUnits="userSpaceOnUse"
								patternTransform="rotate(45)"
							>
								<Rect width="8" height="16" fill={SLEEP_COLORS.light} />
								<Rect x="8" width="8" height="16" fill={SLEEP_COLORS.dark} />
							</Pattern>
						</Defs>
						<Rect width="100%" height="100%" fill="url(#sleep)" />
					</Svg>
				</View>
			)}

			<View style={[styles.when, row.sleeping && styles.sleepWhen]}>
				{row.sleeping ? (
					<>
						<MoonIcon size={18} color={colors.muted} />
						<Copy style={styles.subLabel}>
							{t('common.duration.hours', { value: Math.round((row.end - row.start) / HOUR) })}
						</Copy>
					</>
				) : (
					<>
						<View style={styles.hourContainer}>
							<Copy style={styles.hour}>
								{t('report.detail.hour', { hour: dayjs(row.start).format('h') })}
							</Copy>
						</View>
						{row.meridiemShown && (
							<Copy style={[styles.subLabel, styles.meridiem]}>{dayjs(row.start).format('A')}</Copy>
						)}
					</>
				)}
			</View>

			<View style={styles.body}>
				{lines.map((line, lineIndex) => {
					const laneStarted = lineIndex === 0 || (panelOpen && lineIndex === panelLineIndex + 1);
					const laneEnded = lineIndex === lineCount - 1 || (panelOpen && lineIndex === panelLineIndex);

					return (
						<Fragment key={lineIndex}>
							<View style={styles.line} onLayout={(event) => handleLineLayout(lineIndex, event)}>
								{lanes.map((kind, laneIndex) => {
									const item = line[laneIndex];

									return (
										<View
											key={kind}
											style={[
												styles.cell,
												laneStarted && styles.cellStart,
												laneEnded && styles.cellEnd,
												{
													backgroundColor: row.sleeping
														? SLEEP_COLORS.lanes[kind]
														: soundKindColors[kind].lane,
												},
											]}
										>
											{item && (
												<TapeLogItem
													item={item}
													order={
														laneItems
															.slice(0, laneIndex)
															.reduce((count, items) => count + items.length, 0) +
														lineIndex
													}
													selected={item === selectedItem}
													playing={playing && item === selectedItem}
													rowRevealed={rowRevealed}
													onPress={item === selectedItem ? onTogglePlay : onSelectItem}
												/>
											)}
											{lineIndex === 0 && laneItems[laneIndex].length === 0 && (
												<View style={styles.emptyMark} />
											)}
										</View>
									);
								})}
							</View>

							{/*선택한 알약의 상세 패널*/}
							{panelItem && lineIndex === panelLineIndex && (
								<Animated.View
									style={[styles.panelClip, panelClipStyle]}
									onLayout={(event) => setPanelWidth(event.nativeEvent.layout.width)}
								>
									<View
										style={[
											styles.panelContent,
											lineIndex < lineCount - 1 && styles.panelBetweenLines,
										]}
										onLayout={(event) => setPanelContentHeight(event.nativeEvent.layout.height)}
									>
										<Animated.View style={[{ transformOrigin: [panelOriginX, 0, 0] }, panelStyle]}>
											<TapeLogDetail
												item={panelItem}
												playing={playing && panelOpen}
												wordName={wordName}
												instant={openedAtMount}
												onTogglePlay={onTogglePlay}
												onShare={onShareItem}
											/>
										</Animated.View>
									</View>
								</Animated.View>
							)}
						</Fragment>
					);
				})}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	row: { flexDirection: 'row', gap: LANE_GAP, paddingVertical: ROW_PADDING },
	sleepRow: { marginVertical: 6, marginHorizontal: -8, paddingVertical: SLEEP_ROW_PADDING, paddingHorizontal: 8 },
	sleepBackground: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		overflow: 'hidden',
		borderRadius: 14,
	},
	when: { width: 44 },
	sleepWhen: { alignSelf: 'center', alignItems: 'center', gap: 4 },
	hourContainer: { height: 44, justifyContent: 'center' },
	hour: { fontFamily: font.black, fontSize: 16, fontVariant: ['tabular-nums'] },
	subLabel: { fontFamily: font.extraBold, fontSize: 12, lineHeight: 15, color: colors.muted },
	meridiem: { marginTop: -10 },
	body: { flex: 1, minWidth: 0 },
	line: { flexDirection: 'row', alignItems: 'stretch', gap: LANE_GAP },
	cell: { flex: 1, minWidth: 0, minHeight: 44, padding: 4 },
	cellStart: { borderTopLeftRadius: 10, borderTopRightRadius: 10 },
	cellEnd: { borderBottomRightRadius: 10, borderBottomLeftRadius: 10 },
	emptyMark: { width: 10, height: 3, margin: 'auto', borderRadius: 2, backgroundColor: colors.blackFaint },
	panelClip: { overflow: 'hidden' },
	panelContent: { position: 'absolute', top: 0, right: 0, left: 0, paddingTop: PANEL_GAP },
	panelBetweenLines: { paddingBottom: PANEL_GAP },
});

export default TapeLogRow;
