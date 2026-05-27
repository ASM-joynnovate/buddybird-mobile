import { getRandomBytes } from 'expo-crypto';

export function createSessionId(): string {
  const randomHex = Array.from(getRandomBytes(5), (b) => b.toString(16).padStart(2, '0')).join('');
  return `sess_${Date.now().toString(36)}_${randomHex}`;
}
