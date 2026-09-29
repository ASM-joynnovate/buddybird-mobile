import { AppState } from 'react-native';

import { initializeTelemetry, reportError } from '@/services/telemetry/client';
import { installGlobalErrorReporting } from '@/services/telemetry/global-errors';
import { useDeviceSettingsStore } from '@/stores/device-settings';

/** 피드백 요청 접속일을 세는 함수 */
const countFeedbackDay = (scope: string) => {
	try {
		useDeviceSettingsStore.getState().countFeedbackDay();
	} catch (e) {
		reportError(e, scope);
	}
};

/** 앱 서비스 시작 함수 */
export const startAppServices = () => {
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
};
