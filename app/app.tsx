import { useCallback, useState } from "react"

import { AppRuntime } from "@/components/app/app-runtime"
import { AppSplash } from "@/components/app/app-splash"
import { StartupScreen } from "@/components/app/startup-screen"
import { useAuth } from "@/context/auth"
import { useAppServices } from "@/hooks/lifecycle/use-app-services"
import { useAppBootstrap } from "@/hooks/use-app-bootstrap"
import { AppNavigator } from "@/navigators/app-navigator"
import { RootProviders } from "@/providers"
import { AppProvider } from "@/providers/app-data"
import { AuthProvider } from "@/providers/auth"
import { SessionProvider } from "@/providers/session"
import { LoginScreen } from "@/screens/Login/LoginScreen"

export function App() {
	const { state, ready, settled, retry } = useAppBootstrap()
	const [splashFinished, setSplashFinished] = useState(false)
	const finishSplash = useCallback(() => setSplashFinished(true), [])

	if (state === "headless") {
		return null
	}

	return (
		<RootProviders>
			{ready ? (
				<AppProvider>
					<SessionProvider>
						<AppContent showDialogs={splashFinished} />
					</SessionProvider>
				</AppProvider>
			) : (
				<StartupScreen failed={state === "failed"} onRetry={retry} />
			)}
			{!splashFinished ? <AppSplash ready={settled} onComplete={finishSplash} /> : null}
		</RootProviders>
	)
}

function AppContent({ showDialogs }: { showDialogs: boolean }) {
	useAppServices()

	return (
		<AuthProvider>
			<AuthenticatedContent showDialogs={showDialogs} />
		</AuthProvider>
	)
}

function AuthenticatedContent({ showDialogs }: { showDialogs: boolean }) {
	const { state, retry } = useAuth()

	if (state.status === "loading") {
		return <StartupScreen failed={false} onRetry={retry} />
	}

	if (state.status !== "signedIn") {
		return <LoginScreen />
	}

	return (
		<>
			<AppNavigator />
			{showDialogs ? <AppRuntime /> : null}
		</>
	)
}
