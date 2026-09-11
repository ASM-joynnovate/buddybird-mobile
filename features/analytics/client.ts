import type { AnalyticsEvent } from './events';
import type { AnalyticsCommand, AnalyticsOutboxEntry, AnalyticsOutboxStore, AnalyticsUserProperties } from './event-outbox';
import type { AnalyticsProviderAdapter } from './providers/types';

export type { AnalyticsUserProperties } from './event-outbox';

export interface AnalyticsClient {
  init(): Promise<void>;
  initializeUserProperties(properties: AnalyticsUserProperties): void;
  startCollection(enabled: boolean, getUserId: () => string | null): Promise<void>;
  retryPending(): void;
  dispose(): void;
  setUserId(id: string | null): Promise<void>;
  setUserProperty(key: string, value: string | null): Promise<void>;
  setUserProperties(properties: AnalyticsUserProperties): Promise<void>;
  logEvent<E extends AnalyticsEvent>(event: E | Promise<E | null>, recoveryEvent?: AnalyticsEvent | Promise<AnalyticsEvent | null>): Promise<void>;
  setScreen(name: string, screenClass?: string): Promise<void>;
  recordError(error: Error, context?: Record<string, string>): Promise<void>;
  pauseSessionReplay(): Promise<void>;
  resumeSessionReplay(): Promise<void>;
}

export type ProviderFailureReporter = (providerName: string, operation: string, error: unknown) => void;
interface FanoutClientOptions {
  providers: readonly AnalyticsProviderAdapter[];
  outboxStore?: AnalyticsOutboxStore;
  onProviderFailure?: ProviderFailureReporter;
  getUserId?: () => string | null;
}

// 이전 인스턴스의 이미 시작된 저장이 끝난 뒤 새 인스턴스가 복원한다.
interface PreviousOwner { storage: Promise<void>; sdk: Promise<void> }
const storageOwners = new WeakMap<AnalyticsOutboxStore, () => PreviousOwner>();

