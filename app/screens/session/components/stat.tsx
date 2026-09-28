import { StyleSheet, View } from 'react-native';

import { colors, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';

interface Props {
	label: string;
	value: string;
	size?: 'small' | 'large';
}

/**
 * 항목 이름과 값을 한 줄로 보여 주는 컴포넌트
 * @param label 항목 이름
 * @param value 항목 값
 * @param size 글자 크기, large면 이름과 값을 줄 양 끝에 둠
 */
const Stat = ({ label, value, size = 'small' }: Props) => {
	if (size === 'large') {
		return (
			<View style={styles.container} accessible accessibilityLabel={joinLabel(label, value)}>
				{/*왼쪽 끝의 항목 이름*/}
				<Copy style={styles.largeLabel}>{label}</Copy>

				{/*오른쪽 끝의 항목 값*/}
				<Copy style={styles.largeValue}>{value}</Copy>
			</View>
		);
	}

	return (
		<Copy style={styles.smallLabel}>
			{label} <Copy style={styles.smallValue}>{value}</Copy>
		</Copy>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'baseline',
		justifyContent: 'space-between',
		gap: 12,
	},
	largeLabel: { fontFamily: font.extraBold, fontSize: 15, color: colors.muted },
	largeValue: { flexShrink: 1, fontFamily: font.black, fontSize: 22, color: colors.text },
	smallLabel: { fontFamily: font.extraBold, fontSize: 13, color: colors.muted },
	smallValue: {
		fontFamily: font.black,
		fontSize: 14,
		color: colors.text,
		fontVariant: ['tabular-nums'],
	},
});

export default Stat;
