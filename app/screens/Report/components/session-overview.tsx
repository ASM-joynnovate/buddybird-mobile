import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { AbsenceStrip } from "@/components/session/absence-strip"
import { Card } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { formatDuration } from "@/i18n/format"
import type { SessionRecord, SessionTimeline } from "@/mocks/types"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font } from "@/theme"

interface Props {
	record: SessionRecord
	timeline: SessionTimeline
	end: number
	running: boolean
	cursor: number | null
	showsMimicry: boolean
	onSelectKey(key: string): void
	onSelectTime(at: number): void
}

export function SessionOverview({
	record,
	timeline,
	end,
	running,
	cursor,
	showsMimicry,
	onSelectKey,
	onSelectTime,
}: Props) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const start = Date.parse(record.session.period.started_at)

	return (
		<Card contentStyle={styles.card}>
			<View style={styles.top}>
				<Copy numberOfLines={1} style={styles.word}>
					{record.wordName}
				</Copy>
				<Copy style={styles.duration}>{formatDuration(end - start, locale)}</Copy>
			</View>
			<AbsenceStrip
				start={start}
				end={Math.max(end, start + 1)}
				running={running}
				sleep={{ sleepAt: record.sleep.sleep_at, wakeAt: record.sleep.wake_at }}
				activity={timeline.activity.map((point) => ({
					at: Date.parse(point.at),
					level: point.level,
				}))}
				sounds={timeline.sounds.map((sound) => ({
					id: sound.id,
					at: Date.parse(sound.captured_at),
					mimicked: Boolean(sound.judgment?.word_id),
				}))}
				cursor={cursor}
				onSelectSound={onSelectKey}
				onSelectTime={onSelectTime}
			/>
			<View style={styles.stats}>
				<Stat
					label={t("report.detail.plays")}
					value={t("report.detail.times", { count: record.playCount })}
				/>
				{showsMimicry ? (
					<Stat
						label={t("report.detail.mimicry")}
						value={t("report.detail.times", { count: record.mimicryCount })}
					/>
				) : null}
			</View>
		</Card>
	)
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<Copy style={styles.statLabel}>
			{label} <Copy style={styles.statValue}>{value}</Copy>
		</Copy>
	)
}

const styles = StyleSheet.create({
	card: { padding: 16, gap: 12 },
	top: { flexDirection: "row", alignItems: "baseline", gap: 12 },
	word: { flex: 1, minWidth: 0, fontFamily: font.black, fontSize: 22, lineHeight: 28 },
	duration: { fontFamily: font.black, fontSize: 16, color: colors.text },
	stats: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 4 },
	statLabel: { fontFamily: font.extraBold, fontSize: 13, color: colors.muted },
	statValue: {
		fontFamily: font.black,
		fontSize: 14,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
})
