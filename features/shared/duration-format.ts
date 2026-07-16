import type { I18n } from 'i18n-js';

type Translate = I18n['t'];

/**
 * 초 단위 → 로케일 표기 (반올림으로 잔여 초를 버리지 않음).
 * - 60초 미만: `"X초"`
 * - 정확히 분으로 떨어짐: `formatDurationMins` 위임 (`"X분"` / `"X시간"` / `"X시간 Y분"`)
 * - 분 미만 잔여가 있음: `"<분 표기> Y초"` (예: `"1분 30초"`)
 */
export function formatDurationSecs(secs: number, t: Translate): string {
  if (secs < 60) return t('common.duration.seconds', { seconds: secs });
  const remSec = secs % 60;
  if (remSec === 0) return formatDurationMins(secs / 60, t);
  return `${formatDurationMins(Math.floor(secs / 60), t)} ${t('common.duration.seconds', { seconds: remSec })}`;
}

/**
 * 초 단위 → 가장 큰 단위 하나로 컴팩트 표기 (칩/배지용).
 * - 60초 미만: `"X초"`
 * - 60분 미만: `"X분"` (잔여 초 버림)
 * - 그 이상: `"X시간"` (잔여 분 버림)
 */
export function formatDurationCompact(secs: number, t: Translate): string {
  if (secs < 60) return t('common.duration.seconds', { seconds: secs });
  const mins = Math.floor(secs / 60);
  if (mins >= 60) return t('common.duration.hours', { hours: Math.floor(mins / 60) });
  return t('common.duration.minutes', { minutes: mins });
}

/** 분 단위 → "X분" (<60) / "X시간" (정수) / "X시간 Y분". */
export function formatDurationMins(mins: number, t: Translate): string {
  if (mins < 60) return t('common.duration.minutes', { minutes: mins });
  const h = mins / 60;
  return Number.isInteger(h)
    ? t('common.duration.hours', { hours: h })
    : t('common.duration.hoursMinutes', { hours: Math.floor(h), minutes: mins % 60 });
}
