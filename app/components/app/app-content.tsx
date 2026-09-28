import { AuthProvider } from '@/providers/auth';
import SystemProvider from '@/providers/system';

import { AuthStatusContent } from '@/components/app/auth-status-content';

interface Props {
	splashFinished: boolean;
}

export function AppContent({ splashFinished }: Props) {
	return (
		<SystemProvider>
			<AuthProvider>
				<AuthStatusContent splashFinished={splashFinished} />
			</AuthProvider>
		</SystemProvider>
	);
}
