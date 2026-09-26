import { useState } from "react"
import { useTranslation } from "react-i18next"
import { type LayoutChangeEvent, StyleSheet, View } from "react-native"
import Svg, { Line, Polyline, Rect } from "react-native-svg"

import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { formatDateWithWeekday, formatTime } from "@/i18n/format"
import { phaseSpans, type SleepWindow } from "@/services/session/phases"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font, phaseColors } from "@/theme"

export type StripSound = { id: string; at: number; mimicked: boolean }

type AbsenceStripProps = {
	start: number
	end: number
	running: boolean
	sleep: SleepWindow
	activity: readonly { at: number; level: number }[]
	sounds: readonly StripSound[]
	cursor?: number | null
	legend?: boolean
	onSelectSound?(id: string): void
	onSelectTime?(at: number): void
}

const ACTIVITY_HEIGHT = 36
const BAR_TOP = ACTIVITY_HEIGHT + 8
const BAR_HEIGHT = 24
const DOT_TOP = BAR_TOP + BAR_HEIGHT + 8
const ROW_HEIGHT = DOT_TOP + 18
const DOT = 12
const MARKER = 28
const TICK_HOURS = 3

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

function hourMarks(from: number, to: number) {
	const marks: number[] = []
	const date = new Date(from)

	date.setMinutes(0, 0, 0)
	date.setHours(date.getHours() + 1)

	while (date.getTime() < to) {
		if (date.getHours() % TICK_HOURS === 0) {
			marks.push(date.getTime())
		}

		date.setHours(date.getHours() + 1)
	}

	return marks
}

export function AbsenceStrip({
	start,
	end,
	running,
	sleep,
	activity,
	sounds,
	cursor,
	legend = true,
	onSelectSound,
	onSelectTime,
}: AbsenceStripProps) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const rows = dayRows(start, end)
	const multiDay = rows.length > 1

	return (
		<View
			style={styles.strip}
			accessibilityLabel={t("common.strip.label", {
				start: formatTime(start, locale),
				end: running ? t("common.strip.now") : formatTime(end, locale),
			})}
		>
			{rows.map((row, index) => (
				<StripRow
					key={row.from}
					from={row.from}
					to={row.to}
					dateLabel={multiDay ? formatDateWithWeekday(row.from, locale) : null}
					isLast={index === rows.length - 1}
					running={running}
					sleep={sleep}
					activity={activity}
					sounds={sounds}
					cursor={cursor}
					onSelectSound={onSelectSound}
					onSelectTime={onSelectTime}
				/>
			))}
			{legend ? <Legend /> : null}
		</View>
	)
}

function StripRow({
	from,
	to,
	dateLabel,
	isLast,
	running,
	sleep,
	activity,
	sounds,
	cursor,
	onSelectSound,
	onSelectTime,
}: Omit<AbsenceStripProps, "start" | "end" | "legend"> & {
	from: number
	to: number
	dateLabel: string | null
	isLast: boolean
}) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const [width, setWidth] = useState(0)

	const span = Math.max(1, to - from)
	const x = (at: number) => ((at - from) / span) * width
	const inRow = (at: number) => at >= from && at < to + (isLast ? 1 : 0)
	const spans = phaseSpans(from, to, sleep)
	const points = activity
		.filter((point) => inRow(point.at))
		.map((point) => `${x(point.at)},${ACTIVITY_HEIGHT - point.level * (ACTIVITY_HEIGHT - 4)}`)
		.join(" ")

	function measure(event: LayoutChangeEvent) {
		setWidth(event.nativeEvent.layout.width)
	}

	const chart = (
		<Svg width={width} height={ROW_HEIGHT}>
			{points ? (
				<Polyline
					points={points}
					fill="none"
					stroke={colors.border}
					strokeWidth={2}
					strokeLinejoin="round"
				/>
			) : null}
			<Rect
				x={0}
				y={BAR_TOP}
				width={width}
				height={BAR_HEIGHT}
				rx={8}
				fill={colors.surface}
			/>
			{spans.map((item) => (
				<Rect
					key={item.start}
					x={x(item.start)}
					y={BAR_TOP}
					width={Math.max(1, x(item.end) - x(item.start))}
					height={BAR_HEIGHT}
					fill={phaseColors[item.phase]}
				/>
			))}
			{hourMarks(from, to).map((mark) => (
				<Line
					key={mark}
					x1={x(mark)}
					x2={x(mark)}
					y1={BAR_TOP + BAR_HEIGHT}
					y2={BAR_TOP + BAR_HEIGHT + 4}
					stroke={colors.muted}
					strokeWidth={1}
				/>
			))}
			{cursor != null && inRow(cursor) ? (
				<Rect
					x={x(cursor) - 1.5}
					y={0}
					width={3}
					height={ROW_HEIGHT}
					rx={1.5}
					fill={colors.text}
				/>
			) : null}
		</Svg>
	)

	return (
		<View>
			{dateLabel ? <Copy style={styles.date}>{dateLabel}</Copy> : null}
			<View style={styles.row} onLayout={measure}>
				{width > 0 ? (
					<>
						{onSelectTime ? (
							<PressableSurface
								accessibilityLabel={t("common.strip.selectTime")}
								onPress={(point) => onSelectTime(from + (point.x / width) * span)}
								tone="plain"
								depth={0}
								cornerRadius={0}
								style={StyleSheet.absoluteFill}
								contentStyle={styles.fill}
							>
								{chart}
							</PressableSurface>
						) : (
							<View style={StyleSheet.absoluteFill}>{chart}</View>
						)}
						{sounds
							.filter((sound) => inRow(sound.at))
							.map((sound) => (
								<Marker
									key={sound.id}
									left={x(sound.at)}
									color={sound.mimicked ? colors.orange : colors.disabled}
									label={t("common.strip.sound", {
										time: formatTime(sound.at, locale),
									})}
									onPress={
										onSelectSound ? () => onSelectSound(sound.id) : undefined
									}
								/>
							))}
					</>
				) : null}
			</View>
			<View style={styles.ends}>
				<Copy style={styles.end}>{formatTime(from, locale)}</Copy>
				<Copy style={styles.end}>
					{isLast && running ? t("common.strip.now") : formatTime(to, locale)}
				</Copy>
			</View>
		</View>
	)
}

