import CommunityContent from '@/screens/community/components/community-content';
import CommunitySkeleton from '@/screens/community/components/community-skeleton';

import ErrorHandlingWrapper from '@/components/error-handling-wrapper';
import { Screen } from '@/components/ui/screen';
import { ScreenError } from '@/components/ui/screen-error';

/** 커뮤니티 화면 */
const CommunityScreen = () => {
	return (
		<Screen scrollable={false}>
			<ErrorHandlingWrapper fallbackComponent={ScreenError} suspenseFallback=<CommunitySkeleton />>
				<CommunityContent />
			</ErrorHandlingWrapper>
		</Screen>
	);
};

export default CommunityScreen;
