import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { IconButton } from "@/components/ui/icon-button"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { formatDateWithWeekday, formatMonth } from "@/i18n/format"
import type { DayMark } from "@/screens/Records/hooks/use-records-calendar"
import { colors, font } from "@/theme"
import { localDate } from "@/utils/date"

type MonthCalendarProps = {
	month: Date
	selected: string
	marks: ReadonlyMap<string, DayMark>
	canGoNext: boolean
	onSelect(key: string): void
	onPrevious(): void
	onNext(): void
}

function monthCells(month: Date): (Date | null)[] {
	const leading = new Date(month.getFullYear(), month.getMonth(), 1).getDay()
	const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
	const cells: (Date | null)[] = [
		...Array.from({ length: leading }, () => null),
		...Array.from(
			{ length: days },
			(_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1),
		),
	]
	const trailing = (7 - (cells.length % 7)) % 7

	return [...cells, ...Array.from({ length: trailing }, () => null)]
}

export function MonthCalendar({
	month,
	selected,
	marks,
	canGoNext,
	onSelect,
	onPrevious,
	onNext,
}: MonthCalendarProps) {
	const { t } = useTranslation()
	const locale = useDeviceSetting("locale")
	const today = localDate()
	const cells = monthCells(month)

	return (
		<View style={styles.wrap}>
			<View style={styles.nav}>
				<Copy style={styles.month}>{formatMonth(month, locale)}</Copy>
				<IconButton icon="back" label={t("records.prevMonth")} onPress={onPrevious} />
				<IconButton
					icon="forward"
					label={t("records.nextMonth")}
					disabled={!canGoNext}
					onPress={onNext}
				/>
			</View>
			<View style={styles.grid}>
				{t("records.weekdays")
					.split(",")
					.map((day, index) => (
						<View key={index} style={styles.cell} importantForAccessibility="no">
							<Copy style={styles.weekday}>{day}</Copy>
						</View>
					))}
				{cells.map((date, index) => {
					if (!date) {
						return <View key={`empty-${index}`} style={styles.cell} />
					}

					const key = localDate(date)
					const mark = marks.get(key)
					const isSelected = key === selected
					const isToday = key === today
					const label = [
						formatDateWithWeekday(date, locale),
						isToday ? t("records.calendar.today") : null,
						mark?.session ? t("records.calendar.hasSession") : null,
						mark?.emergency ? t("records.calendar.hasEmergency") : null,
					]
						.filter(Boolean)
						.join(", ")

					return (
						<PressableSurface
							key={key}
							tone="plain"
							depth={0}
							accessibilityRole="button"
							accessibilityLabel={label}
							accessibilityState={{ selected: isSelected }}
							onPress={() => onSelect(key)}
							style={styles.cell}
							contentStyle={styles.cellFace}
						>
							<View
								style={[
									styles.day,
									isToday && styles.today,
									isSelected && styles.selected,
								]}
							>
								<Copy
									style={[
										styles.dayText,
										isToday && styles.todayText,
										isSelected && styles.selectedText,
									]}
								>
									{date.getDate()}
								</Copy>
							</View>
							<View style={styles.dots}>
								{mark?.session ? <View style={styles.dot} /> : null}
								{mark?.emergency ? (
									<View style={[styles.dot, styles.alarm]} />
								) : null}
							</View>
						</PressableSurface>
					)
				})}
			</View>
		</View>
	)
}

const DAY = 34

const styles = StyleSheet.create({
	wrap: { gap: 8 },
	nav: { flexDirection: "row", alignItems: "center", gap: 4 },
	month: { flex: 1, fontFamily: font.black, fontSize: 18, lineHeight: 24 },
	grid: { flexDirection: "row", flexWrap: "wrap" },
	cell: {
		width: `${100 / 7}%`,
		minHeight: 48,
		alignItems: "center",
		justifyContent: "center",
		gap: 3,
	},
	cellFace: { alignItems: "center", justifyContent: "center", gap: 3 },
	weekday: { fontFamily: font.extraBold, fontSize: 12, color: colors.muted },
	day: {
		width: DAY,
		height: DAY,
		borderRadius: DAY / 2,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: colors.background,
	},
	today: { borderColor: colors.orangeSoft },
	selected: { backgroundColor: colors.orange, borderColor: colors.orangeDark },
	dayText: {
		fontFamily: font.extraBold,
		fontSize: 15,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
	todayText: { color: colors.orangeDark },
	selectedText: { color: colors.onAccent },
	dots: { flexDirection: "row", gap: 3, height: 6 },
	dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.orange },
	alarm: { backgroundColor: colors.error },
})
