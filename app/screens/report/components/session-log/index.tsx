import { Fragment, memo, useMemo } from 'react';

import { StyleSheet, View } from 'react-native';

import type { Session } from '@/types/apis/sessions';

import { useTranslation } from 'react-i18next';

import { type SharedValue, useSharedValue } from 'react-native-reanimated';

import SessionLogDayBreak, { type StickyLayout } from '@/screens/report/components/session-log/day-break';
import SessionLogRow from '@/screens/report/components/session-log/row';
import { font } from '@/theme';
import { sessionEndedAt } from '@/utils/date';
import { getSleepSpans, getLogDays, type LogItem } from '@/utils/session-log';

import { Copy } from '@/components/ui/copy';

interface Props {
	session: Session;
	items: LogItem[];
	openItemId: string | null;
	wordName: string;
	scrollY: SharedValue<number>;
	viewportHeight: SharedValue<number>;
	onToggleItem: (item: LogItem) => void;
}

/**
 * 한 시간 단위로 기록을 보이는 컴포넌트
 * @param session 세션
 * @param items 시각순 기록 목록
 * @param openItemId 펼친 기록 ID
 * @param wordName 세션에서 학습한 단어
 * @param scrollY 화면 스크롤 위치
 * @param viewportHeight 화면 높이
 * @param onToggleItem 기록을 누르면 실행할 함수
 */
const SessionLog = memo(({ session, items, openItemId, wordName, scrollY, viewportHeight, onToggleItem }: Props) => {
	const { t } = useTranslation();

	const logY = useSharedValue(0);
	const logHeight = useSharedValue(0);
	const dayBreakLayouts = useSharedValue<StickyLayout[]>([]);

	const days = useMemo(() => {
		const sessionSpan = {
			start: Date.parse(session.period.started_at),
			end: sessionEndedAt(session.period).valueOf(),
		};

		return getLogDays(sessionSpan, getSleepSpans(sessionSpan, session.schedule.sleep), items);
	}, [items, session.period, session.schedule.sleep]);

	const judgmentPending = session.judgment.status === 'pending';

	return (
		<View
			style={styles.container}
			onLayout={(event) => {
				logY.set(event.nativeEvent.layout.y);
				logHeight.set(event.nativeEvent.layout.height);
			}}
		>
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
						logY={logY}
						logHeight={logHeight}
						dayBreakLayouts={dayBreakLayouts}
					/>

					{day.rows.map((row, rowIndexInDay) => (
						<SessionLogRow
							key={row.start}
							row={row}
							firstInDay={rowIndexInDay === 0}
							openItemId={row.items.some((item) => item.id === openItemId) ? openItemId : null}
							sessionId={session.id}
							judgmentPending={judgmentPending}
							wordName={wordName}
							onToggleItem={onToggleItem}
						/>
					))}
				</Fragment>
			))}
		</View>
	);
});

const styles = StyleSheet.create({
	container: { marginTop: 32 },
	title: { marginBottom: 4, fontFamily: font.bold, fontSize: 18, lineHeight: 24 },
});

export default SessionLog;
