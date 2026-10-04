import AppNavigator from '@/navigators/app-navigator';
import LoginNavigator from '@/navigators/login-navigator';
import AnalyticsProvider from '@/providers/analytics';
import DeviceProvider from '@/providers/device';
import StartupDialogProvider from '@/providers/startup-dialog';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';

import StartupScreen from '@/components/app/startup-screen';
import ErrorHandlingWrapper from '@/components/error-handling-wrapper';

/** 로그인 상태별 화면 컴포넌트 */
const AuthStatusContent = () => {
	const status = useAuthStore((state) => state.status);
	const retryAuth = useAuthStore((state) => state.retry);

	const authUserId = useAccountStore((state) => state.authUserId);

	const registered = authUserId !== null;

	if (status === 'signedOut' || (status === 'completing' && !registered)) {
		return <LoginNavigator />;
	}

	if (status !== 'signedIn' && !(status === 'completing' && registered)) {
		return status === 'error' ? <StartupScreen onRetry={retryAuth} /> : <StartupScreen />;
	}

	// 사용자가 바뀌면 다시 마운트
	return (
		<ErrorHandlingWrapper
			key={authUserId}
			fallbackComponent={StartupScreen}
			suspenseFallback=<StartupScreen />
			fallbackDelayed={false}
		>
			<DeviceProvider>
				<AnalyticsProvider>
					<StartupDialogProvider>
						<AppNavigator />
					</StartupDialogProvider>
				</AnalyticsProvider>
			</DeviceProvider>
		</ErrorHandlingWrapper>
	);
};

export default AuthStatusContent;
