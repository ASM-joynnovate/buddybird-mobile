import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import type { Session, Timeline } from "@/apis/sessions"
import { AbsenceStrip } from "@/components/session/absence-strip"
import { Card } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { formatDuration } from "@/i18n/format"
import { colors, font } from "@/theme"

type SessionOverviewProps = {
	session: Session
	timeline: Timeline
	end: number
	running: boolean
	cursor: number | null
	onSelectKey(key: string): void
	onSelectTime(at: number): void
}

export function SessionOverview({
	session,
	timeline,
	end,
	running,
	cursor,
	onSelectKey,
	onSelectTime,
}: SessionOverviewProps) {
	const { t } = useTranslation()
	const locale = useDeviceSetting("locale")
	const start = Date.parse(session.started_at)
	const word = session.learning_enabled && session.word ? session.word.name : null
	const emergencies = timeline.events.flatMap((event) =>
		event.kind === "emergency_detected" && event.emergency
			? [{ id: event.emergency.id, at: Date.parse(event.occurred_at) }]
			: [],
	)

	return (
		<Card contentStyle={styles.card}>
			<View style={styles.top}>
				<Copy numberOfLines={1} style={[styles.word, !word && styles.off]}>
					{word ?? t("records.card.learningOff")}
				</Copy>
				<Copy style={styles.duration}>{formatDuration(end - start, locale)}</Copy>
			</View>
			<AbsenceStrip
				start={start}
				end={Math.max(end, start + 1)}
				running={running}
				sleep={{ sleepAt: session.sleep_at, wakeAt: session.wake_at }}
				activity={timeline.activity.map((point) => ({
					at: Date.parse(point.at),
					level: point.level,
				}))}
				sounds={timeline.sounds.map((sound) => ({
					id: sound.id,
					at: Date.parse(sound.captured_at),
					mimicked: sound.judgment !== null,
				}))}
				emergencies={emergencies}
				cursor={cursor}
				onSelectSound={onSelectKey}
				onSelectEmergency={onSelectKey}
				onSelectTime={onSelectTime}
			/>
			<View style={styles.stats}>
				<Stat
					label={t("records.detail.plays")}
					value={t("records.detail.times", { count: session.play_count })}
				/>
				<Stat
					label={t("records.detail.mimicry")}
					value={t("records.detail.times", { count: session.mimicry_count })}
				/>
				<Stat
					label={t("records.detail.emergency")}
					value={t("records.detail.cases", { count: session.emergency_count })}
					alert={session.emergency_count > 0}
				/>
			</View>
		</Card>
	)
}

function Stat({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
	return (
		<Copy style={styles.statLabel}>
			{label} <Copy style={[styles.statValue, alert && styles.alert]}>{value}</Copy>
		</Copy>
	)
}

const styles = StyleSheet.create({
	card: { padding: 16, gap: 12 },
	top: { flexDirection: "row", alignItems: "baseline", gap: 12 },
	word: { flex: 1, minWidth: 0, fontFamily: font.black, fontSize: 22, lineHeight: 28 },
	off: { color: colors.muted },
	duration: { fontFamily: font.black, fontSize: 16, color: colors.text },
	stats: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 4 },
	statLabel: { fontFamily: font.extraBold, fontSize: 13, color: colors.muted },
	statValue: {
		fontFamily: font.black,
		fontSize: 14,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
	alert: { color: colors.error },
})
