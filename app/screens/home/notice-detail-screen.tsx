import type { RootStackParamList } from '@/types/navigation';

import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';

import NoticeContent from '@/screens/home/components/notice-content';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Skeleton } from '@/components/ui/skeleton';

export function NoticeDetailScreen() {
	const navigation = useNavigation();
	const { params } = useRoute<RouteProp<RootStackParamList, 'NoticeDetail'>>();

	return (
		<Screen>
			{/*헤더*/}
			<ScreenHeader onBack={() => navigation.goBack()} />

			{/*공지 내용*/}
			<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<Skeleton rows={3} />>
				<NoticeContent noticeId={params.noticeId} />
			</ErrorHandlingWrapper>
		</Screen>
	);
}
