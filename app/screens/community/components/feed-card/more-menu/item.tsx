import { StyleSheet } from 'react-native';

import type { LucideIcon } from 'lucide-react-native';

import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

interface Props {
	icon: LucideIcon;
	label: string;
	actionDestructive?: boolean;
	firstInGroup?: boolean;
	onPress: () => void;
}

/**
 * 더보기 메뉴 항목 컴포넌트
 * @param icon 항목 아이콘
 * @param label 항목 이름
 * @param actionDestructive 위험한 동작인지 여부
 * @param firstInGroup 첫 항목인지 여부
 * @param onPress 누르면 실행할 함수
 */
const FeedCardMoreMenuItem = ({
	icon: Icon,
	label,
	actionDestructive = false,
	firstInGroup = false,
	onPress,
}: Props) => {
	return (
		<PressableSurface
			accessibilityRole="menuitem"
			accessibilityLabel={label}
			onPress={onPress}
			variant="plain"
			depth="none"
			cornerRadius="small"
			style={!firstInGroup && styles.divider}
			contentStyle={styles.menuItem}
		>
			<Icon size={17} color={actionDestructive ? colors.error : colors.muted} />
			<Copy style={[styles.menuLabel, actionDestructive && styles.menuLabelDanger]}>{label}</Copy>
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	menuItem: {
		minHeight: 40,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 10,
		borderWidth: 0,
		borderRadius: radius.small,
	},
	divider: { borderTopWidth: 2, borderTopColor: colors.surface },
	menuLabel: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 14 },
	menuLabelDanger: { color: colors.error },
});

export default FeedCardMoreMenuItem;
