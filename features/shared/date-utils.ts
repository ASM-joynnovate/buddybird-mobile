export function diffDaysIso(fromIso: string, toMs: number = Date.now()): number {
  const from = new Date(fromIso).getTime();
  const diffMs = Math.max(0, toMs - from);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 로컬 타임존 기준 'YYYY-MM-DD' 날짜 키. 하루 단위 비교(streak·접속일 카운트 등)에 쓴다.
 * UTC(`toISOString`)가 아니라 기기 로컬 자정 기준이라, 사용자가 체감하는 "오늘"과 일치한다.
 */
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
