import { AppNavigator } from '@/navigators/app-navigator';
import AnalyticsProvider from '@/providers/analytics';
import DeviceProvider from '@/providers/device';
import StartupDialogProvider from '@/providers/startup-dialog';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';

import { StartupScreen } from '@/components/app/startup-screen';
import ErrorHandlingWrapper from '@/components/error-handling-wrapper';

interface Props {
	splashFinished: boolean;
}

export function AuthenticatedContent({ splashFinished }: Props) {
	const status = useAuthStore((auth) => auth.status);
	const retry = useAuthStore((auth) => auth.retry);

	const registered = useAccountStore((account) => account.authUserId !== null);

	if (status !== 'signedIn' && !(status === 'completing' && registered)) {
		return status === 'error' ? <StartupScreen onRetry={retry} /> : <StartupScreen />;
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
}
