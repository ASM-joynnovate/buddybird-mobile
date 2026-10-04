import type { ReactNode } from 'react';

import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { TypedText } from '@/components/ui/speech-bubble/typed-text';
import { Card } from '@/components/ui/surface/card';

const NUMBER_BEFORE_HANGUL = /(\d)(?=[가-힣])/g;
const WORD_JOINER = '⁠';

const keepNumbersWithUnits = (text: string) => {
	return text.replace(NUMBER_BEFORE_HANGUL, `$1${WORD_JOINER}`);
};

interface Props {
	pointerSide?: 'bottom' | 'left';
	typing?: boolean;
	style?: StyleProp<ViewStyle>;
	contentStyle?: StyleProp<ViewStyle>;
	children: ReactNode;
}

export const SpeechBubble = ({ children, pointerSide = 'bottom', typing = false, style, contentStyle }: Props) => {
	let content = children;

	if (typeof children === 'string') {
		content = typing ? (
			<TypedText key={children} text={keepNumbersWithUnits(children)} />
		) : (
			<Copy lineBreakStrategyIOS="hangul-word" style={styles.text}>
				{keepNumbersWithUnits(children)}
			</Copy>
		);
	}

	return (
		<Card cornerRadius="control" style={style} contentStyle={[styles.bubble, contentStyle]}>
			{/*말풍선 꼬리*/}
			<View pointerEvents="none" style={[styles.pointer, pointerSide === 'left' ? styles.left : styles.bottom]} />

			{content}
		</Card>
	);
};

const styles = StyleSheet.create({
	bubble: {
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	text: { fontFamily: font.extraBold, fontSize: 16, lineHeight: 22, textAlign: 'left' },
	pointer: {
		position: 'absolute',
		width: 16,
		height: 16,
		backgroundColor: colors.background,
		borderRightWidth: 2,
		borderBottomWidth: 2,
		borderColor: colors.border,
	},
	bottom: { bottom: -10, left: '50%', transform: [{ translateX: -8 }, { rotate: '45deg' }] },
	left: { left: -10, top: 22, transform: [{ rotate: '135deg' }] },
});
