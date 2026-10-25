import { colors } from '@/theme';

export const summaryMetricColors = {
	togetherTime: { face: colors.green, edge: colors.greenDark, pale: colors.greenPale },
	playCount: { face: colors.orange, edge: colors.orangeDark, pale: colors.orangePale },
	wordTime: { face: colors.purple, edge: colors.purpleDark, pale: colors.purplePale },
	allTime: { face: colors.blue, edge: colors.blueDark, pale: colors.bluePale },
};

export type SummaryMetric = keyof typeof summaryMetricColors;
