import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { formatDate, formatTime } from "@/i18n/format"
import type { DayAlarm, DayBar } from "@/screens/Records/hooks/use-records-calendar"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font } from "@/theme"

type DayRulerProps = {
	from: number
	bars: readonly DayBar[]
	alarms: readonly DayAlarm[]
	highlightedId: string | null
	onSelect(id: string): void
}

const DAY_MS = 24 * 60 * 60 * 1000
const HOURS = [0, 6, 12, 18, 24]
const MIN_BAR = 1.5

export function DayRuler({ from, bars, alarms, highlightedId, onSelect }: DayRulerProps) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const percent = (at: number) => ((at - from) / DAY_MS) * 100

	return (
		<View accessibilityLabel={t("records.ruler.label", { date: formatDate(from, locale) })}>
			<View style={styles.lane}>
				<View style={styles.track}>
					{HOURS.slice(1, -1).map((hour) => (
						<View key={hour} style={[styles.tick, { left: `${(hour / 24) * 100}%` }]} />
					))}
				</View>
				{bars.map((bar) => {
					const left = percent(bar.from)
					const width = Math.max(MIN_BAR, percent(bar.to) - left)
					const highlighted = bar.id === highlightedId

					return (
						<PressableSurface
							key={bar.id}
							tone="plain"
							depth={0}
							cornerRadius={4}
							accessibilityRole="button"
							accessibilityLabel={t("records.ruler.bar", {
								start: formatTime(bar.from, locale),
								end: bar.running
									? t("records.card.now")
									: formatTime(bar.to, locale),
							})}
							accessibilityState={{ selected: highlighted }}
							onPress={() => onSelect(bar.id)}
							style={[styles.hit, { left: `${left}%`, width: `${width}%` }]}
							contentStyle={styles.hitFace}
						>
							<View style={[styles.bar, highlighted && styles.highlighted]} />
						</PressableSurface>
					)
				})}
				{alarms.map((alarm) => (
					<View
						key={alarm.id}
						importantForAccessibility="no"
						pointerEvents="none"
						style={[styles.alarm, { left: `${percent(alarm.at)}%` }]}
					/>
				))}
			</View>
			<View style={styles.hours}>
				{HOURS.map((hour) => (
					<Copy key={hour} style={styles.hour}>
						{t("records.ruler.hour", { hour })}
					</Copy>
				))}
			</View>
		</View>
	)
}

const ALARM = 8
const TRACK = 20

const styles = StyleSheet.create({
	alarm: {
		position: "absolute",
		top: 2,
		width: ALARM,
		height: ALARM,
		marginLeft: -ALARM / 2,
		borderRadius: ALARM / 2,
		backgroundColor: colors.error,
	},
	lane: { height: 44, justifyContent: "center" },
	track: {
		height: TRACK,
		borderRadius: 6,
		backgroundColor: colors.surface,
		borderWidth: 2,
		borderColor: colors.border,
		overflow: "hidden",
	},
	tick: {
		position: "absolute",
		top: 0,
		bottom: 0,
		width: 1,
		backgroundColor: colors.border,
	},
	hit: { position: "absolute", top: 0, bottom: 0 },
	hitFace: { justifyContent: "center", borderWidth: 0 },
	bar: { height: TRACK, borderRadius: 4, backgroundColor: colors.orange },
	highlighted: { backgroundColor: colors.orangeDark },
	hours: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
	hour: {
		fontFamily: font.extraBold,
		fontSize: 12,
		color: colors.muted,
		fontVariant: ["tabular-nums"],
	},
})
