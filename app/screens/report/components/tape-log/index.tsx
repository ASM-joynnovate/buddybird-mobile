import { Fragment, memo, useEffect, useMemo } from 'react';

import { StyleSheet, View } from 'react-native';

import type { Session } from '@/types/apis/sessions';

import { useTranslation } from 'react-i18next';

import type Animated from 'react-native-reanimated';
import {
	type AnimatedRef,
	scrollTo,
	type SharedValue,
	useReducedMotion,
	useSharedValue,
} from 'react-native-reanimated';
import { runOnUI } from 'react-native-worklets';

import { PINNED_BAND_HEIGHT } from '@/screens/report/components/recorder/pinned';
import TapeLogDayBreak from '@/screens/report/components/tape-log/day-break';
import TapeLogRow, { type ItemLayout, type RowLayout } from '@/screens/report/components/tape-log/row';
import TapeLogStrip, { type StickyLayout } from '@/screens/report/components/tape-log/strip';
import { font } from '@/theme';
import { sessionEndedAt } from '@/utils/date';
import { getMidnights, getSleepSpans, getTapeDays, type TapeItem } from '@/utils/tape-log';

import { Copy } from '@/components/ui/copy';

export type TapeSelectionSource = 'item' | 'key';

interface Props {
	session: Session;
	items: TapeItem[];
	selectedItem: TapeItem | null;
	selectedBy: TapeSelectionSource | null;
	playing: boolean;
	wordName: string;
	scrollRef: AnimatedRef<Animated.ScrollView>;
	scrollY: SharedValue<number>;
	viewportHeight: SharedValue<number>;
	onSelectItem: (item: TapeItem) => void;
	onTogglePlay: () => void;
	onShareItem: (item: TapeItem) => void;
}

/**
 * 시간별 행에 소리 카드를 보이는 컴포넌트
 * @param session 세션
 * @param items 시각순 소리 목록
 * @param selectedItem 선택한 소리
 * @param selectedBy 카드를 눌러 선택했는지 버튼으로 옮겼는지
 * @param playing 선택한 소리의 재생 중 여부
 * @param wordName 세션에서 학습한 단어
 * @param scrollRef 화면 ScrollView ref
 * @param scrollY 화면 스크롤 위치
 * @param viewportHeight 화면 높이
 * @param onSelectItem 카드를 선택하면 실행할 함수
 * @param onTogglePlay 선택한 카드를 누르면 실행할 함수
 * @param onShareItem 공유 버튼을 누르면 실행할 함수
 */
const TapeLog = memo(
	({
		session,
		items,
		selectedItem,
		selectedBy,
		playing,
		wordName,
		scrollRef,
		scrollY,
		viewportHeight,
		onSelectItem,
		onTogglePlay,
		onShareItem,
	}: Props) => {
		const { t } = useTranslation();

		const reducedMotion = useReducedMotion();

		const logY = useSharedValue(0);
		const logHeight = useSharedValue(0);
		const stripLayout = useSharedValue<StickyLayout>({ y: 0, height: 0 });
		const dayBreakLayouts = useSharedValue<StickyLayout[]>([]);
		const rowLayouts = useSharedValue<RowLayout[]>([]);
		const itemLayouts = useSharedValue<ItemLayout[][]>([]);

		const { span, sleepSpans, midnights, days } = useMemo(() => {
			const sessionSpan = {
				start: Date.parse(session.period.started_at),
				end: sessionEndedAt(session.period).valueOf(),
			};
			const sessionSleepSpans = getSleepSpans(sessionSpan, session.schedule.sleep);

			return {
				span: sessionSpan,
				sleepSpans: sessionSleepSpans,
				midnights: getMidnights(sessionSpan),
				days: getTapeDays(sessionSpan, sessionSleepSpans, items),
			};
		}, [items, session.period, session.schedule.sleep]);

		const judgmentPending = session.judgment.status === 'pending';
		const rows = days.flatMap((day) => day.rows);
		const selectedItemId = selectedItem?.id;
		const selectedRowIndex = selectedItem ? rows.findIndex((row) => row.items.includes(selectedItem)) : -1;
		const selectedItemIndex =
			selectedItem && selectedRowIndex !== -1 ? rows[selectedRowIndex].items.indexOf(selectedItem) : -1;

		/** 버튼으로 옮긴 카드가 가려지면 스크롤 */
		useEffect(() => {
			if (selectedBy !== 'key' || selectedRowIndex === -1) {
				return;
			}

			runOnUI((rowIndex: number, itemIndex: number) => {
				'worklet';

				const row = rowLayouts.get()[rowIndex];
				const item = itemLayouts.get()[rowIndex]?.[itemIndex];

				if (!row || !item) {
					return;
				}

				const top = logY.get() + row.y + item.y;
				const coveredHeight =
					PINNED_BAND_HEIGHT + stripLayout.get().height + (dayBreakLayouts.get().at(0)?.height ?? 0);
				const visibleTop = scrollY.get() + coveredHeight;
				const visibleBottom = scrollY.get() + viewportHeight.get();

				if (top >= visibleTop && top + item.height <= visibleBottom) {
					return;
				}

				scrollTo(scrollRef, 0, Math.max(top - coveredHeight, 0), !reducedMotion);
			})(selectedRowIndex, selectedItemIndex);
		}, [
			dayBreakLayouts,
			itemLayouts,
			logY,
			reducedMotion,
			rowLayouts,
			scrollRef,
			scrollY,
			selectedBy,
			selectedItemId,
			selectedItemIndex,
			selectedRowIndex,
			stripLayout,
			viewportHeight,
		]);

		return (
			<View
				style={styles.container}
				onLayout={(event) => {
					logY.set(event.nativeEvent.layout.y);
					logHeight.set(event.nativeEvent.layout.height);
				}}
			>
				<Copy accessibilityRole="header" style={styles.title}>
					{t('report.detail.tapeLog')}
				</Copy>

				<TapeLogStrip
					span={span}
					running={session.period.ended_at === null}
					sleepSpans={sleepSpans}
					midnights={midnights}
					playing={playing}
					scrollY={scrollY}
					viewportHeight={viewportHeight}
					logY={logY}
					rowLayouts={rowLayouts}
					dayBreakLayouts={dayBreakLayouts}
					stripLayout={stripLayout}
				/>

				{days.map((day, dayIndex) => (
					<Fragment key={day.date}>
						<TapeLogDayBreak
							date={day.date}
							index={dayIndex}
							scrollY={scrollY}
							viewportHeight={viewportHeight}
							logY={logY}
							logHeight={logHeight}
							stripLayout={stripLayout}
							dayBreakLayouts={dayBreakLayouts}
						/>

						{day.rows.map((row, rowIndexInDay) => {
							const rowIndex = rows.indexOf(row);

							return (
								<TapeLogRow
									key={row.start}
									row={row}
									index={rowIndex}
									firstInDay={rowIndexInDay === 0}
									selectedItem={rowIndex === selectedRowIndex ? selectedItem : null}
									playing={playing}
									judgmentPending={judgmentPending}
									wordName={wordName}
									scrollY={scrollY}
									viewportHeight={viewportHeight}
									logY={logY}
									rowLayouts={rowLayouts}
									itemLayouts={itemLayouts}
									onSelectItem={onSelectItem}
									onTogglePlay={onTogglePlay}
									onShareItem={onShareItem}
								/>
							);
						})}
					</Fragment>
				))}
			</View>
		);
	},
);

const styles = StyleSheet.create({
	container: { marginTop: 32 },
	title: { marginBottom: 12, fontFamily: font.black, fontSize: 18, lineHeight: 24 },
});

export default TapeLog;
