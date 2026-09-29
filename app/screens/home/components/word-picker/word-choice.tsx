import { StyleSheet, View } from 'react-native';

import type { Word } from '@/types/apis/words';

import { useTranslation } from 'react-i18next';

import { CheckIcon } from 'lucide-react-native';

import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { ChoiceCard } from '@/components/ui/surface/choice-card';

interface Props {
	word: Word;
	selected: boolean;
	onSelect: (id: string) => void;
}

/**
 * 단어 타일 컴포넌트
 * @param word 보여 줄 단어
 * @param selected 고른 단어 여부
 * @param onSelect 단어를 고를 때 실행할 함수
 */
const WordChoice = ({ word, selected, onSelect }: Props) => {
	const { t } = useTranslation();

	return (
		<ChoiceCard
			selected={selected}
			cornerRadius="tile"
			onPress={() => onSelect(word.id)}
			accessibilityLabel={t('session.start.selectWord', { name: word.name })}
			style={styles.cardContainer}
			contentStyle={styles.card}
		>
			{/*첫 글자와 이름*/}
			<View style={[styles.initialContainer, selected && styles.initialContainerSelected]}>
				<Copy style={[styles.initialText, selected && styles.initialTextSelected]}>
					{Array.from(word.name)[0]}
				</Copy>
			</View>
			<Copy style={styles.name}>{word.name}</Copy>

			{/*체크 표시*/}
			{selected && (
				<View style={styles.checkBadge}>
					<CheckIcon size={10} color={colors.onFilled} />
				</View>
			)}
		</ChoiceCard>
	);
};

const styles = StyleSheet.create({
	cardContainer: { flexGrow: 1, minWidth: 0 },
	card: {
		minHeight: 84,
		paddingHorizontal: 6,
		paddingVertical: 12,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
	},
	initialContainer: {
		width: 34,
		height: 34,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.orangeLight,
	},
	initialContainerSelected: { backgroundColor: colors.orange },
	initialText: { fontFamily: font.black, fontSize: 16 },
	initialTextSelected: { color: colors.onFilled },
	name: { fontFamily: font.extraBold, fontSize: 12.5, lineHeight: 16, textAlign: 'center', width: '100%' },
	checkBadge: {
		position: 'absolute',
		top: 6,
		right: 6,
		width: 16,
		height: 16,
		borderRadius: radius.pill,
		backgroundColor: colors.orange,
		alignItems: 'center',
		justifyContent: 'center',
	},
});

export default WordChoice;
