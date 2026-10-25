import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { CheckIcon, XIcon } from 'lucide-react-native';

import { RECOMMENDED_RECORDINGS } from '@/config/policy';
import RecordingsSectionTipsExampleBox from '@/screens/words/components/recordings-section/tips/example-box';
import RecordingsSectionTipsExampleItem from '@/screens/words/components/recordings-section/tips/example-item';
import { colors } from '@/theme';

import { Copy } from '@/components/ui/copy';

interface Props {
	recommendationVisible: boolean;
}

/**
 * 녹음 예시 안내 컴포넌트
 * @param recommendationVisible 권장 녹음 개수 안내 표시 여부
 */
const RecordingsSectionTips = ({ recommendationVisible }: Props) => {
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
				<RecordingsSectionTipsExampleBox
					icon={CheckIcon}
					label={t('words.guide.goodLabel')}
					backgroundColor={colors.greenDark}
				>
					<RecordingsSectionTipsExampleItem word={word} note={t('words.editor.recordingTips.goodNote')} />
				</RecordingsSectionTipsExampleBox>
				<RecordingsSectionTipsExampleBox
					icon={XIcon}
					label={t('words.guide.badLabel')}
					backgroundColor={colors.error}
				>
					<RecordingsSectionTipsExampleItem
						word={otherWord}
						note={t('words.editor.recordingTips.otherNote')}
					/>
					<RecordingsSectionTipsExampleItem
						word={repeatedWord}
						note={t('words.editor.recordingTips.repeatNote')}
					/>
				</RecordingsSectionTipsExampleBox>
			</View>

			{recommendationVisible && (
				<Copy style={styles.hint}>
					{t('words.editor.recordingTips.recommended', { count: RECOMMENDED_RECORDINGS })}
				</Copy>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: { gap: 10, marginBottom: 12 },
	hint: { color: colors.muted },
	exampleRow: { flexDirection: 'row', gap: 8 },
});

export default RecordingsSectionTips;
