import { useGetSettings, useUpdateNotificationSettings, useUpdateSleepSettings } from '@/hooks/apis/settings';

import { useTranslation } from 'react-i18next';

import NotificationGroup from '@/screens/settings/components/notification-group';

import SleepTimePicker from '@/components/session/sleep-time-picker';
import { InlineError } from '@/components/ui/inline-error';
import { ItemGroup } from '@/components/ui/item/group';

/** 수면 시간과 알림 설정 컴포넌트 */
const SleepAndNotificationGroups = () => {
	const { t } = useTranslation();

	const { data: settingsData } = useGetSettings();

	const updateSleepSettings = useUpdateSleepSettings();
	const updateNotificationSettings = useUpdateNotificationSettings();

	const saveFailed = updateSleepSettings.isError || updateNotificationSettings.isError;

	return (
		<>
			<ItemGroup title={t('settings.care.title')}>
				<SleepTimePicker
					value={settingsData.sleep}
					first
					onChange={(sleep) => updateSleepSettings.mutate({ data: sleep })}
				/>
			</ItemGroup>

			<NotificationGroup
				settings={settingsData}
				onChange={(key, value) =>
					updateNotificationSettings.mutate({ data: { ...settingsData.notifications, [key]: value } })
				}
			/>

			<InlineError message={saveFailed ? t('settings.saveError') : null} />
		</>
	);
};

export default SleepAndNotificationGroups;
