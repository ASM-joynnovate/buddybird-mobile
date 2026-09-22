import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Button } from "@/components/ui/button"
import { CheckRow, GroupedList, NavRow } from "@/components/ui/rows"
import { Sheet } from "@/components/ui/sheet"
import { Copy } from "@/components/ui/text"
import { Wheel, WheelRow } from "@/components/ui/wheel"
import { formatFullDate } from "@/i18n/format"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { font } from "@/theme"

const months = Array.from({ length: 12 }, (_, index) => index + 1)

export function BirthdayPicker({
	answered,
	answer,
	unknownBirthday,
	setUnknownBirthday,
	year,
	setYear,
	years,
	month,
	setMonth,
	chosenDay,
	setDay,
	days,
	first,
}: {
	answered: boolean
	answer(): void
	unknownBirthday: boolean
	setUnknownBirthday(value: boolean): void
	year: number
	setYear(value: number): void
	years: number[]
	month: number
	setMonth(value: number): void
	chosenDay: number
	setDay(value: number): void
	days: number[]
	first?: boolean
}) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const [open, setOpen] = useState(false)

	function birthdayLabel() {
		if (!answered) {
			return t("parrot.choose")
		}

		return unknownBirthday
			? t("common.unknown")
			: formatFullDate(new Date(year, month - 1, chosenDay), locale)
	}

	function confirm() {
		answer()

		setOpen(false)
	}

	return (
		<>
			<NavRow
				first={first}
				label={t("parrot.birthday")}
				value={birthdayLabel()}
				onPress={() => setOpen(true)}
			/>
			<Sheet
				visible={open}
				title={t("parrot.birthdayQuestion")}
				onClose={() => setOpen(false)}
			>
				<View
					style={unknownBirthday && styles.dimmed}
					pointerEvents={unknownBirthday ? "none" : "auto"}
					accessibilityElementsHidden={unknownBirthday}
				>
					<WheelRow>
						<View style={styles.pickerGroup}>
							<Wheel
								testID="birthday-year"
								value={year}
								values={years}
								onChange={setYear}
								label={t("parrot.yearPicker")}
							/>
							<Copy style={styles.unit}>{t("parrot.year")}</Copy>
						</View>
						<View style={styles.pickerGroup}>
							<Wheel
								testID="birthday-month"
								value={month}
								values={months}
								onChange={setMonth}
								label={t("parrot.monthPicker")}
							/>
							<Copy style={styles.unit}>{t("parrot.month")}</Copy>
						</View>
						<View style={styles.pickerGroup}>
							<Wheel
								testID="birthday-day"
								value={chosenDay}
								values={days}
								onChange={setDay}
								label={t("parrot.dayPicker")}
							/>
							<Copy style={styles.unit}>{t("parrot.day")}</Copy>
						</View>
					</WheelRow>
				</View>
				<GroupedList>
					<CheckRow
						first
						label={t("parrot.birthdayUnknown")}
						checked={unknownBirthday}
						onToggle={() => setUnknownBirthday(!unknownBirthday)}
					/>
				</GroupedList>
				<Button label={t("common.select")} onPress={confirm} />
			</Sheet>
		</>
	)
}

const styles = StyleSheet.create({
	dimmed: { opacity: 0.35 },
	pickerGroup: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 4 },
	unit: { fontFamily: font.extraBold, fontSize: 16, minWidth: 22 },
})
