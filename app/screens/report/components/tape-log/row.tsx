import { useState } from 'react';

import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { formatHour } from '@/i18n/format';

import { MoonIcon } from 'lucide-react-native';
import { type SharedValue, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { HOUR } from '@/config/units';
import DashedLine from '@/screens/report/components/dashed-line';
import TapeLogItem from '@/screens/report/components/tape-log/item';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';
import type { TapeItem, TapeRow } from '@/utils/tape-log';

import { Copy } from '@/components/ui/copy';

const SLEEP_COLORS = {
	light: '#fafafa',
	dark: '#ececec',
};

const CARD_GAP = 8;
const SLEEP_PADDING = 12;
const REVEAL_RATIO = 0.35;

export interface RowLayout {
	y: number;
	height: number;
	start: number;
	end: number;
}

export interface ItemLayout {
	y: number;
	height: number;
}

interface Props {
	row: TapeRow;
	index: number;
	firstInDay: boolean;
	selectedItem: TapeItem | null;
	playing: boolean;
	judgmentPending: boolean;
	wordName: string;
	scrollY: SharedValue<number>;
	viewportHeight: SharedValue<number>;
	logY: SharedValue<number>;
	rowLayouts: SharedValue<RowLayout[]>;
	itemLayouts: SharedValue<ItemLayout[][]>;
	onSelectItem: (item: TapeItem) => void;
	onTogglePlay: () => void;
	onShareItem: (item: TapeItem) => void;
}

/**
 * 한 시간의 소리 카드를 보이는 행 컴포넌트
 * @param row 행의 시각 범위 및 소리
 * @param index 기록 안에서의 행 순서
 * @param firstInDay 그 날짜의 첫 행인지 여부
 * @param selectedItem 이 행에서 선택한 소리
 * @param playing 선택한 소리의 재생 중 여부
 * @param judgmentPending 세션을 분석하는 중인지 여부
 * @param wordName 세션에서 학습한 단어
 * @param scrollY 화면 스크롤 위치
 * @param viewportHeight 화면 높이
 * @param logY 기록 위치
 * @param rowLayouts 행 위치를 저장할 값
 * @param itemLayouts 카드 위치를 저장할 값
 * @param onSelectItem 카드를 선택하면 실행할 함수
 * @param onTogglePlay 선택한 카드를 누르면 실행할 함수
 * @param onShareItem 공유 버튼을 누르면 실행할 함수
 */
const TapeLogRow = ({
	row,
	index,
	firstInDay,
	selectedItem,
	playing,
	judgmentPending,
	wordName,
	scrollY,
	viewportHeight,
	logY,
	rowLayouts,
	itemLayouts,
	onSelectItem,
	onTogglePlay,
	onShareItem,
}: Props) => {
	const { t } = useTranslation();

	const rowY = useSharedValue(0);
	const rowHeight = useSharedValue(0);
	const rowRevealed = useSharedValue(false);

	const [durationQueryEnabled, setDurationQueryEnabled] = useState(false);

	const locale = useDeviceSettingsStore((state) => state.locale);

	const rowEmpty = row.items.length === 0;

	/** 행이 35% 넘게 보이면 카드를 띄움 */
	useAnimatedReaction(
		() => {
			const height = rowHeight.get();

			if (height === 0) {
				return false;
			}

			const top = logY.get() + rowY.get();
			const visibleTop = Math.max(top, scrollY.get());
			const visibleBottom = Math.min(top + height, scrollY.get() + viewportHeight.get());

			// 화면보다 긴 행은 화면 높이를 기준으로 계산
			return (visibleBottom - visibleTop) / Math.min(height, viewportHeight.get()) >= REVEAL_RATIO;
		},
		(visible) => {
			if (visible) {
				rowRevealed.set(true);

				scheduleOnRN(setDurationQueryEnabled, true);
			}
		},
	);

	const handleLayout = (event: LayoutChangeEvent) => {
		const { y, height } = event.nativeEvent.layout;

		rowY.set(y);
		rowHeight.set(height);

		rowLayouts.modify((layouts) => {
			'worklet';

			layouts[index] = { y, height, start: row.start, end: row.end };

			return layouts;
		});
	};

	const handleItemLayout = (itemIndex: number, event: LayoutChangeEvent) => {
		const { y, height } = event.nativeEvent.layout;
		const rowPadding = row.sleeping ? SLEEP_PADDING : 0;

		itemLayouts.modify((layouts) => {
			'worklet';

			layouts[index] = layouts[index] ?? [];
			layouts[index][itemIndex] = { y: rowPadding + y, height };

			return layouts;
		});
	};

	if (rowEmpty && !row.sleeping) {
		return (
			<View style={[styles.row, firstInDay && styles.firstRow, styles.emptyRow]} onLayout={handleLayout}>
				<Copy style={styles.emptyHour}>{formatHour(row.start, locale)}</Copy>
				<View style={styles.emptyLine}>
					<DashedLine color={colors.border} />
				</View>
			</View>
		);
	}

	return (
		<View
			style={[styles.row, firstInDay && styles.firstRow, row.sleeping && styles.sleepRow]}
			onLayout={handleLayout}
		>
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

			<View style={styles.cards}>
				<View style={styles.head}>
					{row.sleeping ? (
						<>
							<MoonIcon size={18} color={colors.muted} />
							<Copy style={[styles.hour, styles.sleepHours]}>
								{t('common.duration.hours', { value: Math.round((row.end - row.start) / HOUR) })}
							</Copy>
						</>
					) : (
						<Copy accessibilityRole="header" style={styles.hour}>
							{formatHour(row.start, locale)}
						</Copy>
					)}

					{!rowEmpty && (
						<Copy style={styles.count}>{t('report.detail.soundCount', { count: row.items.length })}</Copy>
					)}
				</View>

				{row.items.map((item, itemIndex) => (
					<View
						key={item.id}
						style={[styles.cell, item.kind === 'emergency' && styles.wideCell]}
						onLayout={(event) => handleItemLayout(itemIndex, event)}
					>
						<TapeLogItem
							item={item}
							order={itemIndex}
							selected={item === selectedItem}
							playing={playing && item === selectedItem}
							durationQueryEnabled={durationQueryEnabled}
							judgmentPending={judgmentPending}
							wordName={wordName}
							rowRevealed={rowRevealed}
							onPress={item === selectedItem ? onTogglePlay : onSelectItem}
							onShare={onShareItem}
						/>
					</View>
				))}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	row: { marginTop: 28 },
	firstRow: { marginTop: 8 },
	emptyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	emptyHour: { fontFamily: font.extraBold, fontSize: 14, lineHeight: 20, color: colors.subtle },
	emptyLine: { flex: 1 },
	sleepRow: { marginHorizontal: -SLEEP_PADDING, padding: SLEEP_PADDING },
	sleepBackground: {
		position: 'absolute',
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		overflow: 'hidden',
		borderRadius: 18,
	},
	cards: { flexDirection: 'row', flexWrap: 'wrap', rowGap: CARD_GAP, marginHorizontal: -CARD_GAP / 2 },
	head: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: CARD_GAP / 2 },
	hour: { fontFamily: font.black, fontSize: 16, lineHeight: 22, fontVariant: ['tabular-nums'] },
	sleepHours: { color: colors.muted },
	count: { marginLeft: 'auto', fontFamily: font.extraBold, fontSize: 13, lineHeight: 18, color: colors.muted },
	cell: { width: '50%', paddingHorizontal: CARD_GAP / 2 },
	wideCell: { width: '100%' },
});

export default TapeLogRow;
