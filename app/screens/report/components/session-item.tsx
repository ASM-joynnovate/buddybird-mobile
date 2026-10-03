import { StyleSheet, View } from 'react-native';

import type { ReportSession } from '@/types/apis/reports';

import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { formatDuration, formatMonthDayTime } from '@/i18n/format';

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

/**
 * 세션 항목 컴포넌트
 * @param session 리포트 기간의 세션
 */
const SessionItem = ({ session }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const isAnonymous = useAccountStore((state) => state.isAnonymous);

	const startedAtLabel = formatMonthDayTime(session.period.started_at, locale);
	const durationLabel = formatDuration(session.learning.duration_ms, locale);
	const wordName = session.word.name;
	const judging = !isAnonymous && session.judgment.status === 'pending';

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
			accessibilityLabel={joinLabel(wordName, startedAtLabel, durationLabel, judging && t('report.judging'))}
			contentStyle={styles.sessionRow}
		>
			<View style={styles.textContainer}>
				<Copy numberOfLines={1} style={styles.word}>
					{wordName}
				</Copy>
				<Copy style={styles.time}>{startedAtLabel}</Copy>
				{judging && <Tag label={t('report.judging')} />}
			</View>

			<Copy style={styles.duration}>{durationLabel}</Copy>
		</PressableSurface>
	);
};

const styles = StyleSheet.create({
	sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
	textContainer: { flex: 1, minWidth: 0, gap: 4 },
	word: { fontFamily: font.black, fontSize: 17 },
	time: { fontSize: 13, color: colors.muted },
	duration: { fontFamily: font.extraBold, fontSize: 15, fontVariant: ['tabular-nums'] },
});

export default SessionItem;
