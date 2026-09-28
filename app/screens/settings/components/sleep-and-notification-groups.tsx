import { useGetSettings, useUpdateNotificationSettings, useUpdateSleepSettings } from '@/hooks/apis/settings';

import { useTranslation } from 'react-i18next';

import NotificationGroup from '@/screens/settings/components/notification-group';

import SleepTimePicker from '@/components/session/sleep-time-picker';
import { InlineError } from '@/components/ui/inline-error';
import { ItemGroup } from '@/components/ui/item/group';

/** 앵무새 케어의 수면 시간 선택과 알림 스위치를 보여 주고 바꾸면 서버에 저장하는 컴포넌트 */
const SleepAndNotificationGroups = () => {
	const { t } = useTranslation();

	const { data: settingsData } = useGetSettings();

	const updateSleepSettings = useUpdateSleepSettings();
	const updateNotificationSettings = useUpdateNotificationSettings();

	const saveFailed = updateSleepSettings.isError || updateNotificationSettings.isError;

	return (
		<>
			{/*수면 시간*/}
			<ItemGroup title={t('settings.care.title')}>
				<SleepTimePicker
					value={settingsData.sleep}
					first
					onChange={(sleep) => updateSleepSettings.mutate({ data: sleep })}
				/>
			</ItemGroup>

			{/*알림*/}
			<NotificationGroup
				settings={settingsData}
				onChange={(key, value) =>
					updateNotificationSettings.mutate({ data: { ...settingsData.notifications, [key]: value } })
				}
			/>

			{/*저장 실패 안내*/}
			<InlineError message={saveFailed ? t('settings.saveError') : null} />
		</>
	);
};

export default SleepAndNotificationGroups;
