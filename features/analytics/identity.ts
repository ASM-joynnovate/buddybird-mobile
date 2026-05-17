import AsyncStorage from '@react-native-async-storage/async-storage';

export const INSTALLATION_ID_KEY = '@buddybird/analytics-installation-id';

export class IdentityStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdentityStorageError';
  }
}

export async function getOrCreateInstallationId(): Promise<string> {
  const existing = await AsyncStorage.getItem(INSTALLATION_ID_KEY);

  if (existing && isUuidLike(existing)) {
    return existing;
  }

  const fresh = generateUuid();
  await AsyncStorage.setItem(INSTALLATION_ID_KEY, fresh);
  return fresh;
}

export async function clearInstallationId(): Promise<void> {
  await AsyncStorage.removeItem(INSTALLATION_ID_KEY);
}

function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function generateUuid(): string {
  const bytes = new Uint8Array(16);

  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`;
}
