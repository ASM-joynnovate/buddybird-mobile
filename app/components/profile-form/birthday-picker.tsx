import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { Chip } from "@/components/ui/chip"
import { InlineError } from "@/components/ui/inline-error"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { Wheel, WheelRow } from "@/components/ui/wheel"
import { colors, font } from "@/theme"
const months = Array.from({ length: 12 }, (_, index) => index + 1)

export function BirthdayPicker({
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
	birthdayError,
}: {
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
	birthdayError: string | null
}) {
	const { t } = useTranslation()

	return (
		<>
			<View style={styles.labelRow}>
				<Copy style={[ui.label, styles.noMargin]}>{t("profile.birthday")}</Copy>
				<Chip
					testID="birthday-unknown"
					label={t(unknownBirthday ? "common.selected" : "common.unknown")}
					selected={unknownBirthday}
					onPress={() => setUnknownBirthday(!unknownBirthday)}
				/>
			</View>
			{unknownBirthday ? (
				<Copy style={styles.birthdayHint}>{t("profile.birthdayUnknown")}</Copy>
			) : (
				<WheelRow>
					<View style={styles.pickerGroup}>
						<Wheel
							testID="birthday-year"
							value={year}
							values={years}
							onChange={setYear}
							label={t("profile.yearPicker")}
						/>
						<Copy style={styles.unit}>{t("profile.year")}</Copy>
					</View>
					<View style={styles.pickerGroup}>
						<Wheel
							testID="birthday-month"
							value={month}
							values={months}
							onChange={setMonth}
							label={t("profile.monthPicker")}
						/>
						<Copy style={styles.unit}>{t("profile.month")}</Copy>
					</View>
					<View style={styles.pickerGroup}>
						<Wheel
							testID="birthday-day"
							value={chosenDay}
							values={days}
							onChange={setDay}
							label={t("profile.dayPicker")}
						/>
						<Copy style={styles.unit}>{t("profile.day")}</Copy>
					</View>
				</WheelRow>
			)}
			<InlineError message={birthdayError} />
		</>
	)
}

const styles = StyleSheet.create({
	labelRow: {
		flexWrap: "wrap",
		gap: 10,
		marginTop: 24,
		marginBottom: 10,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	noMargin: { marginBottom: 0 },
	pickerGroup: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 4 },
	unit: { fontFamily: font.extraBold, fontSize: 16, minWidth: 22 },
	birthdayHint: { color: colors.muted, paddingVertical: 12, lineHeight: 23 },
})
