import type { ComponentType } from 'react';

import { type LayoutChangeEvent, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import type { LucideProps } from 'lucide-react-native';
import Animated from 'react-native-reanimated';

import { colors, font, radius } from '@/theme';

import { popIn } from '@/components/scene-animations';
import { Copy } from '@/components/ui/copy';

const variants = {
	light: { background: colors.background, text: colors.text },
	dark: { background: colors.text, text: colors.onFilled },
} as const;

type PhotoTagVariant = keyof typeof variants;

interface Props {
	icon: ComponentType<LucideProps>;
	label: string;
	variant: PhotoTagVariant;
	order: number;
	style?: StyleProp<ViewStyle>;
	onLayout?: (event: LayoutChangeEvent) => void;
}

/**
 * 사진 위에 얹는 아이콘 달린 알약 태그 컴포넌트
 * @param icon 아이콘
 * @param label 태그 글자
 * @param variant 밝은 태그인지 어두운 태그인지
 * @param order 장면에서 나타나는 순서
 * @param style 태그 위치
 * @param onLayout 태그 크기가 정해질 때 실행할 함수
 */
const PhotoTag = ({ icon: Icon, label, variant, order, style, onLayout }: Props) => {
	const palette = variants[variant];

	return (
		<Animated.View
			entering={popIn(order)}
			onLayout={onLayout}
			style={[styles.tag, { backgroundColor: palette.background }, style]}
		>
			<Icon size={15} strokeWidth={2.8} color={palette.text} />
			<Copy numberOfLines={1} style={[styles.label, { color: palette.text }]}>
				{label}
			</Copy>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	tag: {
		position: 'absolute',
		height: 28,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 11,
		borderRadius: radius.pill,
	},
	label: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 13, lineHeight: 16 },
});

export default PhotoTag;
