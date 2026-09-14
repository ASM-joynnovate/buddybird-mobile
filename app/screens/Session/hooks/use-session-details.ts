import { useAppData } from "@/hooks/use-app-data"
import { useSession } from "@/hooks/use-session"
import { currentWord } from "@/services/words/selectors"

export function useSessionDetails() {
	const data = useAppData()
	const session = useSession()
	const { snapshot } = session
	const history = snapshot.sessionId ? data.history[snapshot.sessionId] : undefined
	const draft = snapshot.sessionId ? data.sessionDrafts[snapshot.sessionId] : undefined
	const settings = history ?? draft?.settings ?? data.settings.lastSession
	const word =
		history?.word ??
		draft?.word ??
		(settings ? currentWord(data, settings.libraryEntryId ?? settings.wordId) : undefined)

	return { data, session, snapshot, history, settings, word }
}
