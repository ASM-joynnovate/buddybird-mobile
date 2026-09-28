export interface ErrorFallbackProps {
	error: Error;
	onRetry: () => void;
}
