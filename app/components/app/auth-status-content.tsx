import AppNavigator from '@/navigators/app-navigator';
import AnalyticsProvider from '@/providers/analytics';
import DeviceProvider from '@/providers/device';
import StartupDialogProvider from '@/providers/startup-dialog';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';

import StartupScreen from '@/components/app/startup-screen';
import ErrorHandlingWrapper from '@/components/error-handling-wrapper';

interface Props {
	splashFinished: boolean;
}

/**
 * 로그인 상태별 화면 컴포넌트
 * @param splashFinished 스플래시 종료 여부
 */
const AuthStatusContent = ({ splashFinished }: Props) => {
	const status = useAuthStore((state) => state.status);
	const retryAuth = useAuthStore((state) => state.retry);

	const authUserId = useAccountStore((state) => state.authUserId);

	const registered = authUserId !== null;

	if (status !== 'signedIn' && !(status === 'completing' && registered)) {
		return status === 'error' ? <StartupScreen onRetry={retryAuth} /> : <StartupScreen />;
	}

	return (
		<ErrorHandlingWrapper fallbackComponent={StartupScreen} suspenseFallback=<StartupScreen />>
			<DeviceProvider>
				<AnalyticsProvider>
					<StartupDialogProvider splashFinished={splashFinished}>
						<AppNavigator />
					</StartupDialogProvider>
				</AnalyticsProvider>
			</DeviceProvider>
		</ErrorHandlingWrapper>
	);
};

export default AuthStatusContent;
