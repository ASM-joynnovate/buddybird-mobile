import { Image, StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';
import { ChevronDownIcon, PlayIcon } from 'lucide-react-native';

import { SECOND } from '@/config/units';
import { colors, font, radius } from '@/theme';
import { sessionDetailColors } from '@/theme/session-detail-colors';
import type { LogItemKind } from '@/utils/session-log';

import SessionLogKindIcon from '@/components/session/log-kind-icon';
import { Copy } from '@/components/ui/copy';

const TIME_FORMAT = 'HH:mm:ss';
const PERCENT = 100;
const SIDE_PADDING = 14;
const LINES_INSET = 48;
const PLAY_SIZE = 36;

const mediaTypes: Record<LogItemKind, 'audio' | 'video' | 'image'> = {
	parrot: 'audio',
	mimic: 'audio',
	distressCall: 'audio',
	parrotDisappeared: 'video',
	parrotAppeared: 'image',
};

export interface PreviewSound {
	progress: number;
	durationMs: number;
}

export interface PreviewItem {
	kind: LogItemKind;
	startedAt: string;
	endedAt?: string;
	score?: number;
	durationMs?: number;
	sound?: PreviewSound;
	photo?: number;
}

interface Props {
	item: PreviewItem;
	dividerShown: boolean;
	wordName: string;
}

/**
 * 리포트 학습 상세의 기록 행과 같은 모양으로 예시 기록을 보이는 컴포넌트
 * @param item 예시 기록. sound나 photo가 있으면 펼친 상태로 보인다
 * @param dividerShown 위쪽 구분선을 보일지 여부
 * @param wordName 가르친 단어
 */
const SessionPreviewItem = ({ item, dividerShown, wordName }: Props) => {
	const { t } = useTranslation();

	const open = item.sound !== undefined || item.photo !== undefined;
	const name = item.kind === 'mimic' ? wordName : t(`report.detail.kinds.${item.kind}`);
	const startTime = dayjs(item.startedAt).format(TIME_FORMAT);
	const accent = item.kind === 'distressCall' ? colors.error : colors.orange;
	let value: string | null = null;
	let time = startTime;

	if (item.score !== undefined) {
		value = t('report.detail.percent', { value: Math.round(item.score * PERCENT) });
	} else if (item.durationMs !== undefined) {
		value = t('common.duration.seconds', { value: Math.round(item.durationMs / SECOND) });
	}

	if (item.endedAt) {
		time = t('report.detail.timeRange', { start: startTime, end: dayjs(item.endedAt).format(TIME_FORMAT) });
	}

	return (
		<View style={[styles.item, open && styles.openItem]}>
			{dividerShown && <View style={styles.divider} />}

			<View style={styles.head}>
				<SessionLogKindIcon kind={item.kind} />

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

				<View style={styles.tag}>
					<Copy numberOfLines={1} style={styles.tagText}>
						{t(`report.detail.mediaTypes.${mediaTypes[item.kind]}`)}
					</Copy>
				</View>

				<View style={open && styles.chevronOpen}>
					<ChevronDownIcon size={20} color={colors.muted} />
				</View>
			</View>

			{item.sound && (
				<View style={styles.panel}>
					<View style={styles.player}>
						<View style={styles.track}>
							<View style={styles.wave}>
								<View
									style={[
										styles.waveFill,
										{ width: `${item.sound.progress * PERCENT}%`, backgroundColor: accent },
									]}
								/>
							</View>
							<View style={styles.ends}>
								<Copy style={styles.end}>{t('common.duration.seconds', { value: 0 })}</Copy>
								<Copy style={styles.end}>
									{t('common.duration.seconds', {
										value: (item.sound.durationMs / SECOND).toFixed(1),
									})}
								</Copy>
							</View>
						</View>

						<View style={[styles.play, { backgroundColor: accent }]}>
							<PlayIcon size={13} color={colors.onFilled} fill={colors.onFilled} />
						</View>
					</View>
				</View>
			)}

			{item.photo !== undefined && (
				<View style={styles.panel}>
					<View style={styles.media}>
						<Image accessibilityIgnoresInvertColors source={item.photo} style={styles.mediaImage} />
					</View>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	item: { paddingHorizontal: SIDE_PADDING },
	openItem: { backgroundColor: sessionDetailColors.openFace },
	divider: {
		position: 'absolute',
		top: 0,
		right: SIDE_PADDING,
		left: SIDE_PADDING + LINES_INSET,
		height: 1,
		backgroundColor: sessionDetailColors.divider,
	},
	head: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
	lines: { flex: 1, minWidth: 0, gap: 2, marginLeft: 4 },
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
	tag: {
		flexShrink: 0,
		paddingVertical: 3,
		paddingHorizontal: 8,
		borderRadius: 8,
		backgroundColor: sessionDetailColors.track,
	},
	tagText: { fontFamily: font.semiBold, fontSize: 13, lineHeight: 18 },
	chevronOpen: { transform: [{ rotate: '180deg' }] },
	panel: { paddingLeft: LINES_INSET, paddingBottom: 18 },
	player: { flexDirection: 'row', alignItems: 'center', gap: 24 },
	track: { flex: 1, minWidth: 0 },
	wave: { height: 6, overflow: 'hidden', borderRadius: 3, backgroundColor: sessionDetailColors.track },
	waveFill: { height: '100%', borderRadius: 3 },
	ends: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
	end: {
		fontFamily: font.medium,
		fontSize: 12,
		lineHeight: 16,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
	play: {
		width: PLAY_SIZE,
		height: PLAY_SIZE,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: radius.pill,
	},
	media: { width: '100%', aspectRatio: 16 / 9, marginTop: 10, overflow: 'hidden', borderRadius: 14 },
	mediaImage: { width: '100%', height: '100%' },
});

export default SessionPreviewItem;
