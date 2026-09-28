import type { RootStackParamList } from '@/types/navigation';

import { usePermission } from '@/hooks/use-permission';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { NotificationGroup } from '@/screens/settings/components/notification-group';
import { useSettingsUpdate } from '@/screens/settings/hooks/use-settings-update';

import { SleepTimePicker } from '@/components/session/sleep-time-picker';
import { GroupedList } from '@/components/ui/grouped-list';
import { InlineError } from '@/components/ui/inline-error';

/** 수면 시간과 알림 설정 그룹 컴포넌트 */
const SleepAndNotificationGroups = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	const form = useSettingsUpdate();

	const notificationPermission = usePermission('notifications');

	const settings = form.settings;

	return (
		<>
			{/*수면 시간*/}
			<GroupedList title={t('settings.care.title')}>
				<SleepTimePicker value={settings.sleep} first onChange={form.updateSleep} />
			</GroupedList>

			{/*알림*/}
			<NotificationGroup
				settings={settings}
				permissionOff={notificationPermission.granted === false}
				onOpenPermissions={() => navigation.navigate('Permissions')}
				onChange={(key, value) => form.updateNotifications({ ...settings.notifications, [key]: value })}
			/>

			{/*저장 실패 안내*/}
			<InlineError message={form.saveFailed ? t('settings.saveError') : null} />
		</>
	);
};

export default SleepAndNotificationGroups;
