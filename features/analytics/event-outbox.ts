import AsyncStorage from '@react-native-async-storage/async-storage';

import { persistKeyedStore } from '@/features/shared/persist-keyed-store';

import type { AnalyticsParams } from './providers/types';

export type AnalyticsUserProperties = Readonly<Record<string, string | null>>;
export type AnalyticsCommand =
  | { kind: 'event'; name: string; params: AnalyticsParams }
  | { kind: 'screen'; name: string; screenClass?: string }
  | { kind: 'properties'; values: AnalyticsUserProperties }
  | { kind: 'userId'; value: string | null }
  | { kind: 'preparing' };

export interface AnalyticsOutboxEntry {
  id: string;
  occurredAt: number;
  order: number;
  userId?: string | null;
  command: AnalyticsCommand;
  properties: AnalyticsUserProperties | null;
  delivered: string[];
  recoveryEvent?: Extract<AnalyticsCommand, { kind: 'event' }>;
}
export interface AnalyticsOutboxStore {
  load(): Promise<readonly AnalyticsOutboxEntry[]>;
  write(entries: readonly AnalyticsOutboxEntry[], removedIds: readonly string[]): Promise<void>;
}
export const ANALYTICS_OUTBOX_KEY = '@buddybird/analytics-outbox-v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isProperties(value: unknown): value is AnalyticsUserProperties {
  return isRecord(value) && Object.values(value).every((item) => item === null || typeof item === 'string');
}
function isParam(value: unknown): boolean {
  return value == null || typeof value === 'string' || typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value));
}
function isCommand(value: unknown): value is AnalyticsCommand {
  if (!isRecord(value)) return false;
  switch (value.kind) {
    case 'preparing': return true;
    case 'properties': return isProperties(value.values);
    case 'userId': return value.value === null || typeof value.value === 'string';
    case 'screen': return typeof value.name === 'string' && (value.screenClass === undefined || typeof value.screenClass === 'string');
    case 'event': return typeof value.name === 'string' && isRecord(value.params) &&
      Object.values(value.params).every((item) => Array.isArray(item) ? item.every(isParam) : isParam(item));
    default: return false;
  }
}

export function parseAnalyticsOutbox(raw: unknown): AnalyticsOutboxEntry[] {
  if (!Array.isArray(raw)) throw new Error('Analytics outbox must be an array');
  const entries: AnalyticsOutboxEntry[] = [];
  const ids = new Set<string>();
  for (const item of raw) {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.order !== 'number' || !Number.isSafeInteger(item.order) ||
      !(item.userId === undefined || item.userId === null || typeof item.userId === 'string') || typeof item.occurredAt !== 'number' || !Number.isFinite(item.occurredAt) || ids.has(item.id) || !isCommand(item.command) ||
      !(item.properties === null || isProperties(item.properties)) || !Array.isArray(item.delivered) ||
      !item.delivered.every((name) => typeof name === 'string') ||
      !(item.recoveryEvent === undefined || (isCommand(item.recoveryEvent) && item.recoveryEvent.kind === 'event'))) {
      throw new Error('Invalid analytics outbox entry');
    }
    ids.add(item.id);
    let command = item.command;
    if (command.kind === 'preparing') {
      if (item.recoveryEvent) {
        command = { ...item.recoveryEvent, params: { ...item.recoveryEvent.params, client_event_recovered: true } };
      } else {
        console.warn('[analytics.outbox] discarding unfinished event preparation');
        continue;
      }
    }
    entries.push({ id: item.id, occurredAt: item.occurredAt, order: item.order, userId: item.userId, command, properties: item.properties, delivered: item.delivered });
  }
  return entries;
}

function entryStore(id: string) {
  return persistKeyedStore<AnalyticsOutboxEntry | null>({
    key: `${ANALYTICS_OUTBOX_KEY}/${id}`,
    scope: 'analytics.outbox.load',
    parse: (raw) => parseAnalyticsOutbox([raw])[0] ?? null,
    fallback: () => null,
    recover: (error) => { throw error; },
  });
}

export const analyticsOutboxStore: AnalyticsOutboxStore = {
  async load() {
    const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(`${ANALYTICS_OUTBOX_KEY}/`));
    const entries: AnalyticsOutboxEntry[] = [];
    // 전체 대기열을 하나의 JSON으로 다시 쓰지 않고, 항목별 저장과 분할 복원을 사용한다.
    for (let offset = 0; offset < keys.length; offset += 50) {
      const batch = keys.slice(offset, offset + 50);
      const loaded = await Promise.all(batch.map((key) => entryStore(key.slice(ANALYTICS_OUTBOX_KEY.length + 1)).load()));
      entries.push(...loaded.filter((entry): entry is AnalyticsOutboxEntry => entry !== null));
      const unfinished = batch.filter((_key, index) => loaded[index] === null);
      if (unfinished.length > 0) await AsyncStorage.multiRemove(unfinished);
    }
    return entries.sort((a, b) => a.order - b.order);
  },
  async write(entries, removedIds) {
    for (let offset = 0; offset < entries.length; offset += 50) {
      const results = await Promise.allSettled(entries.slice(offset, offset + 50).map((entry) => entryStore(entry.id).save(entry)));
      const failure = results.find((result) => result.status === 'rejected');
      if (failure?.status === 'rejected') throw failure.reason;
    }
    if (removedIds.length > 0) await AsyncStorage.multiRemove(removedIds.map((id) => `${ANALYTICS_OUTBOX_KEY}/${id}`));
  },
};
