import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { CryptoDigestAlgorithm, digest, getRandomValues } from "expo-crypto"
import * as SecureStore from "expo-secure-store"

import { config } from "@/config"

let client: SupabaseClient | undefined

export function getSupabase() {
	if (!config.supabaseUrl || !config.supabasePublishableKey) {
		throw new Error("Supabase configuration missing")
	}

	// Hermes needs these WebCrypto methods for the SDK's random verifier and S256 PKCE.
	if (!globalThis.crypto) {
		Object.defineProperty(globalThis, "crypto", {
			value: {
				getRandomValues,
				subtle: {
					digest(algorithm: string, data: BufferSource) {
						if (algorithm !== CryptoDigestAlgorithm.SHA256) {
							throw new Error("Unsupported digest algorithm")
						}

						return digest(CryptoDigestAlgorithm.SHA256, data)
					},
				},
			},
		})
	}

	client ??= createClient(config.supabaseUrl, config.supabasePublishableKey, {
		auth: {
			persistSession: true,
			autoRefreshToken: true,
			detectSessionInUrl: false,
			flowType: "pkce",
			storage: {
				getItem: (key) => SecureStore.getItemAsync(key),
				setItem: (key, value) => SecureStore.setItemAsync(key, value),
				removeItem: (key) => SecureStore.deleteItemAsync(key),
			},
		},
	})

	return client
}
