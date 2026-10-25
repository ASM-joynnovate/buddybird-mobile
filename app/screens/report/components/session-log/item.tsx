import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';

import { PERCENT, SECOND } from '@/config/units';
import SessionLogMediaPanel from '@/screens/report/components/session-log/media-panel';
import SessionLogSoundPanel from '@/screens/report/components/session-log/sound-panel';
import type { LogItem } from '@/screens/report/utils/session-log';
import { colors } from '@/theme';
import { sessionDetailColors } from '@/theme/session-detail-colors';
import { joinLabel } from '@/utils/a11y';

import SessionLogItemHead, {
	LOG_ITEM_LINES_INSET,
	logItemMediaTypes,
} from '@/components/session/session-log-item-head';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const TIME_FORMAT = 'HH:mm:ss';
const SIDE_PADDING = 14;

interface Props {
	logItem: LogItem;
	open: boolean;
	dividerShown: boolean;
	isDuringSleep: boolean;
	sessionId: string;
	judgmentPending: boolean;
	wordName: string;
	onToggle: (logItem: LogItem) => void;
}

/**
 * 눌러서 펼치는 기록 행 컴포넌트
 * @param logItem 기록
 * @param open 펼쳤는지 여부
 * @param dividerShown 위쪽 구분선 표시 여부
 * @param isDuringSleep 수면 구간의 기록인지 여부
 * @param sessionId 세션 ID
 * @param judgmentPending 세션을 분석하는 중인지 여부
 * @param wordName 세션에서 학습한 단어
 * @param onToggle 누르면 실행할 함수
 */
const SessionLogItem = ({
	logItem,
	open,
	dividerShown,
	isDuringSleep,
	sessionId,
	judgmentPending,
	wordName,
	onToggle,
}: Props) => {
	const { t } = useTranslation();

	const mediaType = logItemMediaTypes[logItem.kind];
	const name = logItem.kind === 'mimic' ? wordName : t(`report.detail.kinds.${logItem.kind}`);
	const startTime = dayjs(logItem.startedAt).format(TIME_FORMAT);
	const rangeShown = logItem.kind === 'distressCall' || logItem.kind === 'parrotDisappeared';
	let statusText: string | null = null;
	let time = startTime;

	if (logItem.score !== null) {
		statusText = t('report.detail.percent', { value: Math.round(logItem.score * PERCENT) });
	} else if (judgmentPending && (logItem.kind === 'parrot' || logItem.kind === 'mimic')) {
		statusText = t('report.judging');
	} else if (logItem.kind === 'distressCall' && logItem.durationMs !== null) {
		statusText = t('common.duration.seconds', { value: Math.round(logItem.durationMs / SECOND) });
	}

	if (rangeShown) {
		time = logItem.endedAt
			? t('report.detail.timeRange', { start: startTime, end: dayjs(logItem.endedAt).format(TIME_FORMAT) })
			: t('report.detail.timeFrom', { start: startTime });
	}

	const openFace = isDuringSleep ? colors.surface : sessionDetailColors.openFace;
	const mediaTypeName = t(`report.detail.mediaTypes.${mediaType}`);
	const itemLabel = joinLabel(name, time);

	return (
		<View style={[styles.container, open && { backgroundColor: openFace }]}>
			<PressableSurface
				accessibilityLabel={joinLabel(name, statusText, time, mediaTypeName)}
				accessibilityState={{ expanded: open }}
				onPress={() => onToggle(logItem)}
				variant="plain"
				depth="none"
				cornerRadius="none"
				contentStyle={styles.face}
			>
				<SessionLogItemHead
					kind={logItem.kind}
					name={name}
					value={statusText}
					time={time}
					open={open}
					dividerShown={dividerShown}
				/>
			</PressableSurface>

			{open && (
				<View style={mediaType === 'audio' && styles.panel}>
					{mediaType === 'audio' ? (
						<SessionLogSoundPanel logItem={logItem} itemLabel={itemLabel} sessionId={sessionId} />
					) : (
						<SessionLogMediaPanel
							logItem={logItem}
							itemLabel={itemLabel}
							mediaType={mediaType}
							sessionId={sessionId}
						/>
					)}
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { paddingHorizontal: SIDE_PADDING },
	face: { borderWidth: 0 },
	panel: { paddingLeft: LOG_ITEM_LINES_INSET },
});

export default SessionLogItem;
