import { Fragment, memo, useEffect, useMemo, useRef } from 'react';

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
import TapeLogHeader from '@/screens/report/components/tape-log/header';
import TapeLogRow, { type LineLayout, type RowLayout } from '@/screens/report/components/tape-log/row';
import TapeLogStrip, { type StickyLayout } from '@/screens/report/components/tape-log/strip';
import { font } from '@/theme';
import { sessionEndedAt } from '@/utils/date';
import {
	getMidnights,
	getSleepSpans,
	getTapeDays,
	getTapeLineIndex,
	type SoundKind,
	type TapeItem,
} from '@/utils/tape-log';

import { Copy } from '@/components/ui/copy';
import { Tag } from '@/components/ui/tag';

export type TapeSelectionSource = 'item' | 'key';

interface Props {
	session: Session;
	items: TapeItem[];
	lanes: SoundKind[];
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
 * 시간별 행에 소리 알약을 보이는 컴포넌트
 * @param session 세션
 * @param items 시각순 알약 목록
 * @param lanes 보여 줄 소리 종류 칸
 * @param selectedItem 선택한 알약
 * @param selectedBy 알약을 눌러 선택했는지 버튼으로 옮겼는지
 * @param playing 선택한 알약의 재생 중 여부
 * @param wordName 세션에서 학습한 단어
 * @param scrollRef 화면 ScrollView ref
 * @param scrollY 화면 스크롤 위치
 * @param viewportHeight 화면 높이
 * @param onSelectItem 알약을 선택하면 실행할 함수
 * @param onTogglePlay 패널의 재생 버튼을 누르면 실행할 함수
 * @param onShareItem 패널의 공유 버튼을 누르면 실행할 함수
 */
const TapeLog = memo(
	({
		session,
		items,
		lanes,
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
		const lineLayouts = useSharedValue<LineLayout[][]>([]);

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

		const rows = days.flatMap((day) => day.rows);
		const selectedItemId = selectedItem?.id;
		const selectedRowIndex = selectedItem ? rows.findIndex((row) => row.items.includes(selectedItem)) : -1;
		const selectedLineIndex =
			selectedItem && selectedRowIndex !== -1 ? getTapeLineIndex(rows[selectedRowIndex], selectedItem) : -1;
		const counts = {
			parrot: items.filter((item) => item.kind === 'parrot').length,
			mimic: items.filter((item) => item.kind === 'mimic').length,
			emergency: items.filter((item) => item.kind === 'emergency').length,
		};

		const openedRowIndexRef = useRef(selectedRowIndex);
		const openedLineIndexRef = useRef(selectedLineIndex);

		/** 버튼으로 옮긴 알약이나 패널이 가려지면 스크롤 */
		useEffect(() => {
			const openedRowIndex = openedRowIndexRef.current;
			const openedLineIndex = openedLineIndexRef.current;

			openedRowIndexRef.current = selectedRowIndex;
			openedLineIndexRef.current = selectedLineIndex;

			if (selectedBy !== 'key' || selectedRowIndex === -1) {
				return;
			}

			runOnUI((rowIndex: number, lineIndex: number, previousRowIndex: number, previousLineIndex: number) => {
				'worklet';

				const row = rowLayouts.get()[rowIndex];
				const line = lineLayouts.get()[rowIndex]?.[lineIndex];

				if (!row || !line) {
					return;
				}

				const previousRow = rowLayouts.get()[previousRowIndex];
				const previousLine = lineLayouts.get()[previousRowIndex]?.[previousLineIndex];
				const lineY = row.y + line.y;

				// 새 패널은 이전 패널과 높이가 같다고 봄
				const panelHeight = previousRow?.panelHeight ?? 0;

				// 위쪽 패널이 접히는 만큼 줄이 올라감
				const collapse =
					previousRow && previousLine && previousRow.y + previousLine.y < lineY ? panelHeight : 0;
				const top = logY.get() + lineY - collapse;
				const coveredHeight =
					PINNED_BAND_HEIGHT + stripLayout.get().height + (dayBreakLayouts.get().at(0)?.height ?? 0);
				const visibleTop = scrollY.get() + coveredHeight;
				const visibleBottom = scrollY.get() + viewportHeight.get();

				if (top >= visibleTop && top + line.height + panelHeight <= visibleBottom) {
					return;
				}

				scrollTo(scrollRef, 0, Math.max(top - coveredHeight, 0), !reducedMotion);
			})(selectedRowIndex, selectedLineIndex, openedRowIndex, openedLineIndex);
		}, [
			dayBreakLayouts,
			lineLayouts,
			logY,
			reducedMotion,
			rowLayouts,
			scrollRef,
			scrollY,
			selectedBy,
			selectedItemId,
			selectedLineIndex,
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
				<View style={styles.titleRow}>
					<Copy accessibilityRole="header" style={styles.title}>
						{t('report.detail.tapeLog')}
					</Copy>
					{session.judgment.status === 'pending' && <Tag label={t('report.judging')} variant="primary" />}
				</View>

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

				<TapeLogHeader lanes={lanes} counts={counts} />

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

						{day.rows.map((row) => {
							const rowIndex = rows.indexOf(row);

							return (
								<TapeLogRow
									key={row.start}
									row={row}
									index={rowIndex}
									lanes={lanes}
									selectedItem={rowIndex === selectedRowIndex ? selectedItem : null}
									pressedItemHeld={selectedBy === 'item' && selectedRowIndex >= rowIndex}
									playing={playing}
									wordName={wordName}
									scrollRef={scrollRef}
									scrollY={scrollY}
									viewportHeight={viewportHeight}
									logY={logY}
									rowLayouts={rowLayouts}
									lineLayouts={lineLayouts}
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
	titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 },
	title: { fontFamily: font.black, fontSize: 18, lineHeight: 24 },
});

export default TapeLog;
