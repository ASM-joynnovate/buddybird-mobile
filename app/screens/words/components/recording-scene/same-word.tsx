import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { CheckIcon, type LucideIcon, XIcon } from 'lucide-react-native';
import Animated from 'react-native-reanimated';

import { colors, font } from '@/theme';

import { popIn } from '@/components/scene-animations';
import { Copy } from '@/components/ui/copy';

const CARD_TOP = 36;
const CARD_WIDTH = 156;
const CARD_HEIGHT = 300;
const GOOD_CARD_LEFT = 24;
const BAD_CARD_LEFT = 195;
const WORD_APPEAR_START = 3;
const BAD_CARD_APPEAR_ORDER = 4;

interface ExampleCardProps {
	scale: number;
	left: number;
	appearOrder: number;
	icon: LucideIcon;
	label: string;
	words: string[];
	backgroundColor: string;
}

/**
 * 좋은 예 또는 나쁜 예 카드 컴포넌트
 * @param scale 그림 배율
 * @param left 카드 왼쪽 위치
 * @param appearOrder 카드가 나타나는 순서
 * @param icon 라벨 아이콘
 * @param label 카드 라벨
 * @param words 카드에 쌓는 녹음 단어 목록
 * @param backgroundColor 카드 면 색
 */
const ExampleCard = ({ scale, left, appearOrder, icon: Icon, label, words, backgroundColor }: ExampleCardProps) => {
	return (
		<Animated.View
			entering={popIn(appearOrder)}
			style={[
				styles.card,
				{
					left: left * scale,
					top: CARD_TOP * scale,
					width: CARD_WIDTH * scale,
					height: CARD_HEIGHT * scale,
					gap: 10 * scale,
					padding: 14 * scale,
					borderRadius: 18 * scale,
					backgroundColor,
				},
			]}
		>
			<View style={[styles.labelRow, { gap: 4 * scale }]}>
				<Icon size={15 * scale} color={colors.onFilled} strokeWidth={3} />
				<Copy style={[styles.labelText, { fontSize: 14 * scale, lineHeight: 19 * scale }]}>{label}</Copy>
			</View>

			<View style={[styles.words, { gap: 8 * scale }]}>
				{words.map((word, index) => (
					<Animated.View
						key={`${word}-${index}`}
						entering={popIn(appearOrder + WORD_APPEAR_START + index)}
						style={[styles.word, { paddingVertical: 7 * scale, borderRadius: 12 * scale }]}
					>
						<Copy
							numberOfLines={1}
							adjustsFontSizeToFit
							style={[styles.wordText, { fontSize: 16 * scale, lineHeight: 22 * scale }]}
						>
							{word}
						</Copy>
					</Animated.View>
				))}
			</View>
		</Animated.View>
	);
};

interface Props {
	scale: number;
}

/**
 * 같은 단어만 담은 좋은 예와 다른 단어가 섞인 나쁜 예를 비교하는 장면 컴포넌트
 * @param scale 그림 배율
 */
const RecordingSceneSameWord = ({ scale }: Props) => {
	const { t } = useTranslation();

	const word = t('words.guide.word');

	return (
		<>
			<ExampleCard
				scale={scale}
				left={GOOD_CARD_LEFT}
				appearOrder={0}
				icon={CheckIcon}
				label={t('words.guide.sameWord.goodLabel')}
				words={[word, word, word]}
				backgroundColor={colors.greenDark}
			/>
			<ExampleCard
				scale={scale}
				left={BAD_CARD_LEFT}
				appearOrder={BAD_CARD_APPEAR_ORDER}
				icon={XIcon}
				label={t('words.guide.sameWord.badLabel')}
				words={[word, t('words.guide.otherWord'), t('words.guide.anotherWord')]}
				backgroundColor={colors.error}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	card: { position: 'absolute', alignItems: 'center', borderCurve: 'continuous' },
	labelRow: { flexDirection: 'row', alignItems: 'center' },
	labelText: { fontFamily: font.extraBold, color: colors.onFilled },
	words: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' },
	word: { alignItems: 'center', paddingHorizontal: 8, backgroundColor: colors.onFilledSoft },
	wordText: { fontFamily: font.black, color: colors.onFilled },
});

export default RecordingSceneSameWord;
