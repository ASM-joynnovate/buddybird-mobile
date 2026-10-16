import { StyleSheet, View } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import {
	useGetNotificationSettings,
	useUpdateNotificationSettingItem,
	useUpdatePushSetting,
} from '@/hooks/apis/settings';
import usePermission from '@/hooks/use-permission';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BellIcon } from 'lucide-react-native';

import NotificationItemGroup from '@/screens/settings/components/notification-item-group';
import { reportError } from '@/services/telemetry/client';

import PermissionDialog from '@/components/dialogs/permission-dialog';
import { InlineError } from '@/components/ui/inline-error';
import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';
import { ItemSwitch } from '@/components/ui/item/switch';

/** 알림 설정 스위치 컴포넌트 */
const NotificationGroups = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const { data: notificationSettingsData } = useGetNotificationSettings();

	const updatePushSetting = useUpdatePushSetting();
	const updateNotificationSettingItem = useUpdateNotificationSettingItem();

	const notificationPermission = usePermission('notifications');

	const permissionOff = notificationPermission.granted === false;
	const pushOff = !notificationSettingsData.push_enabled;
	const settingSaving = updatePushSetting.isPending || updateNotificationSettingItem.isPending;
	const settingSaveFailed = updatePushSetting.isError || updateNotificationSettingItem.isError;

	const handleRequestPermission = () => {
		void notificationPermission
			.run(() => void notificationPermission.refresh())
			.catch((error: unknown) => reportError(error, 'permission_notifications'));
	};

	const handleTogglePush = (enabled: boolean) => {
		if (settingSaving) {
			return;
		}

		updatePushSetting.mutate({ data: { push_enabled: enabled } });
	};

	const handleToggleItem = (itemId: string, enabled: boolean) => {
		if (settingSaving) {
			return;
		}

		updateNotificationSettingItem.mutate({ id: itemId, data: { enabled } });
	};

	return (
		<View style={styles.container}>
			{/*전체 알림 스위치. OS 알림 권한이 꺼져 있으면 권한 안내 표시*/}
			<ItemGroup>
				<ItemSwitch
					first
					icon={BellIcon}
					label={t('settings.notifications.all')}
					value={notificationSettingsData.push_enabled}
					disabled={settingSaving}
					onChange={handleTogglePush}
				/>
				{permissionOff && (
					<Item label={t('settings.notifications.permissionOff')} onPress={handleRequestPermission} />
				)}
			</ItemGroup>

			{/*전체 알림이 꺼지면 누를 수 없음*/}
			<View
				style={[styles.itemsContainer, pushOff && styles.dimmed]}
				pointerEvents={pushOff ? 'none' : 'auto'}
				accessibilityElementsHidden={pushOff}
				importantForAccessibility={pushOff ? 'no-hide-descendants' : 'auto'}
			>
				{notificationSettingsData.items.length > 0 && (
					<NotificationItemGroup
						items={notificationSettingsData.items}
						disabled={settingSaving}
						onToggle={handleToggleItem}
					/>
				)}

				{notificationSettingsData.groups.length > 0 && (
					<ItemGroup>
						{notificationSettingsData.groups.map((group, index) => (
							<Item
								key={group.id}
								first={index === 0}
								label={group.title}
								detail={group.description ?? undefined}
								onPress={() => navigation.navigate('NotificationGroupSettings', { groupId: group.id })}
							/>
						))}
					</ItemGroup>
				)}
			</View>

			<InlineError message={settingSaveFailed ? t('settings.saveError') : null} />

			<PermissionDialog state={notificationPermission.dialog} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: { gap: 28 },
	itemsContainer: { gap: 28 },
	dimmed: { opacity: 0.4 },
});

export default NotificationGroups;
