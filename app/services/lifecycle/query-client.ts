import NetInfo from "@react-native-community/netinfo"
import { type Persister, persistQueryClient } from "@tanstack/query-persist-client-core"
import { focusManager, onlineManager } from "@tanstack/react-query"
import { AppState } from "react-native"

import { QUERY_CACHE_MAX_AGE_MS } from "@/config"
import { queryClient } from "@/lib/query-client"
import { createQueryPersister } from "@/lib/query-persister"
import { installedVersion } from "@/services/device/application"
import { reportError } from "@/services/telemetry/client"
import { queryCacheStorageId } from "@/stores/keys"

let persistedAccount: string | null = null
let accountPersister: Persister | undefined
let stopPersisting: (() => void) | undefined

export function connectQueryLifecycle() {
	focusManager.setFocused(AppState.currentState === "active")

	const appState = AppState.addEventListener("change", (state) => {
		focusManager.setFocused(state === "active")
	})

	const network = NetInfo.addEventListener((state) => {
		onlineManager.setOnline(state.isConnected === true && state.isInternetReachable !== false)
	})

	return () => {
		appState.remove()
		network()
	}
}

function removeAccountCache() {
	try {
		void accountPersister?.removeClient()
	} catch (error) {
		reportError(error, "query_cache_remove")
	}
}

export function persistAccountQueries(accountId: string | null) {
	if (accountId === persistedAccount) {
		return
	}

	stopPersisting?.()
	stopPersisting = undefined

	if (persistedAccount !== null) {
		queryClient.clear()

		removeAccountCache()
	}

	persistedAccount = accountId
	accountPersister = undefined

	if (accountId === null) {
		return
	}

	accountPersister = createQueryPersister(queryCacheStorageId(accountId))

	const [unsubscribe, restored] = persistQueryClient({
		queryClient,
		persister: accountPersister,
		maxAge: QUERY_CACHE_MAX_AGE_MS,
		buster: installedVersion,
		dehydrateOptions: { shouldDehydrateMutation: () => false },
	})

	stopPersisting = unsubscribe

	void restored.catch((error) => reportError(error, "query_cache_restore"))
}