export function createFanoutAnalyticsClient(options: FanoutClientOptions): AnalyticsClient {
  const { providers, outboxStore, onProviderFailure } = options;
  const states = providers.map((provider) => ({
    provider, initialized: false, enabled: false,
    properties: {} as Record<string, string | null>, userId: undefined as string | null | undefined,
  }));
  let entries: AnalyticsOutboxEntry[] = [];
  let loaded = false;
  let loadPromise: Promise<void> | null = null;
  let writes: Promise<void> = Promise.resolve();
  let initialProperties: AnalyticsUserProperties | null = null;
  let latestProperties: AnalyticsUserProperties | null = null;
  let collectionAllowed: boolean | null = null;
  let getUserId = options.getUserId ?? ((): string | null => null);
  let active = true;
  let retired = false;
  let draining = false;
  let requested = false;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let retryDelay = 1000;
  let sequence = 0;
  const instanceId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const completions = new Map<string, () => void>();
  const pendingCompletions: string[] = [];
  const dirty = new Map<string, AnalyticsOutboxEntry>();
  const removed = new Set<string>();
  const storageTasks = new Set<Promise<void>>();
  const providerTasks = new Set<Promise<void>>();
  const previousOwner = outboxStore ? storageOwners.get(outboxStore)?.() : undefined;
  if (outboxStore) storageOwners.set(outboxStore, () => {
    retired = true;
    active = false;
    if (retryTimer !== null) clearTimeout(retryTimer);
    retryTimer = null;
    return {
      storage: (async () => {
        await previousOwner?.storage;
        while (storageTasks.size > 0) await Promise.allSettled([...storageTasks]);
      })(),
      sdk: (async () => {
        await previousOwner?.sdk;
        while (providerTasks.size > 0) await Promise.allSettled([...providerTasks]);
      })(),
    };
  });
  let resolveReady!: () => void;
  const ready = new Promise<void>((resolve) => { resolveReady = resolve; });

  async function call(provider: AnalyticsProviderAdapter, operation: string, action: () => Promise<void>): Promise<void> {
    if (!active && operation !== 'recordError') return;
    const task = (async () => {
      try { await action(); }
      catch (error: unknown) {
        onProviderFailure?.(provider.name, operation, error);
        throw error;
      }
    })();
    if (operation !== 'recordError') providerTasks.add(task);
    try { await task; }
    finally { providerTasks.delete(task); }
  }

  function retryLater(error: unknown): void {
    console.warn('[analytics.outbox] delivery deferred; events retained', error);
    if (!active || retryTimer !== null) return;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      kick();
    }, retryDelay);
    retryDelay = Math.min(retryDelay * 2, 60000);
  }

  async function load(): Promise<void> {
    if (loaded) return;
    loadPromise ??= (async () => {
      await previousOwner?.storage;
      const restored = await outboxStore?.load() ?? [];
      sequence = restored.reduce((maximum, entry) => Math.max(maximum, entry.order), sequence);
      for (const entry of entries) { entry.order = ++sequence; dirty.set(entry.id, entry); }
      entries = [...restored.map((entry) => ({ ...entry, delivered: [...entry.delivered] })), ...entries];
      loaded = true;
    })().catch((error: unknown) => { loadPromise = null; throw error; });
    await loadPromise;
  }

  function persist(): Promise<void> {
    if (!active) return Promise.resolve();
    const task = (async () => {
      await load();
      const changed = [...dirty.values()].map((entry) => ({ ...entry, delivered: [...entry.delivered] }));
      const deleted = [...removed];
      dirty.clear();
      removed.clear();
      if (changed.length === 0 && deleted.length === 0) { await writes; return; }
      const write = writes.then(() => outboxStore?.write(changed, deleted));
      writes = write.then(() => undefined, () => undefined);
      try { await write; }
      catch (error: unknown) {
        for (const snapshot of changed) {
          const current = entries.find((entry) => entry.id === snapshot.id);
          if (current) dirty.set(current.id, current);
        }
        deleted.forEach((id) => removed.add(id));
        throw error;
      }
    })();
    storageTasks.add(task);
    void task.then(() => storageTasks.delete(task), () => storageTasks.delete(task));
    return task;
  }

  function storeAndKick(): void {
    if (!active) return;
    void persist().then(kick).catch(retryLater);
  }

  async function initialize(): Promise<void> {
    await previousOwner?.sdk;
    await Promise.all(states.map(async (state) => {
      if (state.initialized) return;
      await call(state.provider, 'init', () => state.provider.init());
      state.initialized = true;
    }));
  }

  async function applyProperties(state: typeof states[number], properties: AnalyticsUserProperties): Promise<void> {
    let failure: unknown;
    for (const [key, value] of Object.entries(properties)) {
      if (state.properties[key] === value) continue;
      try {
        await call(state.provider, 'setUserProperty', () => state.provider.setUserProperty(key, value));
        state.properties[key] = value;
      } catch (error: unknown) {
        delete state.properties[key];
        failure = error;
      }
    }
    if (failure !== undefined) throw failure;
  }

  async function applyUserId(state: typeof states[number], id: string | null): Promise<void> {
    if (state.userId === id) return;
    try {
      await call(state.provider, 'setUserId', () => state.provider.setUserId(id));
      state.userId = id;
    } catch (error: unknown) {
      state.userId = undefined;
      throw error;
    }
  }

  async function dispatch(state: typeof states[number], entry: AnalyticsOutboxEntry): Promise<void> {
    const { provider } = state;
    const command = entry.command;
    const metadata = { client_event_id: entry.id, client_event_time_ms: entry.occurredAt };
    if (entry.properties === null) entry.properties = { ...initialProperties! };
    if (entry.userId === undefined) entry.userId = getUserId();
    dirty.set(entry.id, entry);
    await persist();
    await applyProperties(state, entry.properties);
    await applyUserId(state, command.kind === 'userId' ? command.value : entry.userId);
    if (!active || collectionAllowed !== true) return;
    switch (command.kind) {
      case 'event': await call(provider, 'logEvent', () => provider.logEvent(command.name, { ...command.params, ...metadata })); break;
      case 'screen': await call(provider, 'setScreen', () => provider.setScreen(command.name, command.screenClass, metadata)); break;
      case 'properties': await applyProperties(state, command.values); break;
      case 'userId': break;
      case 'preparing': return;
    }
    entry.delivered.push(provider.name);
    dirty.set(entry.id, entry);
    // 성공한 provider는 다시 전송하지 않는다. SDK 수락과 저장 사이 강제 종료는 중복될 수 있다.
    await persist();
  }

  async function drain(): Promise<void> {
    if (!active) return;
    if (draining) { requested = true; return; }
    if (retryTimer !== null && collectionAllowed !== false) return;
    requested = false;
    draining = true;
    try {
      await load();
      if (collectionAllowed === false) {
        entries.forEach((entry) => removed.add(entry.id));
        entries = [];
        dirty.clear();
        await persist();
        completions.forEach((resolve) => resolve());
        completions.clear();
        resolveReady();
        return;
      }
      // 동의 미확정이나 프로필 복원 대기 중에도 로컬 저장은 진행한다.
      await persist();
      if (collectionAllowed !== true || initialProperties === null) return;
      await previousOwner?.sdk;
      if (!active || collectionAllowed !== true) return;
      const results = await Promise.allSettled(states.map(async (state) => {
        if (!state.initialized) {
          await call(state.provider, 'init', () => state.provider.init());
          state.initialized = true;
        }
        if (!active || collectionAllowed !== true) return;
        if (!state.enabled) {
          await applyProperties(state, initialProperties!);
          await applyUserId(state, getUserId());
          if (!active || collectionAllowed !== true) return;
          await call(state.provider, 'setEnabled', () => state.provider.setEnabled(true));
          state.enabled = true;
        }
        if (states.every((candidate) => candidate.enabled)) resolveReady();
        try {
          // provider마다 발생 순서를 유지한다. 실패한 provider만 재시도한다.
          for (const entry of [...entries]) {
            if (!active || collectionAllowed !== true) return;
            if (!entries.includes(entry) || entry.delivered.includes(state.provider.name)) continue;
            if (entry.command.kind === 'preparing') break;
            await persist();
            await dispatch(state, entry);
          }
        } finally {
          // 전송 실패 경로에서도 최신 속성과 UID를 복원한다.
          if (active && collectionAllowed === true && latestProperties) {
            try { await applyProperties(state, latestProperties); }
            finally { await applyUserId(state, getUserId()); }
          }
        }
      }));
      const completed = entries.filter((entry) =>
        entry.command.kind !== 'preparing' && states.every((state) => entry.delivered.includes(state.provider.name)));
      const completedIds = new Set(completed.map((entry) => entry.id));
      entries = entries.filter((entry) => !completedIds.has(entry.id));
      completed.forEach((entry) => { removed.add(entry.id); dirty.delete(entry.id); });
      pendingCompletions.push(...completed.map((entry) => entry.id));
      await persist();
      for (const id of pendingCompletions.splice(0)) {
        completions.get(id)?.();
        completions.delete(id);
      }
      const failure = results.find((result) => result.status === 'rejected');
      if (failure?.status === 'rejected') throw failure.reason;
      retryDelay = 1000;
    } catch (error: unknown) {
      retryLater(error);
    } finally {
      draining = false;
      if (requested) kick();
    }
  }

  function kick(): void { void drain(); }

  function enqueue(command: AnalyticsCommand): { entry: AnalyticsOutboxEntry; completion: Promise<void> } {
    const entry: AnalyticsOutboxEntry = {
      id: `${instanceId}-${++sequence}`, occurredAt: Date.now(), order: sequence, userId: getUserId() ?? (states.every((state) => state.enabled) ? null : undefined), command, properties: latestProperties ? { ...latestProperties } : null, delivered: [],
    };
    if (collectionAllowed === false) return { entry, completion: Promise.resolve() };
    const completion = new Promise<void>((resolve) => { completions.set(entry.id, resolve); });
    entries.push(entry);
    dirty.set(entry.id, entry);
    storeAndKick();
    return { entry, completion };
  }

  function setProperties(properties: AnalyticsUserProperties): Promise<void> {
    latestProperties = { ...latestProperties, ...properties };
    return enqueue({ kind: 'properties', values: { ...properties } }).completion;
  }

  async function bypass(operation: string, action: (provider: AnalyticsProviderAdapter) => Promise<void>): Promise<void> {
    if (operation !== 'recordError') await previousOwner?.sdk;
    await Promise.all(states.map(async ({ provider }) => {
      try { await call(provider, operation, () => action(provider)); }
      catch (error: unknown) { console.warn(`[analytics.${operation}]`, error); }
    }));
  }

  return {
    async init() {
      try { await initialize(); }
      catch (error: unknown) { retryLater(error); }
    },
    initializeUserProperties(properties) {
      if (initialProperties !== null) return;
      initialProperties = { ...properties };
      latestProperties = { ...properties, ...latestProperties };
      for (const entry of entries) {
        if (entry.properties === null) { entry.properties = { ...properties }; dirty.set(entry.id, entry); }
      }
      storeAndKick();
    },
    startCollection(enabled, currentUserId) {
      if (retired) return ready;
      active = true;
      collectionAllowed = enabled;
      getUserId = currentUserId;
      if (!enabled) {
        void bypass('setEnabled', (provider) => provider.setEnabled(false));
      }
      kick();
      return ready;
    },
    retryPending() {
      if (retired) return;
      active = true;
      if (retryTimer !== null) clearTimeout(retryTimer);
      retryTimer = null;
      kick();
    },
    dispose() {
      active = false;
      if (retryTimer !== null) clearTimeout(retryTimer);
      retryTimer = null;
    },
    setUserId(id) { return enqueue({ kind: 'userId', value: id }).completion; },
    setUserProperty(key, value) { return setProperties({ [key]: value }); },
    setUserProperties: setProperties,
    logEvent(event, recoveryEvent) {
      const { entry, completion } = enqueue({ kind: 'preparing' });
      if (recoveryEvent) {
        void Promise.resolve(recoveryEvent).then((value) => {
          if (!value || !entries.includes(entry) || entry.command.kind !== 'preparing') return;
          entry.recoveryEvent = { kind: 'event', name: value.name, params: { ...value.params } };
          dirty.set(entry.id, entry);
          storeAndKick();
        }).catch((error: unknown) => console.warn('[analytics.event] recovery preparation failed', error));
      }
      void Promise.resolve(event).catch((error: unknown) => {
        console.warn('[analytics.event] event preparation failed', error);
        return null;
      }).then((value) => {
        if (!entries.includes(entry)) return;
        if (value) {
          entry.command = { kind: 'event', name: value.name, params: { ...value.params } };
          delete entry.recoveryEvent;
          dirty.set(entry.id, entry);
        }
        else {
          entries = entries.filter((candidate) => candidate !== entry);
          dirty.delete(entry.id);
          removed.add(entry.id);
          completions.get(entry.id)?.();
          completions.delete(entry.id);
        }
        storeAndKick();
      });
      return completion;
    },
    setScreen(name, screenClass) { return enqueue({ kind: 'screen', name, screenClass }).completion; },
    recordError(error, context) { return bypass('recordError', (provider) => provider.recordError(error, context)); },
    pauseSessionReplay() { return bypass('pauseSessionReplay', (provider) => provider.pauseSessionReplay()); },
    resumeSessionReplay() { return bypass('resumeSessionReplay', (provider) => provider.resumeSessionReplay()); },
  };
}
