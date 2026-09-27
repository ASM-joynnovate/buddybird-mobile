import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button } from "@/components/ui/button"
import { CheckRow, GroupedList, PickerRow } from "@/components/ui/rows"
import { WheelPicker } from "@/components/ui/wheel-picker"
import { formatFullDate } from "@/i18n/format"
import { useDeviceSettingsStore } from "@/stores/device-settings"

const MAX_AGE_YEARS = 100
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1)

type DateParts = { year: number; month: number; day: number }

function daysIn(year: number, month: number) {
	return new Date(year, month, 0).getDate()
}

function pad(value: number) {
	return String(value).padStart(2, "0")
}

function toText({ year, month, day }: DateParts) {
	return `${year}-${pad(month)}-${pad(day)}`
}

function parse(value: string | null | undefined): DateParts {
	const now = new Date()
	const [year, month, day] = value?.split("-").map(Number) ?? [
		now.getFullYear() - 1,
		now.getMonth() + 1,
		1,
	]

	return { year, month, day }
}

interface Props {
	value: string | null | undefined
	onChange(value: string | null): void
}

export function DatePicker({ value, onChange }: Props) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const [date, setDate] = useState(() => parse(value))

	const unknown = value === null
	const thisYear = new Date().getFullYear()
	const earliest = Math.min(thisYear - MAX_AGE_YEARS, date.year)
	const years = Array.from({ length: thisYear - earliest + 1 }, (_, index) => earliest + index)
	const days = Array.from({ length: daysIn(date.year, date.month) }, (_, index) => index + 1)

	function change(next: Partial<DateParts>) {
		const merged = { ...date, ...next }
		const clamped = { ...merged, day: Math.min(merged.day, daysIn(merged.year, merged.month)) }

		setDate(clamped)
		onChange(toText(clamped))
	}

	function label() {
		if (value === undefined) {
			return t("parrot.choose")
		}

		return unknown
			? t("common.unknown")
			: formatFullDate(new Date(date.year, date.month - 1, date.day), locale)
	}

	return (
		<PickerRow
			row={{ label: t("parrot.birthday"), value: label() }}
			sheet={{ title: t("parrot.birthdayQuestion") }}
		>
			{(close) => (
				<>
					<View
						style={unknown && styles.dimmed}
						pointerEvents={unknown ? "none" : "auto"}
						accessibilityElementsHidden={unknown}
					>
						<WheelPicker
							columns={[
								{
									key: "year",
									label: t("parrot.yearPicker"),
									value: date.year,
									values: years,
									unit: t("parrot.year"),
									onChange: (year) => change({ year }),
								},
								{
									key: "month",
									label: t("parrot.monthPicker"),
									value: date.month,
									values: MONTHS,
									unit: t("parrot.month"),
									onChange: (month) => change({ month }),
								},
								{
									key: "day",
									label: t("parrot.dayPicker"),
									value: date.day,
									values: days,
									unit: t("parrot.day"),
									onChange: (day) => change({ day }),
								},
							]}
						/>
					</View>
					<GroupedList>
						<CheckRow
							first
							label={t("parrot.birthdayUnknown")}
							checked={unknown}
							onToggle={() => onChange(unknown ? toText(date) : null)}
						/>
					</GroupedList>
					<Button
						label={t("common.select")}
						onPress={() => {
							if (value === undefined) {
								onChange(toText(date))
							}

							close()
						}}
					/>
				</>
			)}
		</PickerRow>
	)
}

const styles = StyleSheet.create({
	dimmed: { opacity: 0.35 },
})
