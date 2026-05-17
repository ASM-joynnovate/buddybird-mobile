/** 초 단위 → "X분" (>=60) or "X초". */
export function formatDurationSecs(secs: number): string {
  return secs >= 60 ? `${Math.round(secs / 60)}분` : `${secs}초`;
}

/** 분 단위 → "X분" (<60) / "X시간" (정수) / "X시간 Y분". */
export function formatDurationMins(mins: number): string {
  if (mins < 60) return `${mins}분`;
  const h = mins / 60;
  return Number.isInteger(h) ? `${h}시간` : `${Math.floor(h)}시간 ${mins % 60}분`;
}
