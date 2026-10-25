import { useCallback } from 'react';

import useAppBootstrap from '@/hooks/use-app-bootstrap';

import * as Sentry from '@sentry/react-native';

import RootProviders from '@/providers';
import { hotUpdater } from '@/services/hot-updater/client';
import { useAppStore } from '@/stores/app';

import AppContent from '@/components/app/app-content';
import AppSplash from '@/components/app/app-splash';
import StartupScreen from '@/components/app/startup';
import StartupOverlay from '@/components/app/startup/startup-overlay';

/** 앱 최상위 컴포넌트 */
const App = () => {
	const splashFinished = useAppStore((state) => state.splashFinished);
	const startupOverlayShown = useAppStore((state) => state.startupOverlayShown);

	const setSplashFinished = useAppStore((state) => state.setSplashFinished);

	const { bootstrapStatus, ready, settled, retry } = useAppBootstrap();

	const handleFinishSplash = useCallback(() => setSplashFinished(true), [setSplashFinished]);

	if (bootstrapStatus === 'headless') {
		return null;
	}

	return (
		<>
			{!ready && <StartupScreen onRetry={bootstrapStatus === 'failed' ? retry : undefined} />}

			<RootProviders>
				{ready && <AppContent />}

				{startupOverlayShown && <StartupOverlay />}

				{!splashFinished && <AppSplash bootstrapSettled={settled} onComplete={handleFinishSplash} />}
			</RootProviders>
		</>
	);
};

export default Sentry.wrap(hotUpdater.wrap({ updateStrategy: 'fingerprint' })<Record<string, unknown>>(App));
