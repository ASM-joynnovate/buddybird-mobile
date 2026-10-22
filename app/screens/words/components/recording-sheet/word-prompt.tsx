import { memo } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { Trans } from 'react-i18next';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

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
 * 녹음할 단어 안내 컴포넌트
 * @param wordName 녹음할 단어 이름
 */
const WordPrompt = memo(({ wordName }: Props) => {
	return (
		<View style={styles.container}>
			{!!wordName && (
				<Copy numberOfLines={2} lineBreakStrategyIOS="hangul-word" style={[styles.word, getWordSize(wordName)]}>
					{wordName}
				</Copy>
			)}
			<Copy style={styles.instruction}>
				<Trans i18nKey="words.recorder.sayOnce" components={{ b: <Text style={styles.highlight} /> }} />
			</Copy>
		</View>
	);
});

const styles = StyleSheet.create({
	container: { alignItems: 'center', gap: 2, paddingTop: 18, paddingHorizontal: 16 },
	word: { fontFamily: font.black, textAlign: 'center' },
	instruction: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center' },
	highlight: { fontFamily: font.extraBold, color: colors.text, backgroundColor: colors.orangeSoft },
});

export default WordPrompt;
