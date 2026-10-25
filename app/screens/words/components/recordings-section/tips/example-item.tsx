import { StyleSheet, View } from 'react-native';

import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';

interface Props {
	word: string;
	note: string;
}

/**
 * 예시 단어 항목 컴포넌트
 * @param word 예시 단어
 * @param note 단어 아래 설명
 */
const RecordingsSectionTipsExampleItem = ({ word, note }: Props) => {
	return (
		<View>
			<Copy numberOfLines={2} lineBreakStrategyIOS="hangul-word" style={styles.word}>
				{word}
			</Copy>
			<Copy style={styles.note}>{note}</Copy>
		</View>
	);
};

const styles = StyleSheet.create({
	word: { fontFamily: font.black, fontSize: 16, lineHeight: 21, color: colors.onFilled },
	note: { fontFamily: font.extraBold, fontSize: 12, lineHeight: 16, color: colors.onFilled },
});

export default RecordingsSectionTipsExampleItem;
