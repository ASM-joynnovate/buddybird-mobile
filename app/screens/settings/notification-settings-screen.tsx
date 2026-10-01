import type { RootStackParamList } from '@/types/navigation';

import { useTranslation } from 'react-i18next';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import NotificationGroups from '@/screens/settings/components/notification-groups';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

/** 알림 설정 화면 */
const NotificationSettingsScreen = () => {
	const { t } = useTranslation();

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

	return (
		<Screen>
			<ScreenHeader title={t('settings.notifications.title')} onBack={() => navigation.goBack()} />

			<ErrorHandlingWrapper
				fallbackComponent={ScreenError}
				suspenseFallback=<Skeleton blockCount={4} height={56} />
			>
				<NotificationGroups />
			</ErrorHandlingWrapper>
		</Screen>
	);
};

export default NotificationSettingsScreen;
