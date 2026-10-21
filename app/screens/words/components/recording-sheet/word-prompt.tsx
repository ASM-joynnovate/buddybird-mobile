import { StyleSheet, Text, View } from 'react-native';

import { Trans } from 'react-i18next';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

const WORD_MAX_LINES = 2;
const WORD_SIZES = [
	{ maxLength: 8, style: { fontSize: 34, lineHeight: 40 } },
	{ maxLength: 16, style: { fontSize: 26, lineHeight: 32 } },
] as const;
const LONG_WORD_SIZE = { fontSize: 20, lineHeight: 26 } as const;

/** 단어 길이에 맞는 글자 크기를 반환하는 함수 */
const getWordSize = (wordName: string) => {
	return WORD_SIZES.find(({ maxLength }) => wordName.length <= maxLength)?.style ?? LONG_WORD_SIZE;
};

interface Props {
	wordName: string;
}

/**
 * 녹음 상자 위에 녹음할 단어와 한 번만 말하라는 안내를 보여주는 컴포넌트
 * @param wordName 녹음할 단어 이름. 비어 있으면 안내만 보인다
 */
const WordPrompt = ({ wordName }: Props) => {
	return (
		<View style={styles.container}>
			{!!wordName && (
				<Copy
					numberOfLines={WORD_MAX_LINES}
					lineBreakStrategyIOS="hangul-word"
					style={[styles.word, getWordSize(wordName)]}
				>
					{wordName}
				</Copy>
			)}
			<Copy style={styles.instruction}>
				<Trans i18nKey="words.recorder.onceInstruction" components={{ b: <Text style={styles.highlight} /> }} />
			</Copy>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { alignItems: 'center', gap: 2, paddingTop: 18, paddingHorizontal: 16 },
	word: { fontFamily: font.black, textAlign: 'center' },
	instruction: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
	highlight: { fontFamily: font.extraBold, color: colors.text, backgroundColor: colors.orangeSoft },
});

export default WordPrompt;
