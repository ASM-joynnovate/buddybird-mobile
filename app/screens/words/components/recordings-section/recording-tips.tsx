import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { CheckIcon, type LucideIcon, XIcon } from 'lucide-react-native';

import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';

const LABEL_ICON_SIZE = 14;
const WORD_MAX_LINES = 2;

interface Example {
	word: string;
	note: string;
}

interface ExampleBoxProps {
	icon: LucideIcon;
	label: string;
	examples: Example[];
	backgroundColor: string;
}

/**
 * 좋은 예 또는 나쁜 예 상자 컴포넌트
 * @param icon 라벨 아이콘
 * @param label 상자 라벨
 * @param examples 단어와 그 아래 설명 목록
 * @param backgroundColor 상자 면 색
 */
const ExampleBox = ({ icon: Icon, label, examples, backgroundColor }: ExampleBoxProps) => {
	return (
		<View style={[styles.box, { backgroundColor }]}>
			<View style={styles.labelRow}>
				<Icon size={LABEL_ICON_SIZE} color={colors.onFilled} strokeWidth={3} />
				<Copy style={styles.label}>{label}</Copy>
			</View>

			{examples.map(({ word, note }) => (
				<View key={note}>
					{/*반복 예시가 칸보다 길면 잘리지 않고 다음 줄로 넘어가게 함*/}
					<Copy numberOfLines={WORD_MAX_LINES} lineBreakStrategyIOS="hangul-word" style={styles.word}>
						{word}
					</Copy>
					<Copy style={styles.note}>{note}</Copy>
				</View>
			))}
		</View>
	);
};

interface Props {
	showRecommended: boolean;
}

/**
 * 올바른 녹음의 좋은 예와 나쁜 예를 보여주는 안내 컴포넌트
 * @param showRecommended 권장 녹음 개수 안내를 보일지 여부
 */
const RecordingTips = ({ showRecommended }: Props) => {
	const { t } = useTranslation();

	const word = t('words.guide.word');
	const otherWord = t('words.guide.otherWord');
	const repeatedWord = `${word} ${word}`;

	return (
		<View style={styles.container}>
			<Copy lineBreakStrategyIOS="hangul-word" style={styles.hint}>
				{t('words.editor.recordingTips.intro')}
			</Copy>

			<View
				accessible
				accessibilityLabel={t('words.editor.recordingTips.label', {
					good: word,
					other: otherWord,
					repeat: repeatedWord,
				})}
				style={styles.boxes}
			>
				<ExampleBox
					icon={CheckIcon}
					label={t('words.editor.recordingTips.goodLabel')}
					examples={[{ word, note: t('words.editor.recordingTips.goodNote') }]}
					backgroundColor={colors.greenDark}
				/>
				<ExampleBox
					icon={XIcon}
					label={t('words.editor.recordingTips.badLabel')}
					examples={[
						{ word: otherWord, note: t('words.editor.recordingTips.otherNote') },
						{ word: repeatedWord, note: t('words.editor.recordingTips.repeatNote') },
					]}
					backgroundColor={colors.error}
				/>
			</View>

			{showRecommended && <Copy style={styles.hint}>{t('words.editor.recordingTips.recommended')}</Copy>}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { gap: 10, marginBottom: 12 },
	hint: { color: colors.muted },
	boxes: { flexDirection: 'row', gap: 8 },
	box: {
		flex: 1,
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: radius.control,
		borderCurve: 'continuous',
	},
	labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
	label: { fontFamily: font.extraBold, fontSize: 12.5, color: colors.onFilled },
	word: { fontFamily: font.black, fontSize: 16, lineHeight: 21, color: colors.onFilled },
	note: { fontFamily: font.extraBold, fontSize: 12, lineHeight: 16, color: colors.onFilled },
});

export default RecordingTips;
