import { reportError } from "@/services/telemetry/client"

export function installGlobalErrorReporting() {
	type Handler = (error: Error, fatal?: boolean) => void
	const errors = (
		globalThis as typeof globalThis & {
			ErrorUtils?: {
				getGlobalHandler: () => Handler
				setGlobalHandler: (handler: Handler) => void
			}
		}
	).ErrorUtils
	const previous = errors?.getGlobalHandler()
	const handler: Handler = (error, fatal) => {
		reportError(error, "uncaught", fatal)
		previous?.(error, fatal)
	}

	errors?.setGlobalHandler(handler)
	// Preserve React Native's own reporting after recording rejection context.
	// oxlint-disable-next-line typescript/no-require-imports, typescript/no-unsafe-member-access -- Native rejection hooks have no public typed entry.
	const rejection = require("react-native/Libraries/promiseRejectionTrackingOptions").default as {
		onUnhandled: (id: number, error: unknown) => void
	}
	const previousRejection = rejection.onUnhandled

	rejection.onUnhandled = (id, error) => {
		reportError(error, "unhandled_rejection", false)
		previousRejection(id, error)
	}

	const hermes = (
		globalThis as typeof globalThis & {
			HermesInternal?: { enablePromiseRejectionTracker?: (options: typeof rejection) => void }
		}
	).HermesInternal
	const enableTracking = () => {
		if (hermes?.enablePromiseRejectionTracker) {
			hermes.enablePromiseRejectionTracker(rejection)
		} else {
			// oxlint-disable-next-line typescript/no-require-imports, typescript/no-unsafe-member-access -- Match React Native's fallback promise tracker.
			require("promise/setimmediate/rejection-tracking").enable(rejection)
		}
	}

	enableTracking()

	return () => {
		if (previous && errors?.getGlobalHandler() === handler) {
			errors.setGlobalHandler(previous)
		}

		rejection.onUnhandled = previousRejection
		enableTracking()
	}
}
