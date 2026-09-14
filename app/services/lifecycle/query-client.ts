import NetInfo from "@react-native-community/netinfo"
import { focusManager, onlineManager } from "@tanstack/react-query"
import { AppState } from "react-native"

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
