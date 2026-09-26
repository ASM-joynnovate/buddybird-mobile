import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { CheckRow, GroupedList } from "@/components/ui/rows"
import { Copy } from "@/components/ui/text"
import { Wheel, WheelRow } from "@/components/ui/wheel"
import { DURATION_PRESETS, MAX_SESSION_MS } from "@/config"
import { formatDuration } from "@/i18n/format"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { font } from "@/theme"
import { DAY, HOUR, MINUTE } from "@/utils/units"

const DAYS = Array.from({ length: 8 }, (_, day) => day)
const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const MINUTE_STEPS = Array.from({ length: 12 }, (_, index) => index * 5)

interface Props {
	value: number | null
	onChange(value: number | null): void
}

export function DurationPicker({ value, onChange }: Props) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const [custom, setCustom] = useState(
		value !== null && !DURATION_PRESETS.some((preset) => preset === value),
	)

	const total = value ?? 0
	const days = Math.floor(total / DAY)
	const hours = Math.floor((total % DAY) / HOUR)
	const minutes = Math.floor((total % HOUR) / MINUTE)
	const atMax = total >= MAX_SESSION_MS

	function change(nextDays: number, nextHours: number, nextMinutes: number) {
		const next = Math.min(
			nextDays * DAY + nextHours * HOUR + nextMinutes * MINUTE,
			MAX_SESSION_MS,
		)

		onChange(next > 0 ? next : null)
	}

	return (
		<View style={styles.picker}>
			<GroupedList>
				{DURATION_PRESETS.map((preset, index) => (
					<CheckRow
						key={preset}
						first={index === 0}
						label={formatDuration(preset, locale)}
						checked={!custom && value === preset}
						onToggle={() => {
							setCustom(false)
							onChange(!custom && value === preset ? null : preset)
						}}
					/>
				))}
				<CheckRow
					label={t("session.start.custom")}
					checked={custom}
					onToggle={() => setCustom(true)}
				/>
			</GroupedList>
			{custom ? (
				<WheelRow>
					<Wheel
						testID="duration-days"
						label={t("session.start.days")}
						value={days}
						values={DAYS}
						onChange={(next) => change(next, hours, minutes)}
					/>
					<Copy style={styles.unit}>{t("session.start.days")}</Copy>
					<Wheel
						testID="duration-hours"
						label={t("session.start.hours")}
						value={hours}
						values={atMax ? [0] : HOURS}
						onChange={(next) => change(days, next, minutes)}
					/>
					<Copy style={styles.unit}>{t("session.start.hours")}</Copy>
					<Wheel
						testID="duration-minutes"
						label={t("session.start.minutes")}
						value={minutes}
						values={atMax ? [0] : MINUTE_STEPS}
						onChange={(next) => change(days, hours, next)}
					/>
					<Copy style={styles.unit}>{t("session.start.minutes")}</Copy>
				</WheelRow>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	picker: { gap: 12 },
	unit: { fontFamily: font.extraBold, fontSize: 15 },
})
