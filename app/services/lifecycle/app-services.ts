import { AppState } from 'react-native';

import { initializeTelemetry, reportError } from '@/services/telemetry/client';
import { installGlobalErrorReporting } from '@/services/telemetry/global-errors';
import { useDeviceSettingsStore } from '@/stores/device-settings';

/** 의견 요청 팝업에 쓰는 접속일 세기, 실패하면 보고 */
const countFeedbackDay = (scope: string) => {
	try {
		useDeviceSettingsStore.getState().countFeedbackDay();
	} catch (e) {
		reportError(e, scope);
	}
};

/** 전역 오류 보고 등록, 앱을 시작할 때와 다시 열 때마다 분석 동의 확인과 접속일 세기 */
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
