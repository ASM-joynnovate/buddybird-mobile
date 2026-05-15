export type AnalyticsParamValue = string | number | boolean | null | undefined;

export type AnalyticsParams = Record<string, AnalyticsParamValue | readonly AnalyticsParamValue[]>;

export interface AnalyticsProviderAdapter {
  readonly name: string;
  init(): Promise<void>;
  setUserId(id: string | null): Promise<void>;
  setUserProperty(key: string, value: string | null): Promise<void>;
  logEvent(name: string, params: AnalyticsParams): Promise<void>;
  setScreen(name: string, screenClass?: string): Promise<void>;
  setEnabled(enabled: boolean): Promise<void>;
  recordError(error: Error, context?: Record<string, string>): Promise<void>;
}
