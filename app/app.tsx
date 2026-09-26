import { useCallback, useState } from "react"

import { AppContent } from "@/app-content"
import { AppSplash } from "@/components/app/app-splash"
import { StartupScreen } from "@/components/app/startup-screen"
import { useAppBootstrap } from "@/hooks/use-app-bootstrap"
import { RootProviders } from "@/providers"

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
