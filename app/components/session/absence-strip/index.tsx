import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Legend } from "@/components/session/absence-strip/legend"
import { StripRow } from "@/components/session/absence-strip/strip-row"
import type { StripData } from "@/components/session/absence-strip/types"
import { formatDateWithWeekday, formatTime } from "@/i18n/format"
import { useDeviceSettingsStore } from "@/stores/device-settings"

interface Props extends StripData {
	start: number
	end: number
	legend?: boolean
}

function dayRows(start: number, end: number) {
	const rows: { from: number; to: number }[] = []
	let cursor = start

	while (cursor < end) {
		const next = new Date(cursor)

		next.setHours(24, 0, 0, 0)
		rows.push({ from: cursor, to: Math.min(next.getTime(), end) })
		cursor = next.getTime()
	}

	return rows.length ? rows : [{ from: start, to: Math.max(end, start + 1) }]
}

export function AbsenceStrip({ start, end, legend = true, ...data }: Props) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const rows = dayRows(start, end)
	const multiDay = rows.length > 1

	return (
		<View
			style={styles.strip}
			accessibilityLabel={t("common.strip.label", {
				start: formatTime(start, locale),
				end: data.running ? t("common.strip.now") : formatTime(end, locale),
			})}
		>
			{rows.map((row, index) => (
				<StripRow
					key={row.from}
					{...data}
					from={row.from}
					to={row.to}
					dateLabel={multiDay ? formatDateWithWeekday(row.from, locale) : null}
					isLast={index === rows.length - 1}
				/>
			))}
			{legend ? <Legend /> : null}
		</View>
	)
}

const styles = StyleSheet.create({
	strip: { gap: 10 },
})
