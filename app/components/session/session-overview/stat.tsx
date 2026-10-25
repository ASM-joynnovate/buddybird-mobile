import type { ComponentType } from 'react';

import { StyleSheet, View } from 'react-native';

import type { SvgProps } from 'react-native-svg';

import { colors, font } from '@/theme';
import { sessionDetailColors } from '@/theme/session-detail-colors';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';

const ICON_SIZE = 36;

interface Props {
	icon: ComponentType<SvgProps>;
	value: string;
	label: string;
}

/**
 * 요약 칸 컴포넌트
 * @param icon 아이콘
 * @param value 값
 * @param label 이름
 */
const SessionOverviewStat = ({ icon: Icon, value, label }: Props) => {
	return (
		<View accessible accessibilityLabel={joinLabel(label, value)} style={styles.stat}>
			<Icon width={ICON_SIZE} height={ICON_SIZE} />
			<View style={styles.statText}>
				<Copy numberOfLines={1} style={styles.value}>
					{value}
				</Copy>
				<Copy numberOfLines={1} style={styles.label}>
					{label}
				</Copy>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	stat: {
		flexBasis: '40%',
		flexGrow: 1,
		minWidth: 0,
		minHeight: 72,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		paddingVertical: 12,
		paddingRight: 14,
		paddingLeft: 10,
		borderRadius: 16,
		backgroundColor: sessionDetailColors.face,
	},
	statText: { flex: 1, minWidth: 0 },
	value: { fontFamily: font.extraBold, fontSize: 18, lineHeight: 24, fontVariant: ['tabular-nums'] },
	label: { fontFamily: font.medium, fontSize: 13, lineHeight: 18, color: colors.muted },
});

export default SessionOverviewStat;
