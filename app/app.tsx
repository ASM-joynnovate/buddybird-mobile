import { useCallback, useState } from "react"

import { AppRuntime } from "@/components/app/app-runtime"
import { AppSplash } from "@/components/app/app-splash"
import { StartupScreen } from "@/components/app/startup-screen"
import { useAppBootstrap } from "@/hooks/use-app-bootstrap"
import { useAppServices } from "@/hooks/use-app-services"
import { AppNavigator } from "@/navigators/app-navigator"
import { RootProviders } from "@/providers"
import { AuthProvider } from "@/providers/auth"
import { useAccountStore } from "@/stores/account"
import { useAuthStore } from "@/stores/auth"

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
				<AppContent showDialogs={splashFinished} />
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
	const status = useAuthStore((auth) => auth.status)
	const retry = useAuthStore((auth) => auth.retry)

	const registered = useAccountStore((account) => account.registeredUser !== null)

	if (status === "error") {
		return <StartupScreen failed onRetry={retry} />
	}

	if (status !== "signedIn" && !(status === "completing" && registered)) {
		return <StartupScreen failed={false} onRetry={retry} />
	}

	return (
		<>
			<AppNavigator />
			{showDialogs ? <AppRuntime /> : null}
		</>
	)
}
