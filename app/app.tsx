import { useCallback, useState } from "react"

import { AppSplash } from "@/components/app/app-splash"
import { AppRuntime } from "@/components/app/app-runtime"
import { StartupScreen } from "@/components/app/startup-screen"
import { useAppBootstrap } from "@/hooks/use-app-bootstrap"
import { useAppServices } from "@/hooks/lifecycle/use-app-services"
import { AppNavigator } from "@/navigators/app-navigator"
import { RootProviders } from "@/providers"
import { AppProvider } from "@/providers/app-data"
import { SessionProvider } from "@/providers/session"

export function App() {
	const { state, ready, settled, retry } = useAppBootstrap()
	const [splashFinished, setSplashFinished] = useState(false)
	const finishSplash = useCallback(() => setSplashFinished(true), [])

	if (state === "headless") {
		return null
	}

	return (
		<RootProviders>
			{ready && splashFinished ? (
				<AppProvider>
					<SessionProvider>
						<AppContent />
					</SessionProvider>
				</AppProvider>
			) : (
				<StartupScreen failed={state === "failed"} onRetry={retry} />
			)}
			{!splashFinished ? <AppSplash ready={settled} onComplete={finishSplash} /> : null}
		</RootProviders>
	)
}

function AppContent() {
	useAppServices()

	return (
		<>
			<AppNavigator />
			<AppRuntime />
		</>
	)
}
