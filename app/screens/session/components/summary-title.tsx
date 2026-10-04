import { StyleSheet, View } from 'react-native';

import { useGetSession } from '@/hooks/apis/sessions';

import { useTranslation } from 'react-i18next';

import { formatTimeOrDateTime } from '@/i18n/format';

import Animated from 'react-native-reanimated';

import { popIn, riseIn } from '@/screens/session/components/summary-animations';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';
import { sessionEndedAt } from '@/utils/date';

import { Copy } from '@/components/ui/copy';
import { Title } from '@/components/ui/title';

const TITLE_DELAY_MS = 100;
const RANGE_DELAY_MS = 300;

interface Props {
	sessionId: string;
}

/**
 * 학습 완료 제목과 학습한 시간대 컴포넌트
 * @param sessionId 세션 ID
 */
const SummaryTitle = ({ sessionId }: Props) => {
	const { t } = useTranslation();

	const { data: sessionData } = useGetSession({ id: sessionId });

	const locale = useDeviceSettingsStore((state) => state.locale);

	const { period } = sessionData;

	return (
		<View style={styles.container}>
			<Animated.View entering={popIn().delay(TITLE_DELAY_MS)}>
				<Title style={styles.title}>{t('session.summary.title')}</Title>
			</Animated.View>

			<Animated.View entering={riseIn().delay(RANGE_DELAY_MS)}>
				<Copy style={styles.range}>
					{t('session.summary.range', {
						start: formatTimeOrDateTime(period.started_at, locale),
						end: formatTimeOrDateTime(sessionEndedAt(period), locale),
					})}
				</Copy>
			</Animated.View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { alignItems: 'center', gap: 4 },
	title: { fontSize: 34, lineHeight: 40 },
	range: {
		fontFamily: font.extraBold,
		fontSize: 15,
		lineHeight: 20,
		color: colors.muted,
		fontVariant: ['tabular-nums'],
	},
});

export default SummaryTitle;
