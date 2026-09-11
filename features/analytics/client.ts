import type { AnalyticsEvent } from './events';
import type { AnalyticsProviderAdapter } from './providers/types';

export type AnalyticsUserProperties = Readonly<Record<string, string | null>>;

export interface AnalyticsClient {
  init(): Promise<void>;
  initializeUserProperties(properties: AnalyticsUserProperties): void;
  startCollection(enabled: boolean, getUserId: () => string | null): Promise<void>;
  setUserId(id: string | null): Promise<void>;
  setUserProperty(key: string, value: string | null): Promise<void>;
  setUserProperties(properties: AnalyticsUserProperties): Promise<void>;
  logEvent<E extends AnalyticsEvent>(event: E | Promise<E | null>): Promise<void>;
  setScreen(name: string, screenClass?: string): Promise<void>;
  recordError(error: Error, context?: Record<string, string>): Promise<void>;
  pauseSessionReplay(): Promise<void>;
  resumeSessionReplay(): Promise<void>;
}

export type ProviderFailureReporter = (providerName: string, operation: string, error: unknown) => void;

interface FanoutClientOptions {
  providers: readonly AnalyticsProviderAdapter[];
  onProviderFailure?: ProviderFailureReporter;
}

// 초기화 지연 중에도 앱은 동작한다. 이벤트 대기량만 제한하고 속성 변경은 보존한다.
const MAX_PENDING_EVENTS = 200;

interface PendingOperation {
  isEvent: boolean;
  run: () => Promise<void>;
  resolve: () => void;
}

export function createFanoutAnalyticsClient(options: FanoutClientOptions): AnalyticsClient {
  const { providers, onProviderFailure } = options;
  let resolveInitialProperties: (properties: AnalyticsUserProperties) => void;
  const initialProperties = new Promise<AnalyticsUserProperties>((resolve) => {
    resolveInitialProperties = resolve;
  });
  let propertiesInitialized = false;
  let initPromise: Promise<void> | null = null;
  let startPromise: Promise<void> | null = null;
  let collectionAllowed: boolean | null = null;
  let ready = false;
  let draining = false;
  let pendingEvents = 0;
  const pending: PendingOperation[] = [];
  let currentUserId: (() => string | null) | null = null;
  let appliedUserId: string | null | undefined;

  async function run(operation: string, action: (provider: AnalyticsProviderAdapter) => Promise<void>): Promise<void> {
    await Promise.all(providers.map(async (provider) => {
      try {
        await action(provider);
      } catch (error: unknown) {
        onProviderFailure?.(provider.name, operation, error);
      }
    }));
  }

  async function syncProperties(properties: AnalyticsUserProperties): Promise<void> {
    for (const [key, value] of Object.entries(properties)) {
      await run('setUserProperty', (provider) => provider.setUserProperty(key, value));
    }
  }

  async function syncUserId(): Promise<void> {
    if (!currentUserId) return;
    const id = currentUserId();
    if (id === appliedUserId) return;
    await run('setUserId', (provider) => provider.setUserId(id));
    appliedUserId = id;
  }

  async function drain(): Promise<void> {
    if (!ready || draining) return;
    draining = true;
    try {
      while (pending.length > 0) {
        const operation = pending.shift()!;
        if (operation.isEvent) pendingEvents -= 1;
        try {
          if (collectionAllowed) await operation.run();
        } finally {
          operation.resolve();
        }
      }
    } finally {
      draining = false;
    }
  }

  function enqueue(action: () => Promise<void>, isEvent = false): Promise<void> {
    if (collectionAllowed === false) return Promise.resolve();
    if (isEvent && pendingEvents >= MAX_PENDING_EVENTS) {
      console.warn('[analytics.queue] pending event limit reached; dropping event');
      return Promise.resolve();
    }
    if (isEvent) pendingEvents += 1;
    const completion = new Promise<void>((resolve) => {
      pending.push({ isEvent, run: action, resolve });
    });
    void drain();
    return completion;
  }

  return {
    init() {
      initPromise ??= run('init', (provider) => provider.init());
      return initPromise;
    },
    initializeUserProperties(properties) {
      if (propertiesInitialized) return;
      propertiesInitialized = true;
      resolveInitialProperties!({ ...properties });
    },
    startCollection(enabled, getUserId) {
      startPromise ??= (async () => {
        collectionAllowed = enabled;
        currentUserId = getUserId;
        await (initPromise ??= run('init', (provider) => provider.init()));
        if (enabled) {
          const properties = await initialProperties;
          await syncProperties(properties);
          await syncUserId();
        }
        await run('setEnabled', (provider) => provider.setEnabled(enabled));
        ready = true;
        void drain();
      })();
      return startPromise;
    },
    setUserId(id) {
      return enqueue(async () => {
        await run('setUserId', (provider) => provider.setUserId(id));
        appliedUserId = id;
      });
    },
    setUserProperty(key, value) {
      return enqueue(() => syncProperties({ [key]: value }));
    },
    setUserProperties(properties) {
      const snapshot = { ...properties };
      return enqueue(() => syncProperties(snapshot));
    },
    logEvent(event) {
      // 조회가 끝나기 전에 호출 순서를 예약하고 rejection도 즉시 처리한다.
      const resolved = Promise.resolve(event).catch((error: unknown) => {
        console.warn('[analytics.event] event preparation failed', error);
        return null;
      });
      return enqueue(async () => {
        const value = await resolved;
        if (!value) return;
        await syncUserId();
        await run('logEvent', (provider) => provider.logEvent(value.name, value.params ?? {}));
      }, true);
    },
    setScreen(name, screenClass) {
      return enqueue(async () => {
        await syncUserId();
        await run('setScreen', (provider) => provider.setScreen(name, screenClass));
      }, true);
    },
    recordError(error, context) {
      // 오류 기록은 GA 초기화나 지표 조회를 기다리지 않는다.
      return run('recordError', (provider) => provider.recordError(error, context));
    },
    pauseSessionReplay() {
      return run('pauseSessionReplay', (provider) => provider.pauseSessionReplay());
    },
    resumeSessionReplay() {
      return run('resumeSessionReplay', (provider) => provider.resumeSessionReplay());
    },
  };
}
