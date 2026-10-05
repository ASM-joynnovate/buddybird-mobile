import { StyleSheet, View } from 'react-native';

import type { Report } from '@/types/apis/reports';

import type { ReportPeriod } from '@/types/report-period';

import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import Animated, { Easing, Keyframe } from 'react-native-reanimated';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';

const MIN_FILL_PERCENT = 6;

/** 막대가 왼쪽부터 자라는 애니메이션 */
const growIn = () => {
	return new Keyframe({
		0: { transform: [{ scaleX: 0 }] },
		100: { transform: [{ scaleX: 1 }], easing: Easing.out(Easing.cubic) },
	}).duration(480);
};

interface Props {
	period: ReportPeriod;
	words: Report['active']['words'];
	previousWords: Report['active']['words'];
}

/**
 * 단어별 학습 시간 컴포넌트
 * @param period 리포트 기간 단위
 * @param words 단어별 학습 시간
 * @param previousWords 지난 기간의 단어별 학습 시간
 */
const WordBars = ({ period, words, previousWords }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	if (words.length === 0) {
		return null;
	}

	const maxDurationMs = Math.max(1, ...words.map((wordDuration) => wordDuration.duration_ms));

	return (
		<View>
			<View style={styles.titleRow}>
				<Copy accessibilityRole="header" style={styles.title}>
					{t('report.learningTimeByWord')}
				</Copy>
				<Copy style={styles.comparedTo}>{t(`report.comparedTo.${period}`)}</Copy>
			</View>

			{words.map((wordDuration, index) => {
				const previousDurationMs =
					previousWords.find((previousWord) => previousWord.word.id === wordDuration.word.id)?.duration_ms ??
					0;
				const changeMs = wordDuration.duration_ms - previousDurationMs;
				const durationLabel = formatDuration(wordDuration.duration_ms, locale);
				const changeLabel =
					changeMs === 0
						? t('report.noChange')
						: `${changeMs > 0 ? '+' : '-'}${formatDuration(Math.abs(changeMs), locale)}`;

				return (
					<View
						key={wordDuration.word.id}
						style={[styles.wordRow, index > 0 && styles.dividedRow]}
						accessible
						accessibilityLabel={joinLabel(
							wordDuration.word.name,
							durationLabel,
							t(`report.change.${period}`, { change: changeLabel }),
						)}
					>
						<Copy numberOfLines={1} style={styles.name}>
							{wordDuration.word.name}
						</Copy>
						<View style={styles.track}>
							<Animated.View
								entering={growIn()}
								style={[
									styles.fill,
									{
										width: `${Math.max(MIN_FILL_PERCENT, (wordDuration.duration_ms / maxDurationMs) * 100)}%`,
									},
								]}
							/>
						</View>
						<View style={styles.durationContainer}>
							<Copy style={styles.duration}>{durationLabel}</Copy>
							<Copy style={[styles.change, changeMs > 0 && styles.increasedText]}>{changeLabel}</Copy>
						</View>
					</View>
				);
			})}
		</View>
	);
};

const styles = StyleSheet.create({
	titleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12 },
	title: { flex: 1, fontFamily: font.black, fontSize: 16, lineHeight: 22 },
	comparedTo: { fontFamily: font.extraBold, fontSize: 12, color: colors.muted },
	wordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
	dividedRow: { borderTopWidth: 2, borderTopColor: colors.border },
	name: { width: 64, fontFamily: font.extraBold, fontSize: 14 },
	track: { flex: 1, height: 19, borderRadius: 8, backgroundColor: colors.surface },
	fill: {
		height: 19,
		borderRadius: 8,
		borderBottomWidth: 3,
		borderBottomColor: colors.orangeDark,
		backgroundColor: colors.orange,
		transformOrigin: 'left',
	},
	durationContainer: { minWidth: 78, alignItems: 'flex-end' },
	duration: { fontFamily: font.extraBold, fontSize: 14, lineHeight: 18, fontVariant: ['tabular-nums'] },
	change: {
		fontFamily: font.extraBold,
		fontSize: 11.5,
		lineHeight: 15,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
	increasedText: { color: colors.orangeDark },
});

export default WordBars;
