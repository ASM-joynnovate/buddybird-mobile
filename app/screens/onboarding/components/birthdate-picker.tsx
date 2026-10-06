import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import dayjs, { type Dayjs } from 'dayjs';

import { useDeviceSettingsStore } from '@/stores/device-settings';

import { Button } from '@/components/ui/button';
import { ItemCheckbox } from '@/components/ui/item/checkbox';
import { ItemGroup } from '@/components/ui/item/group';
import { ItemPicker } from '@/components/ui/item/picker';
import { WheelPicker } from '@/components/ui/wheel-picker';

const MAX_AGE_YEARS = 100;
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
// 영어는 월, 일, 연 순서로 표시
const US_COLUMN_ORDER = ['month', 'day', 'year'];

interface Props {
	value: string | null | undefined;
	onChange: (value: string | null) => void;
}

/**
 * 생일 선택 컴포넌트
 * @param value 선택한 생일
 * @param onChange 생일 변경 시 실행할 함수
 */
const BirthdatePicker = ({ value, onChange }: Props) => {
	const { t } = useTranslation();

	const locale = useDeviceSettingsStore((state) => state.locale);

	const [date, setDate] = useState(() => (value ? dayjs(value) : dayjs().subtract(1, 'year').date(1)));

	const birthdateUnknown = value === null;
	const thisYear = dayjs().year();
	const earliestYear = Math.min(thisYear - MAX_AGE_YEARS, date.year());
	const years = Array.from({ length: thisYear - earliestYear + 1 }, (_, index) => earliestYear + index);
	const days = Array.from({ length: date.daysInMonth() }, (_, index) => index + 1);
	const birthdateText =
		value === undefined ? t('parrot.choose') : birthdateUnknown ? t('common.unknown') : date.format('ll');

	const handleChangeDate = (nextDate: Dayjs) => {
		setDate(nextDate);

		onChange(nextDate.format('YYYY-MM-DD'));
	};

	const dateColumns = [
		{
			key: 'year',
			label: t('parrot.yearPicker'),
			value: date.year(),
			values: years,
			unit: t('parrot.year'),
			onChange: (year: number) => handleChangeDate(date.year(year)),
		},
		{
			key: 'month',
			label: t('parrot.monthPicker'),
			value: date.month() + 1,
			values: MONTHS,
			unit: t('parrot.month'),
			onChange: (month: number) => handleChangeDate(date.month(month - 1)),
		},
		{
			key: 'day',
			label: t('parrot.dayPicker'),
			value: date.date(),
			values: days,
			unit: t('parrot.day'),
			onChange: (day: number) => handleChangeDate(date.date(day)),
		},
	];
	const columns =
		locale === 'en-US'
			? US_COLUMN_ORDER.flatMap((key) => dateColumns.filter((column) => column.key === key))
			: dateColumns;

	const handleSelect = (close: () => void) => {
		if (value === undefined) {
			onChange(date.format('YYYY-MM-DD'));
		}

		close();
	};

	return (
		<ItemPicker
			item={{ label: t('parrot.birthdate'), value: birthdateText }}
			sheet={{ title: t('parrot.birthdateQuestion') }}
		>
			{(close) => (
				<>
					<View
						style={birthdateUnknown && styles.dimmed}
						pointerEvents={birthdateUnknown ? 'none' : 'auto'}
						accessibilityElementsHidden={birthdateUnknown}
					>
						<WheelPicker columns={columns} />
					</View>
					<ItemGroup>
						<ItemCheckbox
							first
							label={t('parrot.birthdateUnknown')}
							checked={birthdateUnknown}
							onToggle={() => onChange(birthdateUnknown ? date.format('YYYY-MM-DD') : null)}
						/>
					</ItemGroup>
					<Button label={t('common.select')} onPress={() => handleSelect(close)} />
				</>
			)}
		</ItemPicker>
	);
};

const styles = StyleSheet.create({
	dimmed: { opacity: 0.35 },
});

export default BirthdatePicker;
