import { useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { GroupedList, RadioRow } from "@/components/ui/rows"
import { WheelPicker } from "@/components/ui/wheel-picker"
import { DURATION_PRESETS, MAX_SESSION_MS } from "@/config"
import { formatDuration } from "@/i18n/format"
import { useDeviceSettingsStore } from "@/stores/device-settings"
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
				<RadioRow
					first
					label={t("session.start.untilEnd")}
					selected={!custom && value === null}
					onPress={() => {
						setCustom(false)

						onChange(null)
					}}
				/>
				{DURATION_PRESETS.map((preset) => (
					<RadioRow
						key={preset}
						label={formatDuration(preset, locale)}
						selected={!custom && value === preset}
						onPress={() => {
							setCustom(false)

							onChange(preset)
						}}
					/>
				))}
				<RadioRow
					label={t("session.start.custom")}
					selected={custom}
					onPress={() => setCustom(true)}
				/>
			</GroupedList>
			{custom ? (
				<WheelPicker
					columns={[
						{
							key: "days",
							label: t("session.start.days"),
							value: days,
							values: DAYS,
							unit: t("session.start.days"),
							onChange: (next) => change(next, hours, minutes),
						},
						{
							key: "hours",
							label: t("session.start.hours"),
							value: hours,
							values: atMax ? [0] : HOURS,
							unit: t("session.start.hours"),
							onChange: (next) => change(days, next, minutes),
						},
						{
							key: "minutes",
							label: t("session.start.minutes"),
							value: minutes,
							values: atMax ? [0] : MINUTE_STEPS,
							unit: t("session.start.minutes"),
							onChange: (next) => change(days, hours, next),
						},
					]}
				/>
			) : null}
		</View>
	)
}

const styles = StyleSheet.create({
	picker: { gap: 12 },
})
