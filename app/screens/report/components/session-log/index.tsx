import { type ComponentType, Fragment, useMemo } from 'react';

import { StyleSheet, View } from 'react-native';

import type { Session } from '@/types/apis/sessions';

import type { LogFilter, StickyLayout } from '@/types/session-log';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';
import type { SvgProps } from 'react-native-svg';

import SessionLogDayBreak from '@/screens/report/components/session-log/day-break';
import SessionLogFilter from '@/screens/report/components/session-log/filter';
import SessionLogRow from '@/screens/report/components/session-log/row';
import { getSleepSpans, getLogDays, type LogItem, mergeEmptyLogRows } from '@/screens/report/utils/session-log';
import { colors, font } from '@/theme';
import { sessionEndedAt } from '@/utils/date';

import { Copy } from '@/components/ui/copy';
import { EmptyState } from '@/components/ui/empty-state';

import AlertEmptyIcon from '@assets/images/icons/report/empty/alert.svg';
import MimicEmptyIcon from '@assets/images/icons/report/empty/mimic.svg';
import SoundEmptyIcon from '@assets/images/icons/report/empty/sound.svg';

const EMPTY_ICON_SIZE = 72;

const emptyIcons: Record<Exclude<LogFilter, 'all'>, ComponentType<SvgProps>> = {
	sound: SoundEmptyIcon,
	word: MimicEmptyIcon,
	emergency: AlertEmptyIcon,
};

interface Props {
	session: Session;
	logItems: LogItem[];
	logFilter: LogFilter;
	openItemId: string | null;
	wordName: string;
	scrollY: SharedValue<number>;
	viewportHeight: SharedValue<number>;
	logBottom: SharedValue<number>;
	onSelectFilter: (logFilter: LogFilter) => void;
	onToggleItem: (logItem: LogItem) => void;
}

/**
 * 시간 단위 기록 컴포넌트
 * @param session 세션
 * @param logItems 시각순 기록 목록
 * @param logFilter 선택한 필터
 * @param openItemId 펼친 기록 ID
 * @param wordName 세션에서 학습한 단어
 * @param scrollY 화면 스크롤 위치
 * @param viewportHeight 화면 높이
 * @param logBottom 기록 아래쪽 끝 위치
 * @param onSelectFilter 필터를 누르면 실행할 함수
 * @param onToggleItem 기록을 누르면 실행할 함수
 */
const SessionLog = ({
	session,
	logItems,
	logFilter,
	openItemId,
	wordName,
	scrollY,
	viewportHeight,
	logBottom,
	onSelectFilter,
	onToggleItem,
}: Props) => {
	const { t } = useTranslation();

	const dayBreakLayouts = useSharedValue<StickyLayout[]>([]);
	const filterLayout = useSharedValue<StickyLayout>({ y: 0, height: 0 });

	const days = useMemo(() => {
		const sessionSpan = {
			start: dayjs(session.period.started_at).valueOf(),
			end: sessionEndedAt(session.period).valueOf(),
		};
		const logDays = getLogDays(sessionSpan, getSleepSpans(sessionSpan, session.schedule.sleep), logItems);

		// 필터를 선택하면 기록 없는 시간을 한 줄로 표시
		return logFilter === 'all'
			? logDays
			: logDays.map((day) => ({ ...day, logRows: mergeEmptyLogRows(day.logRows) }));
	}, [logFilter, logItems, session.period, session.schedule.sleep]);

	const judgmentPending = session.judgment.status === 'pending';
	const filterShown = logFilter !== 'all' || logItems.length > 0;
	const EmptyIcon = logFilter === 'all' ? null : emptyIcons[logFilter];
	const emptyMessage =
		logFilter === 'all'
			? t('report.detail.empty')
			: t(`report.detail.filterEmpty.${logFilter}`, { word: wordName });

	return (
		<>
			<Copy accessibilityRole="header" style={styles.title}>
				{t('report.detail.sessionLog')}
			</Copy>
			<View style={styles.divider} />

			{filterShown && (
				<SessionLogFilter
					selectedFilter={logFilter}
					wordName={wordName}
					scrollY={scrollY}
					logBottom={logBottom}
					filterLayout={filterLayout}
					onSelect={onSelectFilter}
				/>
			)}

			{logItems.length === 0 ? (
				<EmptyState
					message={emptyMessage}
					illustration={EmptyIcon && <EmptyIcon width={EMPTY_ICON_SIZE} height={EMPTY_ICON_SIZE} />}
				/>
			) : (
				days.map((day, dayIndex) => (
					<Fragment key={day.date}>
						<SessionLogDayBreak
							date={day.date}
							dayIndex={dayIndex}
							scrollY={scrollY}
							viewportHeight={viewportHeight}
							logBottom={logBottom}
							dayBreakLayouts={dayBreakLayouts}
							filterLayout={filterLayout}
						/>

						{day.logRows.map((logRow, rowIndexInDay) => (
							<SessionLogRow
								key={logRow.start}
								logRow={logRow}
								isFirstInDay={rowIndexInDay === 0}
								openItemId={
									logRow.logItems.some((logItem) => logItem.id === openItemId) ? openItemId : null
								}
								sessionId={session.id}
								judgmentPending={judgmentPending}
								wordName={wordName}
								onToggleItem={onToggleItem}
							/>
						))}
					</Fragment>
				))
			)}
		</>
	);
};

const styles = StyleSheet.create({
	title: { marginTop: 32, marginBottom: 16, fontFamily: font.bold, fontSize: 18, lineHeight: 24 },
	divider: { height: 2, marginHorizontal: -24, backgroundColor: colors.border },
});

export default SessionLog;
