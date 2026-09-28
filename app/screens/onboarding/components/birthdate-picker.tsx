import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import dayjs, { type Dayjs } from 'dayjs';

import { Button } from '@/components/ui/button';
import { ItemCheckbox } from '@/components/ui/item/checkbox';
import { ItemGroup } from '@/components/ui/item/group';
import { ItemPicker } from '@/components/ui/item/picker';
import { WheelPicker } from '@/components/ui/wheel-picker';

const MAX_AGE_YEARS = 100;
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

interface Props {
	value: string | null | undefined;
	onChange: (value: string | null) => void;
}

/**
 * 생일 선택 컴포넌트
 * @param value 고른 생일, 모름은 null, 고르기 전은 undefined
 * @param onChange 생일 변경 시 실행할 함수
 */
const BirthdatePicker = ({ value, onChange }: Props) => {
	const { t } = useTranslation();

	const [date, setDate] = useState(() => (value ? dayjs(value) : dayjs().subtract(1, 'year').date(1)));

	const birthdateUnknown = value === null;
	const thisYear = dayjs().year();
	const earliestYear = Math.min(thisYear - MAX_AGE_YEARS, date.year());
	const years = Array.from({ length: thisYear - earliestYear + 1 }, (_, index) => earliestYear + index);
	const days = Array.from({ length: date.daysInMonth() }, (_, index) => index + 1);
	const birthdateText =
		value === undefined ? t('parrot.choose') : birthdateUnknown ? t('common.unknown') : date.format('LL');

	/** 고른 날짜 변경 */
	const handleChangeDate = (nextDate: Dayjs) => {
		setDate(nextDate);

		onChange(nextDate.format('YYYY-MM-DD'));
	};

	/** 날짜 확정과 시트 닫기 */
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
						<WheelPicker
							columns={[
								{
									key: 'year',
									label: t('parrot.yearPicker'),
									value: date.year(),
									values: years,
									unit: t('parrot.year'),
									onChange: (year) => handleChangeDate(date.year(year)),
								},
								{
									key: 'month',
									label: t('parrot.monthPicker'),
									value: date.month() + 1,
									values: MONTHS,
									unit: t('parrot.month'),
									onChange: (month) => handleChangeDate(date.month(month - 1)),
								},
								{
									key: 'day',
									label: t('parrot.dayPicker'),
									value: date.date(),
									values: days,
									unit: t('parrot.day'),
									onChange: (day) => handleChangeDate(date.date(day)),
								},
							]}
						/>
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
