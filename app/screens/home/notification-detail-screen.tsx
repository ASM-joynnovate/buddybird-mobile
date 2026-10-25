import type { RootStackParamList } from '@/types/navigation';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import DetailContentSkeleton from '@/screens/home/components/detail-content-skeleton';
import NotificationContent from '@/screens/home/components/notification-content';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';

/** 알림 상세 화면 */
const NotificationDetailScreen = () => {
	const navigation = useNavigation();
	const { params } = useRoute<RouteProp<RootStackParamList, 'NotificationDetail'>>();

	return (
		<Screen>
			<ScreenHeader onBack={() => navigation.goBack()} />

			<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<DetailContentSkeleton />>
				<NotificationContent notificationId={params.notificationId} />
			</ErrorHandlingWrapper>
		</Screen>
	);
};

export default NotificationDetailScreen;
