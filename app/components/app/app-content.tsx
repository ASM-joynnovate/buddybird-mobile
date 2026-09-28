import { useAppServices } from '@/hooks/use-app-services';

import { AuthProvider } from '@/providers/auth';

import { AuthenticatedContent } from '@/components/app/authenticated-content';

interface Props {
	showDialogs: boolean;
}

export function AppContent({ showDialogs }: Props) {
	useAppServices();

	return (
		<AuthProvider>
			<AuthenticatedContent showDialogs={showDialogs} />
		</AuthProvider>
	);
}
