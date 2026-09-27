import dayjs from "dayjs"
import type { TFunction } from "i18next"
import { type ReactElement, useState } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { formatDateWithWeekday, formatDuration } from "@/i18n/format"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font } from "@/theme"
import type { Report } from "@/types/apis/reports"
import type { Locale } from "@/types/locale"
import type { ReportPeriod } from "@/types/report-period"

const CHART_HEIGHT = 150
const MIN_BAR = 3

type Bucket = Report["trend"][number]

function axisLabel(period: ReportPeriod, date: Date, locale: Locale, t: TFunction): string {
	if (period === "week") {
		return date.toLocaleDateString(locale, { weekday: "short" })
	}

	if (period === "day") {
		return date.getHours() % 6 === 0 ? t("report.hour", { hour: date.getHours() }) : ""
	}

	return (date.getDate() - 1) % 7 === 0 ? String(date.getDate()) : ""
}

interface Props {
	period: ReportPeriod
	trend: Bucket[]
}

export function TrendChart({ period, trend }: Props): ReactElement {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const [selected, setSelected] = useState<number | null>(null)

	const max = Math.max(1, ...trend.map((bucket) => bucket.learning_duration_ms))
	const describe = (bucket: Bucket) =>
		t("report.bar", {
			label:
				period === "day"
					? dayjs(bucket.start).format("LT")
					: formatDateWithWeekday(bucket.start, locale),
			duration: formatDuration(bucket.learning_duration_ms, locale),
		})
	const picked = selected === null ? null : trend[selected]

	return (
		<View>
			<Copy accessibilityLiveRegion="polite" style={styles.detail}>
				{picked ? describe(picked) : " "}
			</Copy>
			<View style={[styles.bars, period === "week" ? styles.wide : styles.narrow]}>
				{trend.map((bucket, index) => (
					<PressableSurface
						key={bucket.start}
						tone="plain"
						depth="none"
						cornerRadius="xsmall"
						accessibilityLabel={describe(bucket)}
						accessibilityState={{ selected: selected === index }}
						onPress={() => setSelected(selected === index ? null : index)}
						style={styles.column}
						contentStyle={styles.columnFace}
					>
						<View
							style={[
								styles.bar,
								{
									height: Math.max(
										MIN_BAR,
										(bucket.learning_duration_ms / max) * CHART_HEIGHT,
									),
								},
								bucket.learning_duration_ms === 0 && styles.empty,
								selected === index && styles.selected,
							]}
						/>
					</PressableSurface>
				))}
			</View>
			<View
				style={[styles.axis, period === "week" ? styles.wide : styles.narrow]}
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
			>
				{trend.map((bucket) => (
					<View key={bucket.start} style={styles.column}>
						<Copy numberOfLines={1} style={styles.axisText}>
							{axisLabel(period, new Date(bucket.start), locale, t)}
						</Copy>
					</View>
				))}
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	detail: {
		fontFamily: font.extraBold,
		fontSize: 13.5,
		color: colors.orangeDark,
		minHeight: 20,
		marginBottom: 6,
	},
	bars: { height: CHART_HEIGHT, flexDirection: "row", alignItems: "stretch" },
	wide: { gap: 8 },
	narrow: { gap: 2 },
	column: { flex: 1, minWidth: 0, justifyContent: "flex-end", alignItems: "center" },
	columnFace: { flexGrow: 1, borderWidth: 0, justifyContent: "flex-end", alignSelf: "stretch" },
	bar: { alignSelf: "stretch", borderRadius: 4, backgroundColor: colors.orange },
	empty: { backgroundColor: colors.border },
	selected: { backgroundColor: colors.orangeDark },
	axis: { flexDirection: "row", marginTop: 6 },
	axisText: {
		width: 36,
		textAlign: "center",
		fontFamily: font.extraBold,
		fontSize: 12,
		color: colors.muted,
	},
})
