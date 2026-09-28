import type { RootStackParamList } from '@/types/navigation';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import NoticeContent from '@/screens/home/components/notice-content';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

/** 뒤로 가기 버튼과 공지 제목, 날짜, 내용, 이미지를 보여 주는 화면 */
const NoticeDetailScreen = () => {
	const navigation = useNavigation();
	const { params } = useRoute<RouteProp<RootStackParamList, 'NoticeDetail'>>();

	return (
		<Screen>
			{/*뒤로 가기 버튼*/}
			<ScreenHeader onBack={() => navigation.goBack()} />

			{/*공지 제목, 날짜, 내용, 이미지*/}
			<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<Skeleton blockCount={3} />>
				<NoticeContent noticeId={params.noticeId} />
			</ErrorHandlingWrapper>
		</Screen>
	);
};

export default NoticeDetailScreen;
