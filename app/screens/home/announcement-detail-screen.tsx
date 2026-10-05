import type { RootStackParamList } from '@/types/navigation';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import AnnouncementContent from '@/screens/home/components/announcement-content';
import AnnouncementContentSkeleton from '@/screens/home/components/announcement-content-skeleton';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
/** 공지 상세 화면 */
const AnnouncementDetailScreen = () => {
	const navigation = useNavigation();
	const { params } = useRoute<RouteProp<RootStackParamList, 'AnnouncementDetail'>>();

	return (
		<Screen>
			<ScreenHeader onBack={() => navigation.goBack()} />

			<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<AnnouncementContentSkeleton />>
				<AnnouncementContent announcementId={params.announcementId} />
			</ErrorHandlingWrapper>
		</Screen>
	);
};

export default AnnouncementDetailScreen;
