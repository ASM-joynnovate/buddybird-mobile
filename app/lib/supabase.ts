import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { CryptoDigestAlgorithm, digest, getRandomValues } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import { env } from '@/config/env';

let client: SupabaseClient | undefined;

/** Supabase 클라이언트 반환 함수 */
export const getSupabase = () => {
	if (!env.supabaseUrl || !env.supabasePublishableKey) {
		throw new Error('Supabase configuration missing');
	}

	// Hermes에 WebCrypto 함수 추가
	if (!globalThis.crypto) {
		Object.defineProperty(globalThis, 'crypto', {
			value: {
				getRandomValues,
				subtle: {
					digest: (algorithm: string, data: BufferSource) => {
						if (algorithm !== CryptoDigestAlgorithm.SHA256) {
							throw new Error('Unsupported digest algorithm');
						}

						return digest(CryptoDigestAlgorithm.SHA256, data);
					},
				},
			},
		});
	}

	client ??= createClient(env.supabaseUrl, env.supabasePublishableKey, {
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: false,
			flowType: 'pkce',
			storage: {
				getItem: (key) => SecureStore.getItemAsync(key),
				setItem: (key, value) => SecureStore.setItemAsync(key, value),
				removeItem: (key) => SecureStore.deleteItemAsync(key),
			},
		},
	});

	return client;
};
