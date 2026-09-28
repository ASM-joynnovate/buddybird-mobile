import { useCallback, useState } from 'react';

import { useAppBootstrap } from '@/hooks/use-app-bootstrap';

import { RootProviders } from '@/providers';

import { AppContent } from '@/components/app/app-content';
import { AppSplash } from '@/components/app/app-splash';
import { StartupScreen } from '@/components/app/startup-screen';

export function App() {
	const [splashFinished, setSplashFinished] = useState(false);

	const { bootstrapStatus, ready, settled, retry } = useAppBootstrap();

	const finishSplash = useCallback(() => setSplashFinished(true), []);

	if (bootstrapStatus === 'headless') {
		return null;
	}

	return (
		<RootProviders>
			{/*앱 화면*/}
			{ready ? (
				<AppContent splashFinished={splashFinished} />
			) : bootstrapStatus === 'failed' ? (
				<StartupScreen onRetry={retry} />
			) : (
				<StartupScreen />
			)}

			{/*스플래시*/}
			{!splashFinished ? <AppSplash bootstrapSettled={settled} onComplete={finishSplash} /> : null}
		</RootProviders>
	);
}
