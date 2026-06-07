export function diffDaysIso(fromIso: string, toMs: number = Date.now()): number {
  const from = new Date(fromIso).getTime();
  const diffMs = Math.max(0, toMs - from);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}
