import { StyleSheet, View } from 'react-native';

import type { Word } from '@/types/apis/words';

import { useTranslation } from 'react-i18next';

import { CheckIcon } from 'lucide-react-native';

import { ChoiceCard } from '@/screens/home/components/choice-card';
import { wordIcons } from '@/screens/home/components/word-picker/word-icons';
import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

const ICON_SIZE = 34;

interface Props {
	word: Word;
	iconIndex: number;
	selected: boolean;
	onSelect: (id: string) => void;
}

/**
 * 단어 선택 타일 컴포넌트
 * @param word 표시할 단어
 * @param iconIndex 표시할 아이콘 번호
 * @param selected 선택 여부
 * @param onSelect 단어 선택 시 실행할 함수
 */
const WordChoice = ({ word, iconIndex, selected, onSelect }: Props) => {
	const { t } = useTranslation();

	const WordIcon = wordIcons[iconIndex];

	return (
		<ChoiceCard
			selected={selected}
			cornerRadius="tile"
			onPress={() => onSelect(word.id)}
			accessibilityLabel={t('session.start.selectWord', { name: word.name })}
			style={styles.cardContainer}
			contentStyle={styles.card}
		>
			<WordIcon width={ICON_SIZE} height={ICON_SIZE} />
			<Copy style={styles.name}>{word.name}</Copy>

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
