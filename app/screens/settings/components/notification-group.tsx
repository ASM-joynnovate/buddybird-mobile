import type { NotificationSetting, Settings } from '@/types/apis/settings';

import type { RootStackParamList } from '@/types/navigation';

import usePermission from '@/hooks/use-permission';

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
	onChange: (setting: NotificationSetting, enabled: boolean) => void;
}

/**
 * 알림 설정 컴포넌트
 * @param settings 서버에 저장된 설정
 * @param onChange 알림 설정 변경 시 실행할 함수
 */
const NotificationGroup = ({ settings, onChange }: Props) => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const notificationPermission = usePermission('notifications');

	const permissionOff = notificationPermission.granted === false;

	return (
		<ItemGroup title={t('settings.notifications.title')}>
			{/*알림 권한이 꺼져 있으면 권한 설정 안내*/}
			{permissionOff && (
				<Item
					first
					icon={TriangleAlertIcon}
					label={t('settings.notifications.permissionLink')}
					detail={t('settings.notifications.permissionOff')}
					onPress={() => navigation.navigate('Permissions')}
				/>
			)}

			{/*알림 종류별 스위치*/}
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
};

export default NotificationGroup;
