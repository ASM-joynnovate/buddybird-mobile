import { memo } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import { ChevronDownIcon } from 'lucide-react-native';

import { SECOND } from '@/config/units';
import { sessionDetailColors, logItemColors } from '@/screens/report/components/session-detail-colors';
import SessionLogMediaPanel from '@/screens/report/components/session-log/media-panel';
import SessionLogSoundPanel from '@/screens/report/components/session-log/sound-panel';
import { colors, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';
import type { LogItem, LogItemKind } from '@/utils/session-log';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const TIME_FORMAT = 'HH:mm:ss';
const PERCENT = 100;
const SIDE_PADDING = 14;

const mediaTypes: Record<LogItemKind, 'audio' | 'video' | 'image'> = {
	parrot: 'audio',
	mimic: 'audio',
	emergency: 'audio',
	parrotDisappeared: 'video',
	parrotAppeared: 'image',
};

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

		const palette = logItemColors[item.kind];
		const mediaType = mediaTypes[item.kind];
		const name = item.kind === 'mimic' ? wordName : t(`report.detail.kinds.${item.kind}`);
		const startTime = dayjs(item.startedAt).format(TIME_FORMAT);
		const rangeShown = item.kind === 'emergency' || item.kind === 'parrotDisappeared';
		let value: string | null = null;
		let time = startTime;

		if (item.score !== null) {
			value = t('report.detail.percent', { value: Math.round(item.score * PERCENT) });
		} else if (judgmentPending && (item.kind === 'parrot' || item.kind === 'mimic')) {
			value = t('report.judging');
		} else if (item.kind === 'emergency' && item.durationMs !== null) {
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
				{dividerShown && <View style={styles.divider} />}

				<PressableSurface
					accessibilityLabel={joinLabel(name, value, time, mediaTypeName)}
					accessibilityState={{ expanded: open }}
					onPress={() => onToggle(item)}
					variant="plain"
					depth="none"
					cornerRadius="none"
					contentStyle={styles.head}
				>
					<View style={styles.lines}>
						<View style={styles.main}>
							<Copy numberOfLines={1} style={styles.name}>
								{name}
							</Copy>
							{value !== null && <Copy style={styles.value}>{value}</Copy>}
						</View>
						<Copy numberOfLines={1} style={styles.time}>
							{time}
						</Copy>
					</View>

					<View style={[styles.tag, { backgroundColor: palette.tagFace }]}>
						<Copy numberOfLines={1} style={[styles.tagText, { color: palette.tagText }]}>
							{mediaTypeName}
						</Copy>
					</View>

					<ChevronDownIcon size={20} color={colors.muted} style={open && styles.chevronOpen} />
				</PressableSurface>

				{open &&
					(mediaType === 'audio' ? (
						<SessionLogSoundPanel item={item} itemName={itemName} sessionId={sessionId} />
					) : (
						<SessionLogMediaPanel item={item} itemName={itemName} mediaType={mediaType} />
					))}
			</View>
		);
	},
);

const styles = StyleSheet.create({
	item: { paddingHorizontal: SIDE_PADDING },
	divider: {
		position: 'absolute',
		top: 0,
		right: SIDE_PADDING,
		left: SIDE_PADDING,
		height: 1,
		backgroundColor: sessionDetailColors.divider,
	},
	head: {
		minHeight: 64,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingVertical: 10,
		borderWidth: 0,
	},
	lines: { flex: 1, minWidth: 0, gap: 2 },
	main: { flexDirection: 'row', alignItems: 'baseline', gap: 6, minWidth: 0 },
	name: { flexShrink: 1, fontFamily: font.bold, fontSize: 13, lineHeight: 20, color: colors.muted },
	value: { fontFamily: font.bold, fontSize: 16, lineHeight: 22, fontVariant: ['tabular-nums'] },
	time: {
		fontFamily: font.medium,
		fontSize: 13,
		lineHeight: 18,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
	tag: { flexShrink: 0, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
	tagText: { fontFamily: font.semiBold, fontSize: 13, lineHeight: 18 },
	chevronOpen: { transform: [{ rotate: '180deg' }] },
});

export default SessionLogItem;
