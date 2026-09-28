import type { NotificationSetting, Settings } from '@/types/apis/settings';

import { useTranslation } from 'react-i18next';

import type { SettingsMessages } from '@/i18n/types/settings';

import { TriangleAlertIcon } from 'lucide-react-native';

import { GroupedList } from '@/components/ui/grouped-list';
import { GroupedListNavItem } from '@/components/ui/grouped-list/nav-item';
import { GroupedListSwitchItem } from '@/components/ui/grouped-list/switch-item';

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
	permissionOff: boolean;
	onOpenPermissions(): void;
	onChange(key: NotificationSetting, value: boolean): void;
}

export function NotificationGroup({ settings, permissionOff, onOpenPermissions, onChange }: Props) {
	const { t } = useTranslation();

	return (
		<GroupedList title={t('settings.notifications.title')}>
			{permissionOff ? (
				<GroupedListNavItem
					first
					icon={TriangleAlertIcon}
					label={t('settings.notifications.permissionLink')}
					detail={t('settings.notifications.permissionOff')}
					onPress={onOpenPermissions}
				/>
			) : null}
			{ITEMS.map(({ key, label }, index) => (
				<GroupedListSwitchItem
					key={key}
					first={!permissionOff && index === 0}
					label={t(`settings.notifications.${label}`)}
					value={settings.notifications[key]}
					onChange={(value) => onChange(key, value)}
				/>
			))}
		</GroupedList>
	);
}
