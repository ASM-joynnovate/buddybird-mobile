import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { Card } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { Wheel, WheelRow } from "@/components/ui/wheel"
import { font } from "@/theme"

const hours = Array.from({ length: 24 }, (_, index) => index)
const minutes = Array.from({ length: 60 }, (_, index) => index)

export function CustomDurationPicker({
	customMinutes,
	changeCustomHours,
	changeCustomMinutes,
}: {
	customMinutes: number
	changeCustomHours(value: number): void
	changeCustomMinutes(value: number): void
}) {
	const { t } = useTranslation()

	return (
		<Card style={styles.pickerCard} contentStyle={styles.content}>
			<Copy style={styles.pickerTitle}>{t("learning.total")}</Copy>
			<WheelRow>
				<View style={styles.group}>
					<Wheel
						testID="duration-hours"
						label={t("learning.hourPicker")}
						value={Math.floor(customMinutes / 60)}
						values={hours}
						onChange={changeCustomHours}
					/>
					<Copy style={styles.unit}>{t("common.hours")}</Copy>
				</View>
				<View style={styles.group}>
					<Wheel
						testID="duration-minutes"
						label={t("learning.minutePicker")}
						value={customMinutes % 60}
						values={minutes}
						onChange={changeCustomMinutes}
					/>
					<Copy style={styles.unit}>{t("common.minutes")}</Copy>
				</View>
			</WheelRow>
		</Card>
	)
}

const styles = StyleSheet.create({
	pickerCard: { marginBottom: 16 },
	content: { padding: 12, gap: 10 },
	pickerTitle: { textAlign: "center", fontSize: 12, lineHeight: 17 },
	group: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6 },
	unit: { fontFamily: font.extraBold, fontSize: 18, minWidth: 34 },
})
