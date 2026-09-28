import { AppNavigator } from '@/navigators/app-navigator';
import { useAccountStore } from '@/stores/account';
import { useAuthStore } from '@/stores/auth';

import { AppRuntime } from '@/components/app/app-runtime';
import { StartupScreen } from '@/components/app/startup-screen';

interface Props {
	showDialogs: boolean;
}

export function AuthenticatedContent({ showDialogs }: Props) {
	const status = useAuthStore((auth) => auth.status);
	const retry = useAuthStore((auth) => auth.retry);

	const registered = useAccountStore((account) => account.registeredUser !== null);

	if (status === 'error') {
		return <StartupScreen startupFailed onRetry={retry} />;
	}

	if (status !== 'signedIn' && !(status === 'completing' && registered)) {
		return <StartupScreen startupFailed={false} onRetry={retry} />;
	}

	return (
		<>
			<AppNavigator />
			{showDialogs ? <AppRuntime /> : null}
		</>
	);
}
