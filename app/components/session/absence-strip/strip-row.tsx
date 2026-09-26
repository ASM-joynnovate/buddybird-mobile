import { useState } from "react"
import { useTranslation } from "react-i18next"
import { type LayoutChangeEvent, StyleSheet, View } from "react-native"
import Svg, { Line, Polyline, Rect } from "react-native-svg"

import {
	ACTIVITY_HEIGHT,
	BAR_HEIGHT,
	BAR_TOP,
	ROW_HEIGHT,
} from "@/components/session/absence-strip/layout"
import { Marker } from "@/components/session/absence-strip/marker"
import type { StripData } from "@/components/session/absence-strip/types"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { formatTime } from "@/i18n/format"
import { phaseSpans } from "@/services/session/phases"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font, phaseColors } from "@/theme"

const TICK_HOURS = 3

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

interface Props extends StripData {
	from: number
	to: number
	dateLabel: string | null
	isLast: boolean
}

export function StripRow({
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
}: Props) {
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

const styles = StyleSheet.create({
	date: { fontFamily: font.extraBold, fontSize: 13, color: colors.text, marginBottom: 4 },
	row: { height: ROW_HEIGHT, width: "100%" },
	fill: { borderWidth: 0 },
	ends: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
	end: { fontFamily: font.extraBold, fontSize: 13, color: colors.text },
})
