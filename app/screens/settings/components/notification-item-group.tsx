import type { NotificationSettingItem } from '@/types/apis/settings';

import { useGetNotificationSettings, useUpdateNotificationSettingItem } from '@/hooks/apis/settings';

import { useTranslation } from 'react-i18next';

import { toast } from 'sonner-native';

import { allNotificationSettingItems } from '@/utils/notification-setting-items';

import { ItemGroup } from '@/components/ui/item/group';
import { ItemSwitch } from '@/components/ui/item/switch';
import { Toast } from '@/components/ui/toast';

interface Props {
	settingItems: NotificationSettingItem[];
	pushSettingSaving?: boolean;
}

/**
 * 알림 설정 항목 스위치 목록 컴포넌트
 * @param settingItems 스위치로 표시할 항목
 * @param pushSettingSaving 전체 알림 설정 저장 중 여부
 */
const NotificationItemGroup = ({ settingItems, pushSettingSaving = false }: Props) => {
	const { t } = useTranslation();

	const { data: notificationSettingsData } = useGetNotificationSettings();

	const { isPending, mutate } = useUpdateNotificationSettingItem();

	const marketingOff = allNotificationSettingItems(notificationSettingsData).some(
		(settingItem) => settingItem.kind === 'marketing' && !settingItem.enabled,
	);

	const handleToggleItem = (itemId: string, enabled: boolean) => {
		if (isPending || pushSettingSaving) {
			return;
		}

		mutate(
			{ id: itemId, data: { enabled } },
			{
				onError: () => {
					toast.custom(<Toast variant="error" message={t('settings.saveError')} />);
				},
			},
		);
	};

	return (
		<ItemGroup>
			{settingItems.map((settingItem, index) => (
				<ItemSwitch
					key={settingItem.id}
					isFirstInGroup={index === 0}
					label={settingItem.title}
					detail={settingItem.description ?? undefined}
					value={settingItem.enabled}
					disabled={
						isPending || pushSettingSaving || (settingItem.kind === 'marketing_night' && marketingOff)
					}
					onChange={(enabled) => handleToggleItem(settingItem.id, enabled)}
				/>
			))}
		</ItemGroup>
	);
};

export default NotificationItemGroup;
