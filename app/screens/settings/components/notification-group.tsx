import type { NotificationSetting, Settings } from '@/types/apis/settings';

import type { RootStackParamList } from '@/types/navigation';

import { usePermission } from '@/hooks/use-permission';

import { useTranslation } from 'react-i18next';

import type { SettingsMessages } from '@/i18n/types/settings';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TriangleAlertIcon } from 'lucide-react-native';

import { Item } from '@/components/ui/item';
import { ItemGroup } from '@/components/ui/item/group';
import { ItemSwitch } from '@/components/ui/item/switch';

const NOTIFICATION_SETTINGS: readonly {
	setting: NotificationSetting;
	labelKey: keyof SettingsMessages['notifications'];
}[] = [
	{ setting: 'notice', labelKey: 'notice' },
	{ setting: 'report', labelKey: 'report' },
	{ setting: 'marketing', labelKey: 'marketing' },
];

interface Props {
	settings: Settings;
	onChange(setting: NotificationSetting, enabled: boolean): void;
}

export function NotificationGroup({ settings, onChange }: Props) {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const notificationPermission = usePermission('notifications');

	const permissionOff = notificationPermission.granted === false;

	return (
		<ItemGroup title={t('settings.notifications.title')}>
			{permissionOff ? (
				<Item
					first
					icon={TriangleAlertIcon}
					label={t('settings.notifications.permissionLink')}
					detail={t('settings.notifications.permissionOff')}
					onPress={() => navigation.navigate('Permissions')}
				/>
			) : null}
			{NOTIFICATION_SETTINGS.map(({ setting, labelKey }, index) => (
				<ItemSwitch
					key={setting}
					first={!permissionOff && index === 0}
					label={t(`settings.notifications.${labelKey}`)}
					value={settings.notifications[setting]}
					onChange={(enabled) => onChange(setting, enabled)}
				/>
			))}
		</ItemGroup>
	);
}
