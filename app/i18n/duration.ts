import type { Locale } from '@/types/locale';

import type { Duration } from 'dayjs/plugin/duration';

/** 시간 길이를 단위별 값으로 나누는 함수 */
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

/** 시간 길이를 '1시간 5분 3초' 형식으로 변환하는 함수 */
export const durationText = (duration: Duration, locale: Locale) =>
	durationParts(duration, locale)
		.map(({ value, unit }) => `${value}${unit}`)
		.join(' ');