function Marker({
	left,
	color,
	label,
	onPress,
}: {
	left: number
	color: string
	label: string
	onPress?(): void
}) {
	const dot = <View style={[styles.dot, { backgroundColor: color }]} />
	const position = [styles.marker, { left: left - MARKER / 2 }]

	if (!onPress) {
		return (
			<View style={position} accessible accessibilityLabel={label}>
				{dot}
			</View>
		)
	}

	return (
		<PressableSurface
			accessibilityLabel={label}
			onPress={onPress}
			tone="plain"
			depth={0}
			cornerRadius={MARKER / 2}
			style={position}
			contentStyle={styles.markerFace}
		>
			{dot}
		</PressableSurface>
	)
}

function Legend() {
	const { t } = useTranslation()

	const items = [
		{ label: t("common.strip.learning"), color: colors.orange, round: false },
		{ label: t("common.strip.rest"), color: colors.blue, round: false },
		{ label: t("common.strip.sleeping"), color: colors.disabled, round: false },
		{ label: t("common.strip.mimicry"), color: colors.orange, round: true },
		{ label: t("common.strip.otherSound"), color: colors.disabled, round: true },
	]

	return (
		<View
			style={styles.legend}
			accessible={false}
			importantForAccessibility="no-hide-descendants"
		>
			{items.map((item) => (
				<View key={item.label} style={styles.legendItem}>
					<View
						style={[
							item.round ? styles.legendDot : styles.legendBar,
							{ backgroundColor: item.color },
						]}
					/>
					<Copy style={styles.legendText}>{item.label}</Copy>
				</View>
			))}
		</View>
	)
}

const styles = StyleSheet.create({
	strip: { gap: 10 },
	date: { fontFamily: font.extraBold, fontSize: 13, color: colors.text, marginBottom: 4 },
	row: { height: ROW_HEIGHT, width: "100%" },
	fill: { borderWidth: 0 },
	marker: {
		position: "absolute",
		top: DOT_TOP + DOT / 2 - MARKER / 2,
		width: MARKER,
		height: MARKER,
		alignItems: "center",
		justifyContent: "center",
	},
	markerFace: { alignItems: "center", justifyContent: "center", borderWidth: 0 },
	dot: { width: DOT, height: DOT, borderRadius: DOT / 2 },
	ends: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
	end: { fontFamily: font.extraBold, fontSize: 13, color: colors.text },
	legend: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 8 },
	legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
	legendBar: { width: 18, height: 12, borderRadius: 4 },
	legendDot: { width: 12, height: 12, borderRadius: 6 },
	legendText: { fontFamily: font.extraBold, fontSize: 13, color: colors.text },
})
