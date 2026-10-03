import type { RootStackParamList } from '@/types/navigation';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import NoticeContent from '@/screens/home/components/notice-content';
import NoticeContentSkeleton from '@/screens/home/components/notice-content-skeleton';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
/** 공지 상세 화면 */
const NoticeDetailScreen = () => {
	const navigation = useNavigation();
	const { params } = useRoute<RouteProp<RootStackParamList, 'NoticeDetail'>>();

	return (
		<Screen>
			<ScreenHeader onBack={() => navigation.goBack()} />

			<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<NoticeContentSkeleton />>
				<NoticeContent noticeId={params.noticeId} />
			</ErrorHandlingWrapper>
		</Screen>
	);
};

export default NoticeDetailScreen;
