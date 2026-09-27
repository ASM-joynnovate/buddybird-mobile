import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { StatusBar } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"

import { queryClient } from "@/lib/query-client"

interface Props {
	children: ReactNode
}

export function RootProviders({ children }: Props) {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<StatusBar barStyle="dark-content" />
				<QueryClientProvider client={queryClient}>
					<BottomSheetModalProvider>{children}</BottomSheetModalProvider>
				</QueryClientProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	)
}
