import { QueryClientProvider } from "@tanstack/react-query"
import type { PropsWithChildren } from "react"
import { StatusBar } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { queryClient } from "@/lib/query-client"

export function RootProviders({ children }: PropsWithChildren) {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<StatusBar barStyle="dark-content" />
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	)
}
