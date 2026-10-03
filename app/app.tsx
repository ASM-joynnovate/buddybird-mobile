import { useCallback } from 'react';

import useAppBootstrap from '@/hooks/use-app-bootstrap';

import * as Sentry from '@sentry/react-native';

import RootProviders from '@/providers';
import { useAppStore } from '@/stores/app';

import AppContent from '@/components/app/app-content';
import AppSplash from '@/components/app/app-splash';
import StartupScreen from '@/components/app/startup-screen';

/** 앱 최상위 컴포넌트 */
const App = () => {
	const { bootstrapStatus, ready, settled, retry } = useAppBootstrap();

	const splashFinished = useAppStore((state) => state.splashFinished);
	const setSplashFinished = useAppStore((state) => state.setSplashFinished);

	const handleFinishSplash = useCallback(() => setSplashFinished(true), [setSplashFinished]);

	if (bootstrapStatus === 'headless') {
		return null;
	}

	return (
		<RootProviders>
			{ready ? (
				<AppContent />
			) : bootstrapStatus === 'failed' ? (
				<StartupScreen onRetry={retry} />
			) : (
				<StartupScreen />
			)}

			{!splashFinished && <AppSplash bootstrapSettled={settled} onComplete={handleFinishSplash} />}
		</RootProviders>
	);
};

export default Sentry.wrap(App);
