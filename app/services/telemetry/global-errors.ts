import { reportError } from '@/services/telemetry/client';

/** 잡히지 않은 오류와 처리되지 않은 Promise 거부를 보고하도록 등록하고 되돌리는 함수 반환 */
export const installGlobalErrorReporting = () => {
	type Handler = (error: Error, fatal?: boolean) => void;
	const errorUtils = (
		globalThis as typeof globalThis & {
			ErrorUtils?: {
				getGlobalHandler: () => Handler;
				setGlobalHandler: (handler: Handler) => void;
			};
		}
	).ErrorUtils;
	const previousHandler = errorUtils?.getGlobalHandler();

	/** 잡히지 않은 오류를 보고하고 이전 전역 오류 핸들러 실행 */
	const globalErrorHandler: Handler = (error, fatal) => {
		reportError(error, 'uncaught', fatal);
		previousHandler?.(error, fatal);
	};

	errorUtils?.setGlobalHandler(globalErrorHandler);
	// 처리되지 않은 Promise 거부를 보고한 뒤 React Native 기본 경고도 유지
	// oxlint-disable-next-line typescript/no-require-imports, typescript/no-unsafe-member-access -- Native rejection hooks have no public typed entry.
	const rejectionTrackingOptions = require('react-native/Libraries/promiseRejectionTrackingOptions').default as {
		onUnhandled: (id: number, error: unknown) => void;
	};
	const previousOnUnhandled = rejectionTrackingOptions.onUnhandled;

	rejectionTrackingOptions.onUnhandled = (id, error) => {
		reportError(error, 'unhandled_rejection', false);
		previousOnUnhandled(id, error);
	};

	const hermes = (
		globalThis as typeof globalThis & {
			HermesInternal?: { enablePromiseRejectionTracker?: (options: typeof rejectionTrackingOptions) => void };
		}
	).HermesInternal;

	/** Hermes나 promise 라이브러리의 처리되지 않은 Promise 거부 추적 켜기 */
	const enableRejectionTracking = () => {
		if (hermes?.enablePromiseRejectionTracker) {
			hermes.enablePromiseRejectionTracker(rejectionTrackingOptions);
		} else {
			// oxlint-disable-next-line typescript/no-require-imports, typescript/no-unsafe-member-access -- Match React Native's fallback promise tracker.
			require('promise/setimmediate/rejection-tracking').enable(rejectionTrackingOptions);
		}
	};

	enableRejectionTracking();

	return () => {
		if (previousHandler && errorUtils?.getGlobalHandler() === globalErrorHandler) {
			errorUtils.setGlobalHandler(previousHandler);
		}

		rejectionTrackingOptions.onUnhandled = previousOnUnhandled;
		enableRejectionTracking();
	};
};
