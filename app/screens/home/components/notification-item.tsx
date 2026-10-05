import { memo } from 'react';

import { Image, StyleSheet, View } from 'react-native';

import type { AppNotification } from '@/types/apis/notifications';

import { useReadNotification } from '@/hooks/apis/notifications';

import { useTranslation } from 'react-i18next';

import { formatTimeOrDateTime } from '@/i18n/format';

import { useLinkTo } from '@react-navigation/native';
import {
	BellIcon,
	ChartNoAxesColumnIcon,
	GiftIcon,
	type LucideIcon,
	MegaphoneIcon,
	TriangleAlertIcon,
} from 'lucide-react-native';

import { track } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font, radius } from '@/theme';
import { joinLabel } from '@/utils/a11y';
import { notificationPath } from '@/utils/notification';

import { Copy } from '@/components/ui/copy';
import { DotBadge } from '@/components/ui/dot-badge';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const icons: Partial<Record<string, LucideIcon>> = {
	announcement: MegaphoneIcon,
	urgent: TriangleAlertIcon,
	marketing: GiftIcon,
	report: ChartNoAxesColumnIcon,
};

interface Props {
	notification: AppNotification;
}

/**
 * 알림 항목 컴포넌트
 * @param notification 표시할 알림
 */
const NotificationItem = memo(({ notification }: Props) => {
	const { t } = useTranslation();

	const linkTo = useLinkTo();

	const { isPending, mutate } = useReadNotification();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const unread = !notification.read_at;
	const sentAtLabel = formatTimeOrDateTime(notification.sent_at, locale);
	const KindIcon = icons[notification.kind] ?? BellIcon;

	const handleOpen = () => {
		if (unread && !isPending) {
			mutate({ id: notification.id });
		}

		track('notification_opened', { kind: notification.kind, from: 'list' });

		const path = notificationPath({
			kind: notification.kind,
			notification_id: notification.id,
			data_id: notification.data_id,
		});

		if (path) {
			linkTo(path);
		}
	};

	return (
		<PressableSurface
			variant="plain"
			depth="none"
			cornerRadius="none"
			style={styles.item}
			contentStyle={styles.notificationRow}
			accessibilityLabel={joinLabel(
				unread && t('home.notificationList.unread'),
				notification.title,
				notification.body,
				sentAtLabel,
			)}
			onPress={handleOpen}
		>
			{/*알림 종류 아이콘*/}
			<View style={styles.icon}>
				<KindIcon size={20} color={colors.orangeDark} />
			</View>

			{/*알림 내용*/}
			<View style={styles.textContainer}>
				<View style={styles.titleRow}>
					<Copy numberOfLines={1} style={styles.title}>
						{notification.title}
					</Copy>
					{unread && <DotBadge />}
				</View>
				<Copy numberOfLines={2} style={styles.body}>
					{notification.body}
				</Copy>
				<Copy style={styles.time}>{sentAtLabel}</Copy>
			</View>

			{notification.image && (
				<Image source={{ uri: notification.image.url }} style={styles.image} accessibilityIgnoresInvertColors />
			)}
		</PressableSurface>
	);
});

const styles = StyleSheet.create({
	item: { borderBottomWidth: 2, borderBottomColor: colors.border },
	notificationRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
		paddingVertical: 12,
		paddingHorizontal: 2,
	},
	icon: {
		width: 36,
		height: 36,
		borderRadius: radius.control,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.orangePale,
	},
	textContainer: { flex: 1, minWidth: 0, gap: 3 },
	titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
	title: { flexShrink: 1, fontFamily: font.black, fontSize: 16, color: colors.text },
	body: { fontSize: 14, color: colors.text },
	time: { fontSize: 12, color: colors.muted },
	image: {
		width: 64,
		height: 64,
		borderRadius: radius.control,
		backgroundColor: colors.surface,
	},
});

export default NotificationItem;
