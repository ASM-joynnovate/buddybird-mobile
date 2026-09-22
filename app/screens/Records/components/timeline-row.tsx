import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Icon, type IconName } from "@/components/ui/icon"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import type { EmergencyBrief, TimelineEvent } from "@/mocks/types"
import { colors, font, radius } from "@/theme"

const eventIcons: Record<TimelineEvent["kind"], IconName> = {
	session_started: "play",
	learning_started: "learn",
	learning_toggled: "learn",
	learning_finished: "learn",
	word_changed: "words",
	sleep_started: "moon",
	sleep_finished: "sun",
	station_disconnected: "wifiOff",
	station_reconnected: "wifi",
	emergency_detected: "warning",
	session_finished: "stop",
}

function eventName(event: TimelineEvent, t: TFunction): string {
	if (event.kind === "learning_toggled") {
		return t(
			event.learning_enabled
				? "records.detail.events.learningOn"
				: "records.detail.events.learningOff",
		)
	}

	return t(`records.detail.events.${event.kind}`)
}

export function EventRow({
	event,
	timeLabel,
	endedByServer,
	highlighted,
}: {
	event: TimelineEvent
	timeLabel: string
	endedByServer: boolean
	highlighted: boolean
}) {
	const { t } = useTranslation()
	const showServer = endedByServer && event.kind === "session_finished"

	return (
		<View style={[styles.row, highlighted && styles.highlighted]} accessible>
			<Copy style={styles.time}>{timeLabel}</Copy>
			<Icon name={eventIcons[event.kind]} size={18} color={colors.muted} />
			<View style={styles.name}>
				<Copy style={styles.nameText}>{eventName(event, t)}</Copy>
				{event.word ? <Copy style={styles.word}>{event.word.name}</Copy> : null}
				{showServer ? (
					<View style={styles.tag}>
						<Copy style={styles.tagText}>{t("records.detail.serverEnded")}</Copy>
					</View>
				) : null}
			</View>
		</View>
	)
}

export function EmergencyRow({
	emergency,
	timeLabel,
	highlighted,
	onPress,
}: {
	emergency: EmergencyBrief
	timeLabel: string
	highlighted: boolean
	onPress(): void
}) {
	const { t } = useTranslation()
	const kind = t(`common.emergencyKinds.${emergency.kind}`)

	return (
		<PressableSurface
			depth={highlighted ? 4 : 2}
			color={colors.error}
			cornerRadius={radius.control}
			accessibilityRole="button"
			accessibilityLabel={`${timeLabel}, ${t("records.detail.events.emergency_detected")}, ${kind}`}
			accessibilityHint={t("records.detail.openEmergency")}
			onPress={onPress}
			contentStyle={[styles.row, styles.alarm]}
		>
			<Copy style={styles.time}>{timeLabel}</Copy>
			<Icon name="warning" size={18} color={colors.error} />
			<View style={styles.name}>
				<Copy style={[styles.nameText, styles.alarmText]}>{kind}</Copy>
			</View>
			<Icon name="forward" size={18} color={colors.error} />
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		minHeight: 52,
		paddingVertical: 8,
		paddingHorizontal: 4,
		borderRadius: radius.control,
		borderWidth: 2,
		borderColor: colors.background,
	},
	highlighted: {
		backgroundColor: colors.orangeSelected,
		borderColor: colors.orange,
		paddingHorizontal: 10,
	},
	alarm: { paddingHorizontal: 10, borderColor: colors.error },
	time: {
		minWidth: 72,
		fontFamily: font.extraBold,
		fontSize: 14,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
	name: {
		flex: 1,
		minWidth: 0,
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		columnGap: 8,
		rowGap: 4,
	},
	nameText: { fontFamily: font.extraBold, fontSize: 14, color: colors.text },
	alarmText: { color: colors.error },
	word: { fontFamily: font.extraBold, fontSize: 14, color: colors.orangeDark },
	tag: {
		backgroundColor: colors.surface,
		borderColor: colors.border,
		borderWidth: 2,
		borderRadius: radius.pill,
		paddingHorizontal: 8,
		paddingVertical: 1,
	},
	tagText: { fontFamily: font.extraBold, fontSize: 12, color: colors.muted },
})
