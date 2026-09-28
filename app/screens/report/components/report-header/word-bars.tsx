import type { ReactElement } from 'react';

import { StyleSheet, View } from 'react-native';

import type { Report } from '@/types/apis/reports';

import { useTranslation } from 'react-i18next';

import { formatDuration } from '@/i18n/format';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font, radius } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { ui } from '@/components/ui/styles';
import { Copy } from '@/components/ui/text';

interface Props {
	words: Report['words'];
}

export function WordBars({ words }: Props): ReactElement | null {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	if (words.length === 0) {
		return null;
	}

	const max = Math.max(1, ...words.map((item) => item.learning_duration_ms));

	return (
		<View style={ui.section}>
			<Copy accessibilityRole="header" style={ui.sectionTitle}>
				{t('report.words')}
			</Copy>
			<View style={styles.list}>
				{words.map((item) => {
					const duration = formatDuration(item.learning_duration_ms, locale);

					return (
						<View
							key={item.word.id}
							style={styles.row}
							accessible
							accessibilityLabel={joinLabel(item.word.name, duration)}
						>
							<Copy numberOfLines={1} style={styles.name}>
								{item.word.name}
							</Copy>
							<View style={styles.track}>
								<View style={[styles.fill, { width: `${(item.learning_duration_ms / max) * 100}%` }]} />
							</View>
							<Copy style={styles.value}>{duration}</Copy>
						</View>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	list: { gap: 10 },
	row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
	name: { width: 72, fontFamily: font.extraBold },
	track: {
		flex: 1,
		height: 14,
		borderRadius: 8,
		backgroundColor: colors.surface,
		overflow: 'hidden',
	},
	fill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.orange },
	value: {
		minWidth: 40,
		textAlign: 'right',
		fontFamily: font.extraBold,
		fontVariant: ['tabular-nums'],
	},
});
