import { StyleSheet, View } from 'react-native';

import { useGetNotification } from '@/hooks/apis/notifications';

import { useTranslation } from 'react-i18next';

import { formatTimeOrDateTime } from '@/i18n/format';

import AttachedImages from '@/screens/home/components/attached-images';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { Title } from '@/components/ui/title';

interface Props {
	notificationId: string;
}

/**
 * 알림 상세 컴포넌트
 * @param notificationId 알림 ID
 */
const NotificationContent = ({ notificationId }: Props) => {
	const { t } = useTranslation();

	const { data: notificationData } = useGetNotification({ id: notificationId });

	const locale = useDeviceSettingsStore((state) => state.locale);

	return (
		<View style={styles.notificationContainer}>
			<View style={styles.headingContainer}>
				<Title>{notificationData.title}</Title>
				<Copy style={styles.time}>{formatTimeOrDateTime(notificationData.sent_at, locale)}</Copy>
			</View>

			{notificationData.image && (
				<AttachedImages
					images={[{ uri: notificationData.image.url, label: t('home.notification.viewImage') }]}
				/>
			)}
			<Copy style={styles.text}>{notificationData.body}</Copy>
		</View>
	);
};

const styles = StyleSheet.create({
	notificationContainer: { gap: 20 },
	headingContainer: { gap: 6 },
	time: { fontSize: 13, color: colors.muted },
	text: { lineHeight: 24 },
});

export default NotificationContent;
