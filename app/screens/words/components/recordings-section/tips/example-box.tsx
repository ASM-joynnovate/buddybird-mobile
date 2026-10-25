import type { ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import type { LucideIcon } from 'lucide-react-native';

import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

interface Props {
	icon: LucideIcon;
	label: string;
	backgroundColor: string;
	children: ReactNode;
}

/**
 * 좋은 예 또는 나쁜 예 상자 컴포넌트
 * @param icon 라벨 아이콘
 * @param label 상자 라벨
 * @param backgroundColor 상자 면 색
 * @param children 상자 안 예시 항목
 */
const RecordingsSectionTipsExampleBox = ({ icon: Icon, label, backgroundColor, children }: Props) => {
	return (
		<View style={[ui.equalColumn, styles.exampleBox, { backgroundColor }]}>
			<View style={styles.labelRow}>
				<Icon size={14} color={colors.onFilled} strokeWidth={3} />
				<Copy style={styles.label}>{label}</Copy>
			</View>

			{children}
		</View>
	);
};

const styles = StyleSheet.create({
	exampleBox: {
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: radius.control,
		borderCurve: 'continuous',
	},
	labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
	label: { fontFamily: font.extraBold, fontSize: 12.5, color: colors.onFilled },
});

export default RecordingsSectionTipsExampleBox;
