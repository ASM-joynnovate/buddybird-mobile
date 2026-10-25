import { StyleSheet } from 'react-native';

import type { RootStackParamList } from '@/types/navigation';

import { useGetNotificationSettings } from '@/hooks/apis/settings';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import NotificationItemGroup from '@/screens/settings/components/notification-item-group';
import { colors } from '@/theme';

import { Copy } from '@/components/ui/copy';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';

/** 알림 그룹 설정 화면 */
const NotificationGroupSettingsScreen = () => {
	const navigation = useNavigation();
	const { groupId } = useRoute<RouteProp<RootStackParamList, 'NotificationGroupSettings'>>().params;

	const { data: notificationSettingsData } = useGetNotificationSettings();

	const group = notificationSettingsData.groups.find(({ id }) => id === groupId);

	return (
		<Screen>
			<ScreenHeader title={group?.title} onBack={() => navigation.goBack()} />

			{!!group?.description && <Copy style={styles.description}>{group.description}</Copy>}

			{group && <NotificationItemGroup settingItems={group.items} />}
		</Screen>
	);
};

const styles = StyleSheet.create({
	description: { color: colors.muted, lineHeight: 21, marginBottom: 12 },
});

export default NotificationGroupSettingsScreen;
