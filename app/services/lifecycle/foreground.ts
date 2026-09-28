import { AppState } from 'react-native';

import { initializeTelemetry, reportError } from '@/services/telemetry/client';
import { installGlobalErrorReporting } from '@/services/telemetry/global-errors';
import { useDeviceSettingsStore } from '@/stores/device-settings';

function recordFeedbackDay(scope: string) {
	try {
		useDeviceSettingsStore.getState().countFeedbackDay();
	} catch (error) {
		reportError(error, scope);
	}
}

export function startForegroundServices() {
	const removeErrors = installGlobalErrorReporting();

	void initializeTelemetry().catch((error) => reportError(error, 'telemetry_start'));

	recordFeedbackDay('app_settings');

	let previous = AppState.currentState;

	const lifecycle = AppState.addEventListener('change', (next) => {
		if (next === 'active' && previous !== 'active') {
			void initializeTelemetry(false).catch((error) => reportError(error, 'telemetry_foreground'));

			recordFeedbackDay('foreground');
		}

		previous = next;
	});

	return () => {
		removeErrors();
		lifecycle.remove();
	};
}
