import type { AnalyticsClient } from './client';

type GlobalErrorHandler = (error: Error, isFatal: boolean) => void;

interface ErrorUtilsLike {
  getGlobalHandler(): GlobalErrorHandler | undefined;
  setGlobalHandler(handler: GlobalErrorHandler): void;
}

declare const ErrorUtils: ErrorUtilsLike | undefined;

export interface InstallErrorReportingOptions {
  client: AnalyticsClient;
  getCurrentScreen?: () => string | null;
}

export function installGlobalErrorReporting(options: InstallErrorReportingOptions): () => void {
  const { client, getCurrentScreen } = options;

  const previousHandler = typeof ErrorUtils !== 'undefined' ? ErrorUtils.getGlobalHandler() : undefined;

  const handler: GlobalErrorHandler = (error, isFatal) => {
    const screen = getCurrentScreen?.() ?? null;
    const context: Record<string, string> = {
      is_fatal: String(isFatal),
    };

    if (screen) {
      context.screen_name = screen;
    }

    void client.recordError(error, context);
    void client.logEvent({
      name: 'app_error',
      params: {
        error_code: error.name || 'UnknownError',
        screen_name: screen,
      },
    });

    if (previousHandler) {
      previousHandler(error, isFatal);
    }
  };

  if (typeof ErrorUtils !== 'undefined') {
    ErrorUtils.setGlobalHandler(handler);
  }

  const rejectionTracker = trackUnhandledRejections((reason) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    handler(error, false);
  });

  return () => {
    if (typeof ErrorUtils !== 'undefined' && previousHandler) {
      ErrorUtils.setGlobalHandler(previousHandler);
    }
    rejectionTracker.uninstall();
  };
}

interface RejectionTracker {
  uninstall(): void;
}

function trackUnhandledRejections(onRejection: (reason: unknown) => void): RejectionTracker {
  const globalRef = globalThis as typeof globalThis & {
    HermesInternal?: { enablePromiseRejectionTracker?: (options: object) => void };
  };

  if (globalRef.HermesInternal?.enablePromiseRejectionTracker) {
    globalRef.HermesInternal.enablePromiseRejectionTracker({
      allRejections: true,
      onUnhandled: (_id: number, rejection: unknown) => {
        onRejection(rejection);
      },
    });
    return { uninstall: () => {} };
  }

  return { uninstall: () => {} };
}
