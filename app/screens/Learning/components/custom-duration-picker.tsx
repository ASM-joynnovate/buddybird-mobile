import { useTranslation } from "react-i18next"

import { StyleSheet, View } from "react-native"

import { Card } from "@/components/ui/surface"

import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { Wheel } from "@/components/ui/wheel"
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
		<Card style={styles.pickerCard}>
			<Copy style={styles.pickerTitle}>{t("learning.total")}</Copy>
			<View style={ui.row}>
				<Wheel
					testID="duration-hours"
					label={t("learning.hourPicker")}
					value={Math.floor(customMinutes / 60)}
					values={hours}
					onChange={changeCustomHours}
				/>
				<Copy>{t("common.hours")}</Copy>
				<Wheel
					testID="duration-minutes"
					label={t("learning.minutePicker")}
					value={customMinutes % 60}
					values={minutes}
					onChange={changeCustomMinutes}
				/>
				<Copy>{t("common.minutes")}</Copy>
			</View>
		</Card>
	)
}

const styles = StyleSheet.create({
	pickerCard: { marginBottom: 16 },
	pickerTitle: { textAlign: "center", marginBottom: 4 },
})
