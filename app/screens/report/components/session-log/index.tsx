import { Fragment, useMemo } from 'react';

import { StyleSheet } from 'react-native';

import type { Session } from '@/types/apis/sessions';

import type { StickyLayout } from '@/types/session-log';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import SessionLogDayBreak from '@/screens/report/components/session-log/day-break';
import SessionLogRow from '@/screens/report/components/session-log/row';
import { getSleepSpans, getLogDays, type LogItem } from '@/screens/report/utils/session-log';
import { font } from '@/theme';
import { sessionEndedAt } from '@/utils/date';

import { Copy } from '@/components/ui/copy';

interface Props {
	session: Session;
	logItems: LogItem[];
	openItemId: string | null;
	wordName: string;
	scrollY: SharedValue<number>;
	viewportHeight: SharedValue<number>;
	logBottom: SharedValue<number>;
	onToggleItem: (item: LogItem) => void;
}

/**
 * 시간 단위 기록 컴포넌트
 * @param session 세션
 * @param logItems 시각순 기록 목록
 * @param openItemId 펼친 기록 ID
 * @param wordName 세션에서 학습한 단어
 * @param scrollY 화면 스크롤 위치
 * @param viewportHeight 화면 높이
 * @param logBottom 기록 아래쪽 끝 위치
 * @param onToggleItem 기록을 누르면 실행할 함수
 */
const SessionLog = ({
	session,
	logItems,
	openItemId,
	wordName,
	scrollY,
	viewportHeight,
	logBottom,
	onToggleItem,
}: Props) => {
	const { t } = useTranslation();

	const dayBreakLayouts = useSharedValue<StickyLayout[]>([]);

	const days = useMemo(() => {
		const sessionSpan = {
			start: dayjs(session.period.started_at).valueOf(),
			end: sessionEndedAt(session.period).valueOf(),
		};

		return getLogDays(sessionSpan, getSleepSpans(sessionSpan, session.schedule.sleep), logItems);
	}, [logItems, session.period, session.schedule.sleep]);

	const judgmentPending = session.judgment.status === 'pending';

	return (
		<>
			<Copy accessibilityRole="header" style={styles.title}>
				{t('report.detail.sessionLog')}
			</Copy>

			{days.map((day, dayIndex) => (
				<Fragment key={day.date}>
					<SessionLogDayBreak
						date={day.date}
						index={dayIndex}
						scrollY={scrollY}
						viewportHeight={viewportHeight}
						logBottom={logBottom}
						dayBreakLayouts={dayBreakLayouts}
					/>

					{day.logRows.map((row, rowIndexInDay) => (
						<SessionLogRow
							key={row.start}
							row={row}
							firstInDay={rowIndexInDay === 0}
							openItemId={row.logItems.some((item) => item.id === openItemId) ? openItemId : null}
							sessionId={session.id}
							judgmentPending={judgmentPending}
							wordName={wordName}
							onToggleItem={onToggleItem}
						/>
					))}
				</Fragment>
			))}
		</>
	);
};

const styles = StyleSheet.create({
	title: { marginTop: 32, marginBottom: 4, fontFamily: font.bold, fontSize: 18, lineHeight: 24 },
});

export default SessionLog;
