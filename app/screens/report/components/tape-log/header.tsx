import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { soundKindColors } from '@/screens/report/components/sound-kind-colors';
import SoundKindIcon from '@/screens/report/components/sound-kind-icon';
import { colors, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';
import type { SoundKind } from '@/utils/tape-log';

import { Copy } from '@/components/ui/copy';

interface Props {
	lanes: SoundKind[];
	counts: Record<SoundKind, number>;
}

/**
 * 종류별 알약 개수 컴포넌트
 * @param lanes 보여 줄 소리 종류 칸
 * @param counts 종류별 알약 개수
 */
const TapeLogHeader = ({ lanes, counts }: Props) => {
	const { t } = useTranslation();

	return (
		<View style={styles.row}>
			<View style={styles.whenSpace} />

			{lanes.map((kind) => {
				const count = counts[kind];
				const name = t(`report.detail.kinds.${kind}`);

				return (
					<View
						key={kind}
						accessible
						accessibilityLabel={joinLabel(name, String(count))}
						style={[styles.head, { backgroundColor: soundKindColors[kind].lane }]}
					>
						<View style={styles.icon}>
							<SoundKindIcon kind={kind} size="medium" muted={count === 0} />
						</View>
						<Copy
							style={[styles.count, { color: count === 0 ? colors.subtle : soundKindColors[kind].edge }]}
						>
							{count}
						</Copy>
						<Copy numberOfLines={1} style={styles.name}>
							{name}
						</Copy>
					</View>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	row: { flexDirection: 'row', gap: 6, marginBottom: 4 },
	whenSpace: { width: 44 },
	head: {
		flex: 1,
		minWidth: 0,
		alignItems: 'center',
		gap: 2,
		paddingTop: 8,
		paddingHorizontal: 4,
		paddingBottom: 7,
		borderTopLeftRadius: 14,
		borderTopRightRadius: 14,
		borderBottomRightRadius: 6,
		borderBottomLeftRadius: 6,
	},
	icon: { marginBottom: 2 },
	count: { fontFamily: font.black, fontSize: 18, lineHeight: 22, fontVariant: ['tabular-nums'] },
	name: { fontFamily: font.extraBold, fontSize: 12, lineHeight: 15, color: colors.muted },
});

export default TapeLogHeader;
