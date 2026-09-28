import { useEffect, useState } from 'react';

import { Appearance } from 'react-native';

import { bootstrap } from '@/services/bootstrap';
import { connectQueryLifecycle } from '@/services/lifecycle/query-lifecycle';
import { reportError } from '@/services/telemetry/client';

export function useAppBootstrap() {
	const [bootstrapStatus, setBootstrapStatus] = useState<'loading' | 'ready' | 'failed' | 'headless'>('loading');

	const [retryCount, setRetryCount] = useState(0);

	useEffect(connectQueryLifecycle, []);

	useEffect(() => {
		// Keep native controls consistent with the app's light surfaces.
		Appearance.setColorScheme('light');
	}, []);

	useEffect(() => {
		let active = true;

		void bootstrap()
			.then((status) => {
				if (active) {
					setBootstrapStatus(status);
				}
			})
			.catch((error) => {
				reportError(error, 'bootstrap');

				if (active) {
					setBootstrapStatus('failed');
				}
			});

		return () => {
			active = false;
		};
	}, [retryCount]);

	function retry() {
		setBootstrapStatus('loading');
		setRetryCount((prev) => prev + 1);
	}

	const settled = bootstrapStatus !== 'loading';
	const ready = bootstrapStatus === 'ready' && settled;

	return { bootstrapStatus, ready, settled, retry };
}
