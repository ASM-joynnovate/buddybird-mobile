import { useCallback, useState } from 'react';

import { useAppBootstrap } from '@/hooks/use-app-bootstrap';

import { RootProviders } from '@/providers';

import { AppContent } from '@/components/app/app-content';
import { AppSplash } from '@/components/app/app-splash';
import { StartupScreen } from '@/components/app/startup-screen';

export function App() {
	const [splashFinished, setSplashFinished] = useState(false);

	const { state, ready, settled, retry } = useAppBootstrap();

	const finishSplash = useCallback(() => setSplashFinished(true), []);

	if (state === 'headless') {
		return null;
	}

	return (
		<RootProviders>
			{/*앱 화면*/}
			{ready ? (
				<AppContent showDialogs={splashFinished} />
			) : state === 'failed' ? (
				<StartupScreen onRetry={retry} />
			) : (
				<StartupScreen />
			)}

			{/*스플래시*/}
			{!splashFinished ? <AppSplash ready={settled} onComplete={finishSplash} /> : null}
		</RootProviders>
	);
}
