import type { ComponentType } from 'react';

import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import type { LucideProps } from 'lucide-react-native';
import Animated from 'react-native-reanimated';

import { colors, font, radius } from '@/theme';

import { popIn } from '@/components/scene-animations';
import { Copy } from '@/components/ui/copy';

export const PHOTO_TAG_HEIGHT = 28;

const variants = {
	neutral: { background: colors.background, text: colors.text },
	inverse: { background: colors.text, text: colors.onFilled },
} as const;

type PhotoTagVariant = keyof typeof variants;

interface Props {
	icon: ComponentType<LucideProps>;
	label: string;
	variant: PhotoTagVariant;
	order: number;
	style?: StyleProp<ViewStyle>;
}

/**
 * 사진 위 아이콘 태그 컴포넌트
 * @param icon 아이콘
 * @param label 태그 글자
 * @param variant 태그 색
 * @param order 나타나는 순서
 * @param style 태그 위치
 */
const UsageScenePhotoTag = ({ icon: Icon, label, variant, order, style }: Props) => {
	const palette = variants[variant];

	return (
		<Animated.View entering={popIn(order)} style={[styles.tag, { backgroundColor: palette.background }, style]}>
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
		height: PHOTO_TAG_HEIGHT,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 11,
		borderRadius: radius.pill,
	},
	label: { flexShrink: 1, fontFamily: font.extraBold, fontSize: 13, lineHeight: 16 },
});

export default UsageScenePhotoTag;
