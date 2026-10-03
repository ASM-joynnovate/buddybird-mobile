import { AppState } from 'react-native';

import { initializeTelemetry, reportError, track } from '@/services/telemetry/client';
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
	void initializeTelemetry()
		.then((consent) => useDeviceSettingsStore.getState().setAnalyticsConsent(consent))
		.catch((error) => reportError(error, 'telemetry_start'));

	countFeedbackDay('app_settings');

	let previousAppState = AppState.currentState;
	let appBackgrounded = previousAppState === 'background';

	const appStateSubscription = AppState.addEventListener('change', (appState) => {
		if (appState === 'active' && previousAppState !== 'active') {
			const appReturnedFromBackground = appBackgrounded;

			appBackgrounded = false;

			void initializeTelemetry(false)
				.then((consent) => {
					useDeviceSettingsStore.getState().setAnalyticsConsent(consent);

					if (appReturnedFromBackground) {
						track('app_foregrounded', {});
					}
				})
				.catch((error) => reportError(error, 'telemetry_foreground'));

			countFeedbackDay('foreground');
		} else if (appState === 'background' && !appBackgrounded) {
			appBackgrounded = true;

			track('app_backgrounded', {});
		}

		previousAppState = appState;
	});

	return () => {
		appStateSubscription.remove();
	};
};
