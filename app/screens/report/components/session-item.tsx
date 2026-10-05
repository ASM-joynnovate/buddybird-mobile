import { StyleSheet, View } from 'react-native';

import type { ReportSession } from '@/types/apis/reports';

import type { RootStackParamList } from '@/types/navigation';
import type { ReportPeriod } from '@/types/report-period';

import { useTranslation } from 'react-i18next';

import { formatDuration, formatMonthDayTime } from '@/i18n/format';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import dayjs from 'dayjs';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';
import { joinLabel } from '@/utils/a11y';

import { Copy } from '@/components/ui/copy';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';
import { Tag } from '@/components/ui/tag';

const RISE_STAGGER_MS = 40;
const RISE_STAGGER_LIMIT = 6;

/** 아래에서 떠오르며 나타나는 애니메이션 */
const riseIn = (order: number) => {
	return new Keyframe({
		0: { opacity: 0, transform: [{ translateY: 16 }] },
		100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.out(Easing.cubic) },
	})
		.duration(450)
		.delay(Math.min(order, RISE_STAGGER_LIMIT) * RISE_STAGGER_MS);
};

interface Props {
	session: ReportSession;
	period: ReportPeriod;
	order: number;
}

/**
 * 세션 항목 컴포넌트
 * @param session 리포트 기간의 세션
 * @param period 리포트 기간 단위
 * @param order 목록에서의 순서
 */
const SessionItem = ({ session, period, order }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const startedAtLabel =
		period === 'day'
			? formatMonthDayTime(session.period.started_at, locale)
			: dayjs(session.period.started_at).format('LT');
	const durationLabel = formatDuration(session.active.duration_ms, locale);
	const wordName = session.word.name;
	const judging = session.judgment.status === 'pending';

	const handleOpenSession = () => {
		navigation.navigate('Main', {
			screen: 'ReportTab',
			params: { screen: 'SessionDetail', params: { sessionId: session.id, source: 'report' } },
		});
	};

	return (
		<Animated.View entering={riseIn(order)}>
			<PressableSurface
				depth="low"
				onPress={handleOpenSession}
				accessibilityRole="button"
				accessibilityLabel={joinLabel(wordName, startedAtLabel, durationLabel, judging && t('report.judging'))}
				contentStyle={styles.sessionRow}
			>
				<View style={styles.textContainer}>
					<View style={styles.wordRow}>
						<Copy numberOfLines={1} style={styles.word}>
							{wordName}
						</Copy>
						{judging && <Tag label={t('report.judging')} variant="primary" />}
					</View>
					<Copy style={styles.time}>{startedAtLabel}</Copy>
				</View>

				<Copy style={styles.duration}>{durationLabel}</Copy>
			</PressableSurface>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
	textContainer: { flex: 1, minWidth: 0, gap: 3 },
	wordRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	word: { flexShrink: 1, fontFamily: font.black, fontSize: 15, lineHeight: 20 },
	time: { fontSize: 12, lineHeight: 16, color: colors.muted },
	duration: { fontFamily: font.extraBold, fontSize: 14, fontVariant: ['tabular-nums'] },
});

export default SessionItem;
