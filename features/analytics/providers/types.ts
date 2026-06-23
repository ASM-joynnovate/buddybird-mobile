export type AnalyticsParamValue = string | number | boolean | null | undefined;

export type AnalyticsParams = Record<string, AnalyticsParamValue | readonly AnalyticsParamValue[]>;

export interface AnalyticsProviderAdapter {
  readonly name: string;
  /**
   * `recordError` 가 실제로 에러를 캡처하는지 여부. fanout 은 모든 provider 에 도달하지만
   * 일부 provider(예: Clarity)는 `recordError` 가 의도된 no-op 다 — 이 플래그로 그
   * "조용한 누락" 을 인터페이스 차원에서 드러낸다. fanout 동작 자체는 바꾸지 않는다.
   */
  readonly supportsErrorReporting: boolean;
  init(): Promise<void>;
  setUserId(id: string | null): Promise<void>;
  setUserProperty(key: string, value: string | null): Promise<void>;
  logEvent(name: string, params: AnalyticsParams): Promise<void>;
  setScreen(name: string, screenClass?: string): Promise<void>;
  setEnabled(enabled: boolean): Promise<void>;
  recordError(error: Error, context?: Record<string, string>): Promise<void>;
}
