import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { ChevronDownIcon } from 'lucide-react-native';

import { colors, font } from '@/theme';
import { sessionDetailColors } from '@/theme/session-detail-colors';
import type { LogItemKind } from '@/utils/session-log';

import SessionLogKindIcon from '@/components/session/log-kind-icon';
import { Copy } from '@/components/ui/copy';

export const LOG_ITEM_LINES_INSET = 48;

export const logItemMediaTypes: Record<LogItemKind, 'audio' | 'video' | 'image'> = {
	parrot: 'audio',
	mimic: 'audio',
	distressCall: 'audio',
	parrotDisappeared: 'video',
	parrotAppeared: 'image',
};

interface Props {
	kind: LogItemKind;
	name: string;
	value?: string | null;
	time: string;
	open: boolean;
	dividerShown: boolean;
}

/**
 * 기록 종류 및 시각 표시 컴포넌트
 * @param kind 기록 종류
 * @param name 기록 이름
 * @param value 이름 옆에 표시할 값
 * @param time 기록 시각
 * @param open 펼쳤는지 여부
 * @param dividerShown 위쪽 구분선 표시 여부
 */
const SessionLogItemHead = ({ kind, name, value, time, open, dividerShown }: Props) => {
	const { t } = useTranslation();

	return (
		<View style={styles.head}>
			{dividerShown && <View style={styles.divider} />}

			<SessionLogKindIcon kind={kind} />

			<View style={styles.lines}>
				<View style={styles.main}>
					<Copy numberOfLines={1} style={styles.name}>
						{name}
					</Copy>
					{value ? <Copy style={styles.value}>{value}</Copy> : null}
				</View>
				<Copy numberOfLines={1} style={styles.time}>
					{time}
				</Copy>
			</View>

			<View style={styles.tag}>
				<Copy numberOfLines={1} style={styles.tagText}>
					{t(`report.detail.mediaTypes.${logItemMediaTypes[kind]}`)}
				</Copy>
			</View>

			<View style={open && styles.chevronOpen}>
				<ChevronDownIcon size={20} color={colors.muted} />
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	head: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10 },
	divider: {
		position: 'absolute',
		top: 0,
		right: 0,
		left: LOG_ITEM_LINES_INSET,
		height: 1,
		backgroundColor: sessionDetailColors.divider,
	},
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
});

export default SessionLogItemHead;
