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
		(item) => item.kind === 'marketing' && !item.enabled,
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
			{settingItems.map((item, index) => (
				<ItemSwitch
					key={item.id}
					firstInGroup={index === 0}
					label={item.title}
					detail={item.description ?? undefined}
					value={item.enabled}
					disabled={isPending || pushSettingSaving || (item.kind === 'marketing_night' && marketingOff)}
					onChange={(enabled) => handleToggleItem(item.id, enabled)}
				/>
			))}
		</ItemGroup>
	);
};

export default NotificationItemGroup;
