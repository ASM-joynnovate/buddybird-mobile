import { useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import dayjs from 'dayjs';

import { localDate } from '@/utils/date';

import { Button } from '@/components/ui/button';
import { ItemCheckbox } from '@/components/ui/item/checkbox';
import { ItemGroup } from '@/components/ui/item/group';
import { ItemPicker } from '@/components/ui/item/picker';
import { WheelPicker } from '@/components/ui/wheel-picker';

const MAX_AGE_YEARS = 100;
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

type DateParts = { year: number; month: number; day: number };

function daysIn(year: number, month: number) {
	return dayjs()
		.year(year)
		.month(month - 1)
		.daysInMonth();
}

function toText({ year, month, day }: DateParts) {
	return localDate(
		dayjs()
			.year(year)
			.month(month - 1)
			.date(day),
	);
}

function parse(value: string | null | undefined): DateParts {
	const date = value ? dayjs(value) : dayjs().subtract(1, 'year').date(1);

	return { year: date.year(), month: date.month() + 1, day: date.date() };
}

interface Props {
	value: string | null | undefined;
	onChange(value: string | null): void;
}

export function DatePicker({ value, onChange }: Props) {
	const { t } = useTranslation();

	const [date, setDate] = useState(() => parse(value));

	const unknown = value === null;
	const thisYear = dayjs().year();
	const earliest = Math.min(thisYear - MAX_AGE_YEARS, date.year);
	const years = Array.from({ length: thisYear - earliest + 1 }, (_, index) => earliest + index);
	const days = Array.from({ length: daysIn(date.year, date.month) }, (_, index) => index + 1);

	function change(next: Partial<DateParts>) {
		const merged = { ...date, ...next };
		const clamped = { ...merged, day: Math.min(merged.day, daysIn(merged.year, merged.month)) };

		setDate(clamped);

		onChange(toText(clamped));
	}

	function label() {
		if (value === undefined) {
			return t('parrot.choose');
		}

		return unknown ? t('common.unknown') : dayjs(toText(date)).format('LL');
	}

	return (
		<ItemPicker
			item={{ label: t('parrot.birthday'), value: label() }}
			sheet={{ title: t('parrot.birthdayQuestion') }}
		>
			{(close) => (
				<>
					<View
						style={unknown && styles.dimmed}
						pointerEvents={unknown ? 'none' : 'auto'}
						accessibilityElementsHidden={unknown}
					>
						<WheelPicker
							columns={[
								{
									key: 'year',
									label: t('parrot.yearPicker'),
									value: date.year,
									values: years,
									unit: t('parrot.year'),
									onChange: (year) => change({ year }),
								},
								{
									key: 'month',
									label: t('parrot.monthPicker'),
									value: date.month,
									values: MONTHS,
									unit: t('parrot.month'),
									onChange: (month) => change({ month }),
								},
								{
									key: 'day',
									label: t('parrot.dayPicker'),
									value: date.day,
									values: days,
									unit: t('parrot.day'),
									onChange: (day) => change({ day }),
								},
							]}
						/>
					</View>
					<ItemGroup>
						<ItemCheckbox
							first
							label={t('parrot.birthdayUnknown')}
							checked={unknown}
							onToggle={() => onChange(unknown ? toText(date) : null)}
						/>
					</ItemGroup>
					<Button
						label={t('common.select')}
						onPress={() => {
							if (value === undefined) {
								onChange(toText(date));
							}

							close();
						}}
					/>
				</>
			)}
		</ItemPicker>
	);
}

const styles = StyleSheet.create({
	dimmed: { opacity: 0.35 },
});
