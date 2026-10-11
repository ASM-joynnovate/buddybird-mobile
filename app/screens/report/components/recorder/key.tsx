import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import type { LucideIcon } from 'lucide-react-native';
import Animated, { type AnimatedRef, type AnimatedStyle } from 'react-native-reanimated';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const variants = {
	main: { face: colors.text, edge: colors.textDark, icon: colors.onFilled, iconSize: 20 },
	side: { face: colors.background, edge: colors.orangeDark, icon: colors.text, iconSize: 22 },
};

interface Props {
	variant: keyof typeof variants;
	icon: LucideIcon;
	accessibilityLabel: string;
	onPress: () => void;
	disabled?: boolean;
	label?: string;
	labelRef?: AnimatedRef<Animated.View>;
	labelStyle?: StyleProp<AnimatedStyle<ViewStyle>>;
}

/**
 * 녹음기 버튼 컴포넌트
 * @param variant 가운데 재생 버튼인지 양옆 버튼인지
 * @param icon 버튼 아이콘
 * @param accessibilityLabel 스크린 리더가 읽을 이름
 * @param onPress 누르면 실행할 함수
 * @param disabled 비활성 여부
 * @param label 아이콘 옆 글자
 * @param labelRef 글자 폭을 잴 ref
 * @param labelStyle 글자가 접힐 때의 스타일
 */
const RecorderKey = ({
	variant,
	icon: Icon,
	accessibilityLabel,
	onPress,
	disabled = false,
	label,
	labelRef,
	labelStyle,
}: Props) => {
	const palette = variants[variant];
	const iconColor = disabled ? colors.subtle : palette.icon;

	return (
		<PressableSurface
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			onPress={onPress}
			disabled={disabled}
			depth="high"
			cornerRadius="control"
			faceColor={palette.face}
			edgeColor={palette.edge}
			style={styles.key}
			contentStyle={styles.face}
		>
			<Icon size={palette.iconSize} color={iconColor} fill={variant === 'main' ? iconColor : 'none'} />

			{label !== undefined && (
				<Animated.View ref={labelRef} style={[styles.labelContainer, labelStyle]}>
					<Copy numberOfLines={1} style={[styles.label, { color: iconColor }]}>
						{label}
					</Copy>
				</Animated.View>
			)}
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	key: { flex: 1 },
	face: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 0 },
	labelContainer: { flexShrink: 1, marginLeft: 8, overflow: 'hidden' },
	label: { fontFamily: font.extraBold, fontSize: 13 },
});

export default RecorderKey;
