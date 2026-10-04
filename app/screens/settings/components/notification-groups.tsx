import { Linking, StyleSheet, View } from 'react-native';

import type { NotificationSetting } from '@/types/apis/settings';

import { useGetSettings, useUpdateNotificationSettings } from '@/hooks/apis/settings';
import usePermission from '@/hooks/use-permission';

import { useTranslation } from 'react-i18next';

import type { SettingsMessages } from '@/i18n/types/settings';

import { BellIcon } from 'lucide-react-native';

import { reportError } from '@/services/telemetry/client';

import PermissionDialog from '@/components/dialogs/permission-dialog';
import { InlineError } from '@/components/ui/inline-error';
import { ItemGroup } from '@/components/ui/item/group';
import { ItemSwitch } from '@/components/ui/item/switch';

const NOTIFICATION_SETTINGS: readonly {
	setting: NotificationSetting;
	labelKey: keyof SettingsMessages['notifications'];
}[] = [
	{ setting: 'notice_enabled', labelKey: 'notice' },
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

	/** 켜면 알림 권한을 요청하고 끄면 OS 설정을 여는 함수 */
	const handleToggleAll = (enabled: boolean) => {
		if (enabled) {
			void notificationPermission
				.run(() => void notificationPermission.refresh())
				.catch((error: unknown) => reportError(error, 'permission_notifications'));

			return;
		}

		void Linking.openSettings().catch((error: unknown) => reportError(error, 'permission_settings'));
	};

	const handleToggleNotification = (setting: NotificationSetting, enabled: boolean) => {
		if (updateNotificationSettings.isPending) {
			return;
		}

		updateNotificationSettings.mutate({ data: { ...settingsData.notifications, [setting]: enabled } });
	};

	return (
		<View style={styles.container}>
			{/*OS 알림 권한을 따르는 전체 알림 스위치*/}
			<ItemGroup>
				<ItemSwitch
					first
					icon={BellIcon}
					label={t('settings.notifications.all')}
					detail={permissionOff ? t('settings.notifications.permissionOff') : undefined}
					value={notificationPermission.granted === true}
					onChange={handleToggleAll}
				/>
			</ItemGroup>

			{/*알림 종류별 스위치. 알림 권한이 없으면 저장된 값을 보인 채 누를 수 없음*/}
			<View
				style={permissionOff && styles.dimmed}
				pointerEvents={permissionOff ? 'none' : 'auto'}
				accessibilityElementsHidden={permissionOff}
				importantForAccessibility={permissionOff ? 'no-hide-descendants' : 'auto'}
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
				</ItemGroup>

				<InlineError message={updateNotificationSettings.isError ? t('settings.saveError') : null} />
			</View>

			<PermissionDialog state={notificationPermission.dialog} />
		</View>
	);
};

const styles = StyleSheet.create({
	container: { gap: 28 },
	dimmed: { opacity: 0.4 },
});

export default NotificationGroups;
