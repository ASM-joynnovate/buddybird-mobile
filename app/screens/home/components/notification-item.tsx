import { memo } from 'react';

import { Image, StyleSheet, View } from 'react-native';

import type { AppNotification, NotificationKind } from '@/types/apis/notifications';

import { useReadNotification } from '@/hooks/apis/notifications';

import { useTranslation } from 'react-i18next';

import { formatMoment } from '@/i18n/format';

import { useLinkTo } from '@react-navigation/native';
import { AudioWaveformIcon, ChartNoAxesColumnIcon, FlameIcon, type LucideIcon } from 'lucide-react-native';

import { track } from '@/services/telemetry/client';
import { useDeviceSettingsStore } from '@/stores/device-settings';
import { colors, font, radius } from '@/theme';
import { joinLabel } from '@/utils/a11y';
import { notificationPath } from '@/utils/notification';

import { Copy } from '@/components/ui/copy';
import { DotBadge } from '@/components/ui/dot-badge';
import { PressableSurface } from '@/components/ui/surface/pressable-surface';

const icons: Record<NotificationKind, LucideIcon> = {
	mimicry: AudioWaveformIcon,
	daily_summary: ChartNoAxesColumnIcon,
	streak: FlameIcon,
};

interface Props {
	item: AppNotification;
}

export const NotificationItem = memo(function NotificationItem({ item }: Props) {
	const { t } = useTranslation();

	const linkTo = useLinkTo();

	const { mutate } = useReadNotification();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const unread = !item.read_at;
	const time = formatMoment(item.sent_at, locale);
	const KindIcon = icons[item.kind];

	/** 알림 읽음 표시와 알림 경로 열기 */
	const handleOpen = () => {
		if (unread) {
			mutate({ id: item.id });
		}

		track('notification_opened', { kind: item.kind, from: 'list' });

		linkTo(notificationPath(item));
	};

	return (
		<PressableSurface
			variant="plain"
			depth="none"
			cornerRadius="none"
			style={styles.item}
			contentStyle={styles.row}
			accessibilityLabel={joinLabel(unread && t('home.notification.unread'), item.title, item.body, time)}
			onPress={handleOpen}
		>
			<View style={styles.icon}>
				<KindIcon size={20} color={colors.orangeDark} />
			</View>

			<View style={styles.text}>
				<View style={styles.titleRow}>
					<Copy numberOfLines={1} style={styles.title}>
						{item.title}
					</Copy>
					{unread ? <DotBadge /> : null}
				</View>
				<Copy numberOfLines={2} style={styles.body}>
					{item.body}
				</Copy>
				<Copy style={styles.time}>{time}</Copy>
			</View>

			{item.image ? (
				<Image source={{ uri: item.image.url }} style={styles.image} accessibilityIgnoresInvertColors />
			) : null}
		</PressableSurface>
	);
});

const styles = StyleSheet.create({
	item: { borderBottomWidth: 2, borderBottomColor: colors.border },
	row: {
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
		backgroundColor: colors.orangeSelected,
	},
	text: { flex: 1, minWidth: 0, gap: 3 },
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
