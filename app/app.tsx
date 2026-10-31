import { useCallback, useEffect } from 'react';

import useAppBootstrap from '@/hooks/use-app-bootstrap';

import * as Sentry from '@sentry/react-native';
import * as SplashScreen from 'expo-splash-screen';

import RootProviders from '@/providers';
import { hotUpdater } from '@/services/hot-updater/client';
import { reportError } from '@/services/telemetry/client';
import { useAppStore } from '@/stores/app';
import { useDeviceSettingsStore } from '@/stores/device-settings';

import AppContent from '@/components/app/app-content';
import AppSplash from '@/components/app/app-splash';
import AppUpdateFallback from '@/components/app/app-update-fallback';
import StartupScreen from '@/components/app/startup';
import StartupOverlay from '@/components/app/startup/startup-overlay';

/** 앱 최상위 컴포넌트 */
const App = () => {
	const splashFinished = useAppStore((state) => state.splashFinished);
	const startupOverlayShown = useAppStore((state) => state.startupOverlayShown);
	const splashShown = useDeviceSettingsStore((state) => state.splashShown);

	const setSplashFinished = useAppStore((state) => state.setSplashFinished);
	const setSplashShown = useDeviceSettingsStore((state) => state.setSplashShown);

	const { bootstrapStatus, ready, settled, retry } = useAppBootstrap();

	/** 업데이트 전에 스플래시를 보였으면 건너뛰기 */
	useEffect(() => {
		if (!splashShown) {
			return;
		}

		setSplashShown(false);
		setSplashFinished(true);

		void SplashScreen.hideAsync().catch((error) => reportError(error, 'splash'));
	}, [setSplashFinished, setSplashShown, splashShown]);

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

				{!splashFinished && !splashShown && (
					<AppSplash bootstrapSettled={settled} onComplete={handleFinishSplash} />
				)}
			</RootProviders>
		</>
	);
};

export default Sentry.wrap(
	hotUpdater.wrap({ updateStrategy: 'fingerprint', fallbackComponent: AppUpdateFallback })<Record<string, unknown>>(
		App,
	),
);
