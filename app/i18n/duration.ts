import type { Locale } from '@/types/locale';

import i18next from '@/i18n';

import type { Duration } from 'dayjs/plugin/duration';

/** 시간 길이를 단위별 값으로 나누는 함수 */
const durationParts = (duration: Duration) => {
	const totalSeconds = duration.asSeconds();
	const hours = Math.floor(duration.asHours());
	const minutes = duration.minutes();
	const remainderSeconds = duration.seconds();

	const parts: { value: number; unit: 'hours' | 'minutes' | 'seconds' }[] = [];

	if (hours > 0) {
		parts.push({ value: hours, unit: 'hours' });
	}

	if (minutes > 0) {
		parts.push({ value: minutes, unit: 'minutes' });
	}

	if (remainderSeconds > 0 || totalSeconds === 0) {
		parts.push({ value: remainderSeconds, unit: 'seconds' });
	}

	return parts;
};

/** 시간 길이를 '1시간 5분 3초' 형식으로 변환하는 함수 */
export const durationText = (duration: Duration, locale: Locale) =>
	durationParts(duration)
		.map(({ value, unit }) => i18next.t(`common.duration.${unit}`, { value, lng: locale }))
		.join(' ');
