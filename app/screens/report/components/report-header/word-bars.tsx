import { StyleSheet, View } from 'react-native';

import type { Report } from '@/types/apis/reports';

import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font, radius } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';
import { ui } from '@/components/ui/styles';

interface Props {
	words: Report['words'];
}

/**
 * 단어마다 이름, 학습 시간 막대, 학습 시간을 보여 주는 컴포넌트
 * @param words 단어별 학습 시간
 */
const WordBars = ({ words }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	if (words.length === 0) {
		return null;
	}

	const maxDurationMs = Math.max(1, ...words.map((wordDuration) => wordDuration.learning_duration_ms));

	return (
		<View style={ui.sectionContainer}>
			{/*단어별 학습 시간 제목*/}
			<Copy accessibilityRole="header" style={ui.sectionTitle}>
				{t('report.learningTimeByWord')}
			</Copy>

			{/*단어 이름, 학습 시간 막대, 학습 시간*/}
			<View style={styles.listContainer}>
				{words.map((wordDuration) => {
					const durationLabel = formatDuration(wordDuration.learning_duration_ms, locale);

					return (
						<View
							key={wordDuration.word.id}
							style={styles.wordRow}
							accessible
							accessibilityLabel={joinLabel(wordDuration.word.name, durationLabel)}
						>
							<Copy numberOfLines={1} style={styles.name}>
								{wordDuration.word.name}
							</Copy>
							<View style={styles.track}>
								<View
									style={[
										styles.fill,
										{ width: `${(wordDuration.learning_duration_ms / maxDurationMs) * 100}%` },
									]}
								/>
							</View>
							<Copy style={styles.duration}>{durationLabel}</Copy>
						</View>
					);
				})}
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	listContainer: { gap: 10 },
	wordRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	name: { width: 72, fontFamily: font.extraBold },
	track: {
		flex: 1,
		height: 14,
		borderRadius: 8,
		backgroundColor: colors.surface,
		overflow: 'hidden',
	},
	fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.orange },
	duration: {
		minWidth: 40,
		textAlign: 'right',
		fontFamily: font.extraBold,
		fontVariant: ['tabular-nums'],
	},
});

export default WordBars;
