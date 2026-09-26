import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { AbsenceStrip } from "@/components/session/absence-strip"
import { Stat } from "@/components/ui/stat"
import { Card } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { formatDuration } from "@/i18n/format"
import type { SessionRecord, SessionTimeline } from "@/mocks/types"
import { useAccountStore } from "@/stores/account"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font } from "@/theme"

interface Props {
	record: SessionRecord
	timeline: { data: SessionTimeline; end: number; running: boolean }
	selection: { cursor: number | null; selectKey(key: string): void; selectTime(at: number): void }
}

export function SessionOverview({ record, timeline, selection }: Props) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)
	const isAnonymous = useAccountStore((account) => account.isAnonymous)

	const start = Date.parse(record.session.period.started_at)

	return (
		<Card contentStyle={styles.card}>
			<View style={styles.top}>
				<Copy numberOfLines={1} style={styles.word}>
					{record.wordName}
				</Copy>
				<Copy style={styles.duration}>{formatDuration(timeline.end - start, locale)}</Copy>
			</View>
			<AbsenceStrip
				start={start}
				end={Math.max(timeline.end, start + 1)}
				running={timeline.running}
				sleep={{ sleepAt: record.sleep.sleep_at, wakeAt: record.sleep.wake_at }}
				activity={timeline.data.activity.map((point) => ({
					at: Date.parse(point.at),
					level: point.level,
				}))}
				sounds={timeline.data.sounds.map((sound) => ({
					id: sound.id,
					at: Date.parse(sound.captured_at),
					mimicked: Boolean(sound.judgment?.word_id),
				}))}
				cursor={selection.cursor}
				onSelectSound={selection.selectKey}
				onSelectTime={selection.selectTime}
			/>
			<View style={styles.stats}>
				<Stat
					label={t("report.detail.plays")}
					value={t("report.detail.times", { count: record.playCount })}
				/>
				{isAnonymous ? null : (
					<Stat
						label={t("report.detail.mimicry")}
						value={t("report.detail.times", { count: record.mimicryCount })}
					/>
				)}
			</View>
		</Card>
	)
}

const styles = StyleSheet.create({
	card: { padding: 16, gap: 12 },
	top: { flexDirection: "row", alignItems: "baseline", gap: 12 },
	word: { flex: 1, minWidth: 0, fontFamily: font.black, fontSize: 22, lineHeight: 28 },
	duration: { fontFamily: font.black, fontSize: 16, color: colors.text },
	stats: { flexDirection: "row", flexWrap: "wrap", columnGap: 14, rowGap: 4 },
})
