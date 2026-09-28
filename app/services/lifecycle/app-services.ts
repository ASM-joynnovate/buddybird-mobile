import { AppState } from 'react-native';

import { initializeTelemetry, reportError } from '@/services/telemetry/client';
import { installGlobalErrorReporting } from '@/services/telemetry/global-errors';
import { useDeviceSettingsStore } from '@/stores/device-settings';

function countFeedbackDay(scope: string) {
	try {
		useDeviceSettingsStore.getState().countFeedbackDay();
	} catch (error) {
		reportError(error, scope);
	}
}

export function startAppServices() {
	const removeErrorReporting = installGlobalErrorReporting();

	void initializeTelemetry().catch((error) => reportError(error, 'telemetry_start'));

	countFeedbackDay('app_settings');

	let previousAppState = AppState.currentState;

	const appStateSubscription = AppState.addEventListener('change', (appState) => {
		if (appState === 'active' && previousAppState !== 'active') {
			void initializeTelemetry(false).catch((error) => reportError(error, 'telemetry_foreground'));

			countFeedbackDay('foreground');
		}

		previousAppState = appState;
	});

	return () => {
		removeErrorReporting();
		appStateSubscription.remove();
	};
}
