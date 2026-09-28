import { useEffect, useState } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { useReducedMotion } from 'react-native-reanimated';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

const TYPING_INTERVAL_MS = 20;

interface Props {
	text: string;
}

export const TypedText = ({ text }: Props) => {
	const reducedMotion = useReducedMotion();

	const [typedCount, setTypedCount] = useState(0);

	const characters = Array.from(text);
	const shownCount = reducedMotion ? characters.length : typedCount;
	const typingDone = shownCount >= characters.length;

	useEffect(() => {
		if (typingDone) {
			return;
		}

		const timer = setTimeout(() => setTypedCount((prev) => prev + 1), TYPING_INTERVAL_MS);

		return () => clearTimeout(timer);
	}, [typedCount, typingDone]);

	return (
		<View>
			{/*크기를 잡아 두는 보이지 않는 전체 문구*/}
			<Copy
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
				lineBreakStrategyIOS="hangul-word"
				style={[styles.text, styles.hidden]}
			>
				{text}
			</Copy>

			{/*한 글자씩 나타나는 문구*/}
			<Copy
				accessibilityLabel={text}
				lineBreakStrategyIOS="hangul-word"
				onPress={typingDone ? undefined : () => setTypedCount(characters.length)}
				style={[styles.text, styles.typed]}
			>
				{characters.slice(0, shownCount).join('')}
				{!typingDone && <Text style={styles.caret}>▍</Text>}
			</Copy>
		</View>
	);
};

const styles = StyleSheet.create({
	text: { fontFamily: font.extraBold, fontSize: 16, lineHeight: 22, textAlign: 'left' },
	hidden: { opacity: 0 },
	typed: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
	caret: { color: colors.orange },
});
