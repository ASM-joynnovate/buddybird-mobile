import { CLOCK_FORMAT } from '@/types/sleep-settings';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';

import { HOURS, MINUTE_STEPS, WheelPicker } from '@/components/ui/wheel-picker';

interface Props {
	value: string;
	label: string;
	onChange: (value: string) => void;
}

/**
 * 시와 분을 고르는 휠 두 개를 보여 주고 휠을 돌리면 바뀐 시각으로 변경 함수를 실행하는 컴포넌트
 * @param value 고른 시각
 * @param label 휠 접근성 라벨에 넣을 시각 이름
 * @param onChange 시각을 바꿀 때 실행할 함수
 */
const TimePicker = ({ value, label, onChange }: Props) => {
	const { t } = useTranslation();

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
					onChange: (hour) => onChange(time.hour(hour).format(CLOCK_FORMAT)),
				},
				{
					key: 'minute',
					label: t('common.time.minutePicker', { label }),
					value: time.minute(),
					values: minutes,
					unit: t('common.time.minute'),
					onChange: (minute) => onChange(time.minute(minute).format(CLOCK_FORMAT)),
				},
			]}
		/>
	);
};

export default TimePicker;
