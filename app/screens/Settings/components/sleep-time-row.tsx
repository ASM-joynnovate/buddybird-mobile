import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Icon, type IconName } from "@/components/ui/icon"
import { NavRow } from "@/components/ui/rows"
import { Copy } from "@/components/ui/text"
import { Wheel, WheelRow } from "@/components/ui/wheel"
import { formatClock } from "@/i18n/format"
import { colors, font } from "@/theme"
import type { Locale } from "@/types/locale"

const HOURS = Array.from({ length: 24 }, (_, index) => index)
const MINUTES = Array.from({ length: 60 }, (_, index) => index)

const pad = (value: number) => String(value).padStart(2, "0")

export function SleepTimeRow({
	label,
	icon,
	value,
	locale,
	open,
	first,
	onToggle,
	onChange,
}: {
	label: string
	icon: IconName
	value: string
	locale: Locale
	open: boolean
	first?: boolean
	onToggle(): void
	onChange(value: string): void
}) {
	const { t } = useTranslation()
	const [hour, minute] = value.split(":").map(Number)

	return (
		<>
			<NavRow
				first={first}
				icon={icon}
				label={label}
				value={formatClock(value, locale)}
				onPress={onToggle}
				expanded={open}
				trailing=<Icon name={open ? "close" : "clock"} size={18} color={colors.disabled} />
			/>
			{open ? (
				<View style={styles.picker}>
					<WheelRow>
						<View style={styles.group}>
							<Wheel
								testID={`${icon}-hour`}
								label={t("settings.care.hourPicker", { label })}
								value={hour}
								values={HOURS}
								onChange={(next) => onChange(`${pad(next)}:${pad(minute)}:00`)}
							/>
							<Copy style={styles.unit}>{t("settings.care.hour")}</Copy>
						</View>
						<View style={styles.group}>
							<Wheel
								testID={`${icon}-minute`}
								label={t("settings.care.minutePicker", { label })}
								value={minute}
								values={MINUTES}
								onChange={(next) => onChange(`${pad(hour)}:${pad(next)}:00`)}
							/>
							<Copy style={styles.unit}>{t("settings.care.minute")}</Copy>
						</View>
					</WheelRow>
				</View>
			) : null}
		</>
	)
}

const styles = StyleSheet.create({
	picker: {
		borderTopWidth: 2,
		borderTopColor: colors.border,
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	group: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 4 },
	unit: { fontFamily: font.extraBold, fontSize: 16, minWidth: 22 },
})
