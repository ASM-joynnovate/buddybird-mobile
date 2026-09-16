import { ActiveSession } from "@/screens/Session/components/active-session"
import { SessionComplete } from "@/screens/Session/components/session-complete"
import { SessionExitDialog } from "@/screens/Session/components/session-exit-dialog"
import { useSessionControls } from "@/screens/Session/hooks/use-session-controls"

export function SessionScreen({ onContinue }: { onContinue(): void }) {
	const {
		session,
		snapshot,
		busy,
		commandError,
		command,
		togglePause,
		goBack,
		confirmEnd,
		closeConfirmation,
		confirmExit,
		requestExit,
	} = useSessionControls(onContinue)

	if (snapshot.state === "completed") {
		return (
			<SessionComplete
				busy={busy}
				onRetry={() => void command(session.retryRecovery)}
				onContinue={onContinue}
			/>
		)
	}

	return (
		<>
			<ActiveSession
				onBack={goBack}
				busy={busy}
				commandError={commandError}
				onEnd={requestExit}
				onRetry={() =>
					void command(
						snapshot.state === "failed" ? session.retry : session.retryRecovery,
					)
				}
				onTogglePause={togglePause}
			/>
			<SessionExitDialog
				visible={confirmEnd}
				onClose={closeConfirmation}
				onEnd={confirmExit}
			/>
		</>
	)
}
