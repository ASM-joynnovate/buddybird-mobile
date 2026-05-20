/** 초 단위 → "X분" (정확한 경우) / "약 X분" (초 나머지 있거나 forceApprox인 경우) / "X초". */
export function formatDurationSecs(secs: number, forceApprox = false): string {
  if (secs < 60) return `${secs}초`;
  const mins = Math.round(secs / 60);
  return (!forceApprox && secs % 60 === 0) ? `${mins}분` : `약 ${mins}분`;
}

/** 분 단위 → "X분" (<60) / "X시간" (정수) / "X시간 Y분". */
export function formatDurationMins(mins: number): string {
  if (mins < 60) return `${mins}분`;
  const h = mins / 60;
  return Number.isInteger(h) ? `${h}시간` : `${Math.floor(h)}시간 ${mins % 60}분`;
}
