import type { ReactNode } from 'react';

export type ErrorSize = 'screen' | 'inline';

export interface ErrorFallbackProps {
	error: Error;
	placeholder: ReactNode;
	size: ErrorSize;
	onRetry: () => void;
}
