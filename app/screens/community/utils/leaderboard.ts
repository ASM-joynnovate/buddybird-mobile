import type { Locale } from '@/types/locale';

import { formatDuration } from '@/i18n/format';

import dayjs from 'dayjs';

import { HOUR } from '@/config/units';
import { localDate } from '@/utils/date';

const MINUTES_HIDDEN_FROM_MS = 10 * HOUR;

/** 이번 달 1일(UTC) 날짜 반환 함수 */
export const leaderboardMonthStart = () => {
	return localDate(dayjs.utc().startOf('month'));
};

/** 순위 학습 시간 문구 반환 함수 */
export const leaderboardScoreText = (score: number, locale: Locale) => {
	return formatDuration(score >= MINUTES_HIDDEN_FROM_MS ? Math.floor(score / HOUR) * HOUR : score, locale);
};
