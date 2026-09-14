import NetInfo from "@react-native-community/netinfo"

import { AppState } from "react-native"

import { currentIdentity, ensureAnonymousIdentity, subscribeIdentity } from "@/apis/identity"
import { readData } from "@/services/storage/data-store"
import { reportError, setTelemetryIdentity } from "@/services/telemetry/client"
import { triggerUploads } from "@/services/uploads/queue"
import { type UploadTrigger } from "@/types/uploads"

export function startUploads() {
	readData()
	const controller = new AbortController()
	let previousState = AppState.currentState
	let connected: boolean | null = null
	let firstIdentity = true
	const run = (reason: UploadTrigger) => {
		void triggerUploads(reason, controller.signal).catch((error) =>
			reportError(error, "upload_trigger"),
		)
	}

	const auth = subscribeIdentity((uid) => {
		if (uid) {
			setTelemetryIdentity(uid)

			if (firstIdentity) {
				firstIdentity = false
				run("cold_start")
			}
		}
	})

	void ensureAnonymousIdentity().catch((error) => reportError(error, "anonymous_auth"))
	const app = AppState.addEventListener("change", (state) => {
		if (state === "active" && previousState !== "active") {
			if (!currentIdentity()) {
				void ensureAnonymousIdentity().catch((error) =>
					reportError(error, "anonymous_auth"),
				)
			}

			run("foreground")
		}

		previousState = state
	})
	const network = NetInfo.addEventListener((state) => {
		const online = state.isConnected === true && state.isInternetReachable !== false

		if (connected === false && online) {
			run("network")
		}

		connected = online
	})

	return () => {
		controller.abort()
		auth()
		app.remove()
		network()
	}
}
