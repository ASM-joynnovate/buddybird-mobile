import NetInfo from "@react-native-community/netinfo"
import { focusManager, onlineManager, QueryClient } from "@tanstack/react-query"
import { AppState } from "react-native"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
    mutations: { retry: false },
  },
})

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
