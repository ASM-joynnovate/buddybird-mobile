import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { CheckIcon, type LucideIcon, XIcon } from 'lucide-react-native';
import Animated from 'react-native-reanimated';

import { colors, font } from '@/theme';

import { popIn } from '@/components/scene-animations';
import { Copy } from '@/components/ui/copy';

const WORD_CHIP_COLOR = '#ffffff38';

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
				styles.exampleCard,
				{
					left: left * scale,
					top: 36 * scale,
					width: 156 * scale,
					height: 300 * scale,
					gap: 10 * scale,
					padding: 14 * scale,
					borderRadius: 18 * scale,
					backgroundColor,
				},
			]}
		>
			<View style={[styles.labelRow, { gap: 4 * scale }]}>
				<Icon size={15 * scale} color={colors.onFilled} strokeWidth={3} />
				<Copy style={[styles.label, { fontSize: 14 * scale, lineHeight: 19 * scale }]}>{label}</Copy>
			</View>

			<View style={[styles.wordContainer, { gap: 8 * scale }]}>
				{words.map((word, index) => (
					<Animated.View
						key={index}
						entering={popIn(appearOrder + 3 + index)}
						style={[
							styles.wordChip,
							{ paddingHorizontal: 8 * scale, paddingVertical: 7 * scale, borderRadius: 12 * scale },
						]}
					>
						<Copy
							numberOfLines={1}
							adjustsFontSizeToFit
							style={[styles.wordChipText, { fontSize: 16 * scale, lineHeight: 22 * scale }]}
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
 * 한 단어에 그 단어만 녹음하는 장면 컴포넌트
 * @param scale 그림 배율
 */
const RecordingSceneSameWord = ({ scale }: Props) => {
	const { t } = useTranslation();

	const word = t('words.guide.word');

	return (
		<>
			<ExampleCard
				scale={scale}
				left={24}
				appearOrder={0}
				icon={CheckIcon}
				label={t('words.guide.goodLabel')}
				words={[word, word, word]}
				backgroundColor={colors.greenDark}
			/>
			<ExampleCard
				scale={scale}
				left={195}
				appearOrder={4}
				icon={XIcon}
				label={t('words.guide.badLabel')}
				words={[word, ...t('words.guide.otherWords', { returnObjects: true })]}
				backgroundColor={colors.error}
			/>
		</>
	);
};

const styles = StyleSheet.create({
	exampleCard: { position: 'absolute', alignItems: 'center', borderCurve: 'continuous' },
	labelRow: { flexDirection: 'row', alignItems: 'center' },
	label: { fontFamily: font.extraBold, color: colors.onFilled },
	wordContainer: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' },
	wordChip: { alignItems: 'center', backgroundColor: WORD_CHIP_COLOR },
	wordChipText: { fontFamily: font.black, color: colors.onFilled },
});

export default RecordingSceneSameWord;
