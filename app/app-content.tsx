import { AuthenticatedContent } from "@/authenticated-content"
import { useAppServices } from "@/hooks/use-app-services"
import { AuthProvider } from "@/providers/auth"

interface Props {
	showDialogs: boolean
}

export function AppContent({ showDialogs }: Props) {
	useAppServices()

	return (
		<AuthProvider>
			<AuthenticatedContent showDialogs={showDialogs} />
		</AuthProvider>
	)
}
