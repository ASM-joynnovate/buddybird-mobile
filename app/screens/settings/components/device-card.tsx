import { StyleSheet, View } from 'react-native';

import type { LinkedDevice } from '@/types/device';

import { useTranslation } from 'react-i18next';

import { formatTimeOrDateTime } from '@/i18n/format';

import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { Card } from '@/components/ui/surface/card';
import { Tag } from '@/components/ui/tag';

interface Props {
	device: LinkedDevice;
}

/**
 * 기기 모델명, 마지막 접속 시각, 이 기기와 세션 실행 중 표시를 보여 주는 컴포넌트
 * @param device 연결된 기기
 */
const DeviceCard = ({ device }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	return (
		<Card contentStyle={styles.card}>
			<View style={styles.textContainer}>
				<Copy style={styles.name} numberOfLines={1}>
					{device.model}
				</Copy>
				{!!device.lastSeenAt && (
					<Copy style={styles.detail}>
						{t('settings.devices.lastSeen', {
							time: formatTimeOrDateTime(device.lastSeenAt, locale),
						})}
					</Copy>
				)}

				{(device.isThisDevice || device.isRunningSession) && (
					<View style={styles.tagsRow}>
						{device.isThisDevice && <Tag label={t('settings.devices.thisDevice')} />}
						{device.isRunningSession && (
							<Tag variant="primary" label={t('settings.devices.runningSession')} />
						)}
					</View>
				)}
			</View>
		</Card>
	);
};

const styles = StyleSheet.create({
	card: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
	textContainer: { flex: 1, minWidth: 0, gap: 2 },
	name: { fontFamily: font.black, fontSize: 18, lineHeight: 24 },
	detail: { fontSize: 13, color: colors.muted },
	tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
});

export default DeviceCard;
