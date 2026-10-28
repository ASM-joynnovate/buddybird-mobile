import { CLOCK_FORMAT } from '@/types/sleep-settings';

import { useTranslation } from 'react-i18next';

import { formatNumber } from '@/i18n/format';

import dayjs from 'dayjs';

import { useDeviceSettingsStore } from '@/stores/device-settings';

import { HOURS, MINUTE_STEPS, WheelPicker } from '@/components/ui/wheel-picker';

interface Props {
	value: string;
	label: string;
	onChange: (value: string) => void;
}

/**
 * 시각 선택 휠 컴포넌트
 * @param value 선택한 시각
 * @param label 휠 접근성 라벨에 넣을 시각 이름
 * @param onChange 시각 변경 시 실행할 함수
 */
const TimePicker = ({ value, label, onChange }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const time = dayjs(value, CLOCK_FORMAT);
	const minutes = MINUTE_STEPS.includes(time.minute())
		? MINUTE_STEPS
		: [...MINUTE_STEPS, time.minute()].sort((a, b) => a - b);

	return (
		<WheelPicker
			columns={[
				{
					key: 'hour',
					label: t('common.time.hourPicker', { label }),
					value: time.hour(),
					values: HOURS,
					unit: t('common.time.hour'),
					formatValue: (hour) => formatNumber(hour, locale),
					onChange: (hour) => onChange(time.hour(hour).locale('en').format(CLOCK_FORMAT)),
				},
				{
					key: 'minute',
					label: t('common.time.minutePicker', { label }),
					value: time.minute(),
					values: minutes,
					unit: t('common.time.minute'),
					formatValue: (minute) => formatNumber(minute, locale),
					onChange: (minute) => onChange(time.minute(minute).locale('en').format(CLOCK_FORMAT)),
				},
			]}
		/>
	);
};

export default TimePicker;
