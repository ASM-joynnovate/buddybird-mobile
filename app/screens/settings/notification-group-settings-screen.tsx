import { StyleSheet } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useGetNotificationSettings, useUpdateNotificationSettingItem } from '@/hooks/apis/settings';

import { useTranslation } from 'react-i18next';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import NotificationItemGroup from '@/screens/settings/components/notification-item-group';
import { colors } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { InlineError } from '@/components/ui/inline-error';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';

/** 알림 묶음 설정 화면 */
const NotificationGroupSettingsScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation();
	const { groupId } = useRoute<RouteProp<RootStackParamList, 'NotificationGroupSettings'>>().params;

	const { data: notificationSettingsData } = useGetNotificationSettings();

	const { isError, isPending, mutate } = useUpdateNotificationSettingItem();

	const group = notificationSettingsData.groups.find(({ id }) => id === groupId);

	const handleToggleItem = (itemId: string, enabled: boolean) => {
		if (isPending) {
			return;
		}

		mutate({ id: itemId, data: { enabled } });
	};

	return (
		<Screen>
			<ScreenHeader title={group?.title} onBack={() => navigation.goBack()} />

			{!!group?.description && <Copy style={styles.description}>{group.description}</Copy>}

			{group && <NotificationItemGroup items={group.items} disabled={isPending} onToggle={handleToggleItem} />}

			<InlineError message={isError ? t('settings.saveError') : null} />
		</Screen>
	);
};

const styles = StyleSheet.create({
	description: { color: colors.muted, lineHeight: 21, marginBottom: 12 },
});

export default NotificationGroupSettingsScreen;
