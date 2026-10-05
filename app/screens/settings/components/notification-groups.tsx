import { StyleSheet, View } from 'react-native';

import type { NotificationSetting } from '@/types/apis/settings';

import { useGetSettings, useUpdateNotificationSettings } from '@/hooks/apis/settings';
import usePermission from '@/hooks/use-permission';

import { useTranslation } from 'react-i18next';

import type { SettingsMessages } from '@/i18n/types/settings';

import { BellIcon } from 'lucide-react-native';

import { reportError } from '@/services/telemetry/client';

import PermissionDialog from '@/components/dialogs/permission-dialog';
import { InlineError } from '@/components/ui/inline-error';
import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';
import { ItemSwitch } from '@/components/ui/item/switch';

const NOTIFICATION_SETTINGS: readonly {
	setting: NotificationSetting;
	labelKey: keyof SettingsMessages['notifications'];
}[] = [
	{ setting: 'announcement_enabled', labelKey: 'announcement' },
	{ setting: 'report_enabled', labelKey: 'report' },
	{ setting: 'marketing_enabled', labelKey: 'marketing' },
];

/** 알림 설정 스위치 컴포넌트 */
const NotificationGroups = () => {
	const { t } = useTranslation();

	const { data: settingsData } = useGetSettings();

	const updateNotificationSettings = useUpdateNotificationSettings();

	const notificationPermission = usePermission('notifications');

	const permissionOff = notificationPermission.granted === false;
	const pushOff = !settingsData.notifications.push_enabled;

	const handleRequestPermission = () => {
		void notificationPermission
			.run(() => void notificationPermission.refresh())
			.catch((error: unknown) => reportError(error, 'permission_notifications'));
	};

	const handleToggleNotification = (setting: NotificationSetting, enabled: boolean) => {
		if (updateNotificationSettings.isPending) {
			return;
		}

		updateNotificationSettings.mutate({ data: { ...settingsData.notifications, [setting]: enabled } });
	};

	return (
		<View style={styles.container}>
			{/*전체 알림 스위치. OS 알림 권한이 꺼져 있으면 권한 안내 표시*/}
			<ItemGroup>
				<ItemSwitch
					first
					icon={BellIcon}
					label={t('settings.notifications.all')}
					value={settingsData.notifications.push_enabled}
					disabled={updateNotificationSettings.isPending}
					onChange={(enabled) => handleToggleNotification('push_enabled', enabled)}
				/>
				{permissionOff && (
					<Item label={t('settings.notifications.permissionOff')} onPress={handleRequestPermission} />
				)}
			</ItemGroup>

			{/*알림 종류별 스위치. 전체 알림이 꺼져 있으면 저장된 값을 보인 채 누를 수 없음*/}
			<View
				style={pushOff && styles.dimmed}
				pointerEvents={pushOff ? 'none' : 'auto'}
				accessibilityElementsHidden={pushOff}
				importantForAccessibility={pushOff ? 'no-hide-descendants' : 'auto'}
			>
				<ItemGroup>
					{NOTIFICATION_SETTINGS.map(({ setting, labelKey }, index) => (
						<ItemSwitch
							key={setting}
							first={index === 0}
							label={t(`settings.notifications.${labelKey}`)}
							value={settingsData.notifications[setting]}
							disabled={updateNotificationSettings.isPending}
							onChange={(enabled) => handleToggleNotification(setting, enabled)}
						/>
					))}
					<ItemSwitch
						label={t('settings.notifications.marketingNight')}
						detail={t('settings.notifications.marketingNightHours')}
						value={settingsData.notifications.marketing_night_enabled}
						disabled={updateNotificationSettings.isPending || !settingsData.notifications.marketing_enabled}
						onChange={(enabled) => handleToggleNotification('marketing_night_enabled', enabled)}
					/>
				</ItemGroup>
			</View>

			<InlineError message={updateNotificationSettings.isError ? t('settings.saveError') : null} />

			<PermissionDialog state={notificationPermission.dialog} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: { gap: 28 },
	dimmed: { opacity: 0.4 },
});

export default NotificationGroups;
