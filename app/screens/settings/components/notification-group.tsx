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

const ITEMS: readonly {
	key: NotificationSetting;
	label: keyof SettingsMessages['notifications'];
}[] = [
	{ key: 'notice', label: 'notice' },
	{ key: 'report', label: 'report' },
	{ key: 'marketing', label: 'marketing' },
];

interface Props {
	settings: Settings;
	onChange(key: NotificationSetting, value: boolean): void;
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
			{ITEMS.map(({ key, label }, index) => (
				<ItemSwitch
					key={key}
					first={!permissionOff && index === 0}
					label={t(`settings.notifications.${label}`)}
					value={settings.notifications[key]}
					onChange={(value) => onChange(key, value)}
				/>
			))}
		</ItemGroup>
	);
}
