import { AppNavigator } from '@/navigators/app-navigator';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';

import { AppRuntime } from '@/components/app/app-runtime';
import { StartupScreen } from '@/components/app/startup-screen';
import ErrorHandlingWrapper from '@/components/error-handling-wrapper';

interface Props {
	showDialogs: boolean;
}

export function AuthenticatedContent({ showDialogs }: Props) {
	const status = useAuthStore((auth) => auth.status);
	const retry = useAuthStore((auth) => auth.retry);

	const registered = useAccountStore((account) => account.registeredUser !== null);

	if (status !== 'signedIn' && !(status === 'completing' && registered)) {
		return status === 'error' ? <StartupScreen onRetry={retry} /> : <StartupScreen />;
	}

	return (
		<ErrorHandlingWrapper fallbackComponent={StartupScreen} suspenseFallback=<StartupScreen />>
			{/*앱 화면*/}
			<AppNavigator />

			{/*업데이트 안내와 의견 다이얼로그*/}
			{showDialogs ? <AppRuntime /> : null}
		</ErrorHandlingWrapper>
	);
}
