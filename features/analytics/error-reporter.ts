import type { AnalyticsClient } from './client';

/**
 * 에러 scope 도메인. 새 도메인을 추가할 때만 이 union을 수정한다 —
 * `<domain>.<method>` 의 method 부분은 자유롭게 둬, scope 하나 추가할 때마다
 * 타입을 고쳐야 하는 마찰을 피한다.
 */
export type ErrorDomain =
  | 'analytics'
  | 'app-update'
  | 'audio'
  | 'global'
  | 'i18n'
  | 'notifications'
  | 'profile'
  | 'training'
  | 'word-library'
  | 'words';

/**
 * `<domain>` 또는 `<domain>.<method>` 형태로 도메인 prefix만 강제하는 가벼운 제약.
 * 자유 string 이 아니라 알려진 도메인으로 시작해야 해, 오타·임의 scope 가 컴파일 에러가 된다.
 */
export type ErrorScope = ErrorDomain | `${ErrorDomain}.${string}`;

/**
 * 에러 보고 컨텍스트. 알려진 키만 허용해 키 오타가 컴파일 에러가 되도록 한다.
 * 값은 전부 string — provider 경계(`recordError: Record<string, string>`)로 흐를 수 있게 유지.
 */
export interface ErrorContext {
  scope: ErrorScope;
  screen_name?: string;
  is_fatal?: string;
}

type ReporterFn = (error: Error, context?: ErrorContext) => void;

let activeReporter: ReporterFn | null = null;

/**
 * 인덱스 시그니처 없는 `ErrorContext`를 provider 경계가 받는 `Record<string, string>`로
 * 평탄화한다. 정의된 키만 복사해 현행 fanout 동작(undefined 키 미전달)을 보존한다.
 */
function toContextRecord(context: ErrorContext): Record<string, string> {
  const record: Record<string, string> = { scope: context.scope };
  if (context.screen_name !== undefined) {
    record.screen_name = context.screen_name;
  }
  if (context.is_fatal !== undefined) {
    record.is_fatal = context.is_fatal;
  }
  return record;
}

// --- 수동/스코프별 보고 ---

export function registerErrorReporter(client: AnalyticsClient): () => void {
  const reporter: ReporterFn = (error, context) => {
    void client.recordError(error, context ? toContextRecord(context) : undefined);
  };
  activeReporter = reporter;
  return () => {
    if (activeReporter === reporter) {
      activeReporter = null;
    }
  };
}

export function reportError(error: unknown, context?: ErrorContext): void {
  const wrapped = error instanceof Error ? error : new Error(String(error));
  const scope = context?.scope ?? 'unknown';
  console.warn(`[error] ${scope}:`, wrapped.message, wrapped);
  if (activeReporter) {
    activeReporter(wrapped, context);
  }
}

// --- 전역 uncaught 핸들러 설치 ---

/** 전역 uncaught 핸들러가 보고하는 고정 scope. 하드코딩 대신 명명 상수로 둔다. */
const GLOBAL_UNCAUGHT_SCOPE: ErrorScope = 'global.uncaught';

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
    const context: ErrorContext = {
      scope: GLOBAL_UNCAUGHT_SCOPE,
      is_fatal: String(isFatal),
      ...(screen ? { screen_name: screen } : {}),
    };

    void client.recordError(error, toContextRecord(context));
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
