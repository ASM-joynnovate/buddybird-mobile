import { StyleSheet, View } from 'react-native';

import { useIsMutating } from '@tanstack/react-query';

import type { RootStackParamList } from '@/types/navigation';

import { apiKeys } from '@/hooks/apis/keys';
import { useGetNotificationSettings, useUpdatePushSetting } from '@/hooks/apis/settings';
import usePermission from '@/hooks/use-permission';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BellIcon } from 'lucide-react-native';
import { toast } from 'sonner-native';

import NotificationItemGroup from '@/screens/settings/components/notification-item-group';
import { reportError } from '@/services/telemetry/client';

import PermissionDialog from '@/components/dialogs/permission-dialog';
import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';
import { ItemSwitch } from '@/components/ui/item/switch';
import { Toast } from '@/components/ui/toast';

/** 알림 설정 스위치 컴포넌트 */
const NotificationGroups = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const { data: notificationSettingsData } = useGetNotificationSettings();

	const { isPending, mutate } = useUpdatePushSetting();

	const settingItemSaving =
		useIsMutating({ mutationKey: apiKeys.mutation('users', 'me', 'settings', 'notifications', 'item') }) > 0;

	const notificationPermission = usePermission('notifications');

	const permissionOff = notificationPermission.granted === false;
	const pushOff = !notificationSettingsData.push_enabled;

	const handleRequestPermission = () => {
		void notificationPermission
			.runWithPermission(() => void notificationPermission.refresh())
			.catch((error: unknown) => reportError(error, 'permission_notifications'));
	};

	const handleTogglePush = (enabled: boolean) => {
		if (isPending || settingItemSaving) {
			return;
		}

		mutate(
			{ data: { push_enabled: enabled } },
			{
				onError: () => {
					toast.custom(<Toast variant="error" message={t('settings.saveError')} />);
				},
			},
		);
	};

	return (
		<View style={styles.container}>
			<ItemGroup>
				<ItemSwitch
					firstInGroup
					icon={BellIcon}
					label={t('settings.notifications.all')}
					value={notificationSettingsData.push_enabled}
					disabled={isPending || settingItemSaving}
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
						settingItems={notificationSettingsData.items}
						pushSettingSaving={isPending}
					/>
				)}

				{notificationSettingsData.groups.length > 0 && (
					<ItemGroup>
						{notificationSettingsData.groups.map((group, index) => (
							<Item
								key={group.id}
								firstInGroup={index === 0}
								label={group.title}
								detail={group.description ?? undefined}
								onPress={() => navigation.navigate('NotificationGroupSettings', { groupId: group.id })}
							/>
						))}
					</ItemGroup>
				)}
			</View>

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
