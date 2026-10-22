import { memo, type ReactNode } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { CheckIcon, type LucideIcon, XIcon } from 'lucide-react-native';

import { colors, font, radius } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

interface ExampleBoxProps {
	icon: LucideIcon;
	label: string;
	backgroundColor: string;
	children: ReactNode;
}

/**
 * 좋은 예 또는 나쁜 예 상자 컴포넌트
 * @param icon 라벨 아이콘
 * @param label 상자 라벨
 * @param backgroundColor 상자 면 색
 * @param children 상자 안 예시 항목
 */
const ExampleBox = ({ icon: Icon, label, backgroundColor, children }: ExampleBoxProps) => {
	return (
		<View style={[ui.equalColumn, styles.exampleBox, { backgroundColor }]}>
			<View style={styles.labelRow}>
				<Icon size={14} color={colors.onFilled} strokeWidth={3} />
				<Copy style={styles.label}>{label}</Copy>
			</View>

			{children}
		</View>
	);
};

interface ExampleItemProps {
	word: string;
	note: string;
}

/**
 * 예시 단어 항목 컴포넌트
 * @param word 예시 단어
 * @param note 단어 아래 설명
 */
const ExampleItem = ({ word, note }: ExampleItemProps) => {
	return (
		<View>
			<Copy numberOfLines={2} lineBreakStrategyIOS="hangul-word" style={styles.word}>
				{word}
			</Copy>
			<Copy style={styles.note}>{note}</Copy>
		</View>
	);
};

interface Props {
	recommendationVisible: boolean;
}

/**
 * 녹음 예시 안내 컴포넌트
 * @param recommendationVisible 권장 녹음 개수 안내 표시 여부
 */
const RecordingTips = memo(({ recommendationVisible }: Props) => {
	const { t } = useTranslation();

	const word = t('words.guide.word');
	const otherWord = t('words.guide.otherWords', { returnObjects: true })[0];
	const repeatedWord = t('words.guide.repeatedWord');

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
				style={styles.exampleRow}
			>
				<ExampleBox icon={CheckIcon} label={t('words.guide.goodLabel')} backgroundColor={colors.greenDark}>
					<ExampleItem word={word} note={t('words.editor.recordingTips.goodNote')} />
				</ExampleBox>
				<ExampleBox icon={XIcon} label={t('words.guide.badLabel')} backgroundColor={colors.error}>
					<ExampleItem word={otherWord} note={t('words.editor.recordingTips.otherNote')} />
					<ExampleItem word={repeatedWord} note={t('words.editor.recordingTips.repeatNote')} />
				</ExampleBox>
			</View>

			{recommendationVisible && <Copy style={styles.hint}>{t('words.editor.recordingTips.recommended')}</Copy>}
		</View>
	);
});

const styles = StyleSheet.create({
	container: { gap: 10, marginBottom: 12 },
	hint: { color: colors.muted },
	exampleRow: { flexDirection: 'row', gap: 8 },
	exampleBox: {
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
