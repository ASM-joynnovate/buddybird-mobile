import AppNavigator from '@/navigators/app-navigator';
import LoginNavigator from '@/navigators/login-navigator';
import AdEventsProvider from '@/providers/ad-events';
import AnalyticsProvider from '@/providers/analytics';
import DeviceProvider from '@/providers/device';
import FeedbackDialogProvider from '@/providers/feedback-dialog';
import { useAuthStore } from '@/stores/auth';

import StartupScreen from '@/components/app/startup';
import ErrorHandlingWrapper from '@/components/error-handling-wrapper';

/** 로그인 상태별 화면 컴포넌트 */
const AuthStatusContent = () => {
	const status = useAuthStore((state) => state.status);
	const authUserId = useAuthStore((state) => state.authUserId);

	const retryAuth = useAuthStore((state) => state.retry);

	const userRegistered = authUserId !== null;

	if (status === 'signedOut' || (status === 'completing' && !userRegistered)) {
		return <LoginNavigator />;
	}

	if (status !== 'signedIn') {
		return status === 'error' ? <StartupScreen onRetry={retryAuth} /> : <StartupScreen />;
	}

	// 사용자 변경 시 다시 마운트
	return (
		<ErrorHandlingWrapper
			key={authUserId}
			fallbackComponent={StartupScreen}
			suspenseFallback=<StartupScreen />
			fallbackDelayed={false}
		>
			<DeviceProvider>
				<AnalyticsProvider>
					<AdEventsProvider>
						<FeedbackDialogProvider>
							<AppNavigator />
						</FeedbackDialogProvider>
					</AdEventsProvider>
				</AnalyticsProvider>
			</DeviceProvider>
		</ErrorHandlingWrapper>
	);
};

export default AuthStatusContent;
