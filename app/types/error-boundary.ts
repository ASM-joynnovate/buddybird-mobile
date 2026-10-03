import type { ReactNode } from 'react';

export interface ErrorFallbackProps {
	error: Error;
	placeholder: ReactNode;
	onRetry: () => void;
}
