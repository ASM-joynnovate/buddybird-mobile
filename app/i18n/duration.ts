import type { Locale } from '@/types/locale';

import type { Duration } from 'dayjs/plugin/duration';

/** 시간 길이의 시, 분, 초 조각 */
const durationParts = (duration: Duration, locale: Locale) => {
	const totalSeconds = duration.asSeconds();
	const hours = Math.floor(duration.asHours());
	const minutes = duration.minutes();
	const remainderSeconds = duration.seconds();

	const units = locale === 'ko-KR' ? ['시간', '분', '초'] : ['h', 'm', 's'];
	const parts: { value: number; unit: string }[] = [];

	if (hours > 0) {
		parts.push({ value: hours, unit: units[0] });
	}

	if (minutes > 0) {
		parts.push({ value: minutes, unit: units[1] });
	}

	if (remainderSeconds > 0 || totalSeconds === 0) {
		parts.push({ value: remainderSeconds, unit: units[2] });
	}

	return parts;
};

/** 시간 길이 문구 */
export const durationText = (duration: Duration, locale: Locale) =>
	durationParts(duration, locale)
		.map(({ value, unit }) => `${value}${unit}`)
		.join(' ');
