export function reportProviderFailure(providerName: string, operation: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[analytics] ${providerName} ${operation} failed: ${message}`);
}
