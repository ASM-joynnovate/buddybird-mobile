import type { NotificationSettingItem } from '@/types/apis/settings';

import { useGetNotificationSettings } from '@/hooks/apis/settings';

import { allNotificationSettingItems } from '@/utils/notification-setting-items';

import { ItemGroup } from '@/components/ui/item/group';
import { ItemSwitch } from '@/components/ui/item/switch';

interface Props {
	items: NotificationSettingItem[];
	disabled: boolean;
	onToggle: (itemId: string, enabled: boolean) => void;
}

/**
 * 알림 설정 항목 스위치 목록 컴포넌트
 * @param items 스위치로 표시할 항목
 * @param disabled 모든 스위치를 누를 수 없는지 여부
 * @param onToggle 스위치를 누르면 실행할 함수
 */
const NotificationItemGroup = ({ items, disabled, onToggle }: Props) => {
	const { data: notificationSettingsData } = useGetNotificationSettings();

	const marketingOff = allNotificationSettingItems(notificationSettingsData).some(
		(item) => item.kind === 'marketing' && !item.enabled,
	);

	return (
		<ItemGroup>
			{items.map((item, index) => (
				<ItemSwitch
					key={item.id}
					first={index === 0}
					label={item.title}
					detail={item.description ?? undefined}
					value={item.enabled}
					disabled={disabled || (item.kind === 'marketing_night' && marketingOff)}
					onChange={(enabled) => onToggle(item.id, enabled)}
				/>
			))}
		</ItemGroup>
	);
};

export default NotificationItemGroup;
