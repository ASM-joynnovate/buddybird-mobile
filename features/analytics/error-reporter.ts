import type { AnalyticsClient } from './client';

type ErrorContext = Record<string, string>;
type ReporterFn = (error: Error, context?: ErrorContext) => void;

let activeReporter: ReporterFn | null = null;

export function registerErrorReporter(client: AnalyticsClient): () => void {
  const reporter: ReporterFn = (error, context) => {
    void client.recordError(error, context);
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
