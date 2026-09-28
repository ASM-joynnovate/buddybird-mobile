import { AuthProvider } from '@/providers/auth';
import SystemProvider from '@/providers/system';

import { AuthenticatedContent } from '@/components/app/authenticated-content';

interface Props {
	splashFinished: boolean;
}

export function AppContent({ splashFinished }: Props) {
	return (
		<SystemProvider>
			<AuthProvider>
				<AuthenticatedContent splashFinished={splashFinished} />
			</AuthProvider>
		</SystemProvider>
	);
}
