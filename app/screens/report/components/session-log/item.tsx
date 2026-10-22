import { memo } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';

import { SECOND } from '@/config/units';
import SessionLogMediaPanel from '@/screens/report/components/session-log/media-panel';
import SessionLogSoundPanel from '@/screens/report/components/session-log/sound-panel';
import { colors } from '@/theme';
import { sessionDetailColors } from '@/theme/session-detail-colors';
import { joinLabel } from '@/utils/a11y';
import type { LogItem } from '@/utils/session-log';

import SessionLogItemHead, { LOG_ITEM_LINES_INSET, logItemMediaTypes } from '@/components/session/log-item-head';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const TIME_FORMAT = 'HH:mm:ss';
const PERCENT = 100;
const SIDE_PADDING = 14;

interface Props {
	item: LogItem;
	open: boolean;
	dividerShown: boolean;
	sleeping: boolean;
	sessionId: string;
	judgmentPending: boolean;
	wordName: string;
	onToggle: (item: LogItem) => void;
}

/**
 * 눌러서 펼치는 기록 행 컴포넌트
 * @param item 기록
 * @param open 펼쳤는지 여부
 * @param dividerShown 위쪽 구분선을 보일지 여부
 * @param sleeping 수면 구간의 기록인지 여부
 * @param sessionId 세션 ID
 * @param judgmentPending 세션을 분석하는 중인지 여부
 * @param wordName 세션에서 학습한 단어
 * @param onToggle 누르면 실행할 함수
 */
const SessionLogItem = memo(
	({ item, open, dividerShown, sleeping, sessionId, judgmentPending, wordName, onToggle }: Props) => {
		const { t } = useTranslation();

		const mediaType = logItemMediaTypes[item.kind];
		const name = item.kind === 'mimic' ? wordName : t(`report.detail.kinds.${item.kind}`);
		const startTime = dayjs(item.startedAt).format(TIME_FORMAT);
		const rangeShown = item.kind === 'distressCall' || item.kind === 'parrotDisappeared';
		let value: string | null = null;
		let time = startTime;

		if (item.score !== null) {
			value = t('report.detail.percent', { value: Math.round(item.score * PERCENT) });
		} else if (judgmentPending && (item.kind === 'parrot' || item.kind === 'mimic')) {
			value = t('report.judging');
		} else if (item.kind === 'distressCall' && item.durationMs !== null) {
			value = t('common.duration.seconds', { value: Math.round(item.durationMs / SECOND) });
		}

		if (rangeShown) {
			time = item.endedAt
				? t('report.detail.timeRange', { start: startTime, end: dayjs(item.endedAt).format(TIME_FORMAT) })
				: t('report.detail.timeFrom', { start: startTime });
		}

		const openFace = sleeping ? colors.surface : sessionDetailColors.openFace;
		const mediaTypeName = t(`report.detail.mediaTypes.${mediaType}`);
		const itemName = joinLabel(name, time);

		return (
			<View style={[styles.item, open && { backgroundColor: openFace }]}>
				<PressableSurface
					accessibilityLabel={joinLabel(name, value, time, mediaTypeName)}
					accessibilityState={{ expanded: open }}
					onPress={() => onToggle(item)}
					variant="plain"
					depth="none"
					cornerRadius="none"
					contentStyle={styles.face}
				>
					<SessionLogItemHead
						kind={item.kind}
						name={name}
						value={value}
						time={time}
						open={open}
						dividerShown={dividerShown}
					/>
				</PressableSurface>

				{open && (
					<View style={styles.panel}>
						{mediaType === 'audio' ? (
							<SessionLogSoundPanel item={item} itemName={itemName} sessionId={sessionId} />
						) : (
							<SessionLogMediaPanel item={item} itemName={itemName} mediaType={mediaType} />
						)}
					</View>
				)}
			</View>
		);
	},
);

const styles = StyleSheet.create({
	item: { paddingHorizontal: SIDE_PADDING },
	face: { borderWidth: 0 },
	panel: { paddingLeft: LOG_ITEM_LINES_INSET },
});

export default SessionLogItem;
