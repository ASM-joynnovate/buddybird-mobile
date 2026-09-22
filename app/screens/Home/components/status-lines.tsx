import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { phaseTone } from "@/components/session/phase-tone"
import { Icon } from "@/components/ui/icon"
import { PressableSurface } from "@/components/ui/surface"
import { Tag } from "@/components/ui/tag"
import { Copy } from "@/components/ui/text"
import type { RunningSessionDetail } from "@/hooks/use-running-session"
import { formatMoment, formatTimer } from "@/i18n/format"
import type { EmergencyBrief } from "@/mocks/types"
import { isDisconnected, phaseStatus, useNow } from "@/screens/Session/hooks/use-clock"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { colors, font } from "@/theme"

export function SessionLine({
	detail,
	onPress,
}: {
	detail: RunningSessionDetail
	onPress(): void
}) {
	const { t } = useTranslation()

	const now = useNow()

	const { session, station, sleep } = detail
	const status = phaseStatus(session.period.started_at, sleep, now)
	const lost = isDisconnected(session.progress.last_heartbeat_at, now)
	const device = station ? (station.name ?? station.model) : ""
	const word = session.settings.learning_enabled ? detail.wordName : t("session.run.learningOff")
	const phase = t(`common.phases.${status.phase}`)

	return (
		<PressableSurface
			depth={2}
			color={lost ? colors.error : undefined}
			onPress={onPress}
			accessibilityLabel={[
				t(lost ? "home.session.lost" : "home.session.running", { device }),
				phase,
				word,
			]
				.filter(Boolean)
				.join(", ")}
			contentStyle={styles.line}
		>
			{lost ? <Icon name="wifiOff" size={18} color={colors.error} /> : null}
			<Tag tone={phaseTone(status.phase)} label={phase} />
			<View style={styles.grow}>
				{word ? (
					<Copy numberOfLines={1} style={styles.word}>
						{word}
					</Copy>
				) : null}
				<Copy numberOfLines={1} style={[styles.device, lost && styles.lost]}>
					{lost ? t("home.session.lost", { device }) : device}
				</Copy>
			</View>
			<Copy style={styles.timer}>
				{formatTimer(now - Date.parse(session.period.started_at))}
			</Copy>
			<Icon name="forward" size={16} color={colors.disabled} />
		</PressableSurface>
	)
}

export function EmergencyLine({
	emergency,
	onPress,
}: {
	emergency: EmergencyBrief
	onPress(): void
}) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const label = t("home.emergency", {
		time: formatMoment(emergency.detected_at, locale),
		kind: t(`common.emergencyKinds.${emergency.kind}`),
	})

	return (
		<PressableSurface
			tone="danger"
			depth={2}
			onPress={onPress}
			accessibilityLabel={label}
			contentStyle={styles.line}
		>
			<Icon name="warning" size={18} color={colors.onAccent} />
			<Copy numberOfLines={1} style={[styles.grow, styles.alert]}>
				{label}
			</Copy>
			<Icon name="forward" size={16} color={colors.onAccent} />
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	line: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		minHeight: 48,
		paddingHorizontal: 14,
		paddingVertical: 6,
	},
	grow: { flex: 1, minWidth: 0 },
	word: { fontFamily: font.black, fontSize: 15, color: colors.text },
	device: { fontSize: 12, color: colors.muted },
	lost: { color: colors.error },
	timer: {
		fontFamily: font.black,
		fontSize: 15,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
	alert: { fontFamily: font.extraBold, fontSize: 14, color: colors.onAccent },
})
