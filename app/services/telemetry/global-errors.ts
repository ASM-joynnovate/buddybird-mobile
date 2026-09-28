import { reportError } from '@/services/telemetry/client';

export function installGlobalErrorReporting() {
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
	const globalErrorHandler: Handler = (error, fatal) => {
		reportError(error, 'uncaught', fatal);
		previousHandler?.(error, fatal);
	};

	errorUtils?.setGlobalHandler(globalErrorHandler);
	// Preserve React Native's own reporting after recording rejection context.
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
}
