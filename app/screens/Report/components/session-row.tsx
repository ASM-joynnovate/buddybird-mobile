import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { PressableSurface } from "@/components/ui/surface"
import { Tag } from "@/components/ui/tag"
import { Copy } from "@/components/ui/text"
import { formatDateTime, formatDuration } from "@/i18n/format"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font } from "@/theme"
import type { ReportSession } from "@/types/apis/reports"
import { joinLabel } from "@/utils/a11y"

interface Props {
	session: ReportSession
	judging: boolean
	onPress(): void
}

export function SessionRow({ session, judging, onPress }: Props): ReactElement {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const startedAt = formatDateTime(session.started_at, locale)
	const duration = formatDuration(session.learning_duration_ms, locale)
	const word = session.word?.name ?? ""

	return (
		<PressableSurface
			depth={2}
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={joinLabel(
				word,
				startedAt,
				duration,
				judging && t("report.judging"),
			)}
			contentStyle={styles.row}
		>
			<View style={styles.text}>
				<Copy numberOfLines={1} style={styles.word}>
					{word}
				</Copy>
				<Copy style={styles.time}>{startedAt}</Copy>
				{judging ? <Tag label={t("report.judging")} /> : null}
			</View>
			<Copy style={styles.duration}>{duration}</Copy>
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
	text: { flex: 1, minWidth: 0, gap: 4 },
	word: { fontFamily: font.black, fontSize: 17 },
	time: { fontSize: 13, color: colors.muted },
	duration: { fontFamily: font.extraBold, fontSize: 15, fontVariant: ["tabular-nums"] },
})
