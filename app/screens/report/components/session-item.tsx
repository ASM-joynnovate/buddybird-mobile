import type { ReactElement } from 'react';

import { StyleSheet, View } from 'react-native';

import type { ReportSession } from '@/types/apis/reports';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { formatDateTime, formatDuration } from '@/i18n/format';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAccountStore } from '@/stores/account';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';
import { Tag } from '@/components/ui/tag';

interface Props {
	session: ReportSession;
}

export function SessionItem({ session }: Props): ReactElement {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const isAnonymous = useAccountStore((state) => state.isAnonymous);

	const startedAt = formatDateTime(session.started_at, locale);
	const duration = formatDuration(session.learning_duration_ms, locale);
	const word = session.word?.name ?? '';
	const judging = !isAnonymous && session.judgment_status === 'pending';

	/** 세션 상세 화면 열기 */
	const handleOpenSession = () => {
		navigation.navigate('Main', {
			screen: 'ReportTab',
			params: { screen: 'SessionDetail', params: { sessionId: session.id, source: 'report' } },
		});
	};

	return (
		<PressableSurface
			depth="low"
			onPress={handleOpenSession}
			accessibilityRole="button"
			accessibilityLabel={joinLabel(word, startedAt, duration, judging && t('report.judging'))}
			contentStyle={styles.row}
		>
			<View style={styles.text}>
				<Copy numberOfLines={1} style={styles.word}>
					{word}
				</Copy>
				<Copy style={styles.time}>{startedAt}</Copy>
				{judging ? <Tag label={t('report.judging')} /> : null}
			</View>

			<Copy style={styles.duration}>{duration}</Copy>
		</PressableSurface>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
	text: { flex: 1, minWidth: 0, gap: 4 },
	word: { fontFamily: font.black, fontSize: 17 },
	time: { fontSize: 13, color: colors.muted },
	duration: { fontFamily: font.extraBold, fontSize: 15, fontVariant: ['tabular-nums'] },
});
