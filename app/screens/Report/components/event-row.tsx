import { useTranslation } from "react-i18next"
import { StyleSheet, View } from "react-native"

import { Icon, type IconName } from "@/components/ui/icon"
import { Copy } from "@/components/ui/text"
import type { TimelineEvent } from "@/mocks/types"
import { colors, font, radius } from "@/theme"

const eventIcons: Record<TimelineEvent["kind"], IconName> = {
	session_started: "play",
	learning_started: "learn",
	learning_finished: "learn",
	sleep_started: "moon",
	sleep_finished: "sun",
	station_disconnected: "wifiOff",
	station_reconnected: "wifi",
	session_finished: "stop",
}

interface Props {
	event: TimelineEvent
	timeLabel: string
	endedByServer: boolean
	highlighted: boolean
}

export function EventRow({ event, timeLabel, endedByServer, highlighted }: Props) {
	const { t } = useTranslation()

	const showServer = endedByServer && event.kind === "session_finished"

	return (
		<View style={[styles.row, highlighted && styles.highlighted]} accessible>
			<Copy style={styles.time}>{timeLabel}</Copy>
			<Icon name={eventIcons[event.kind]} size={18} color={colors.muted} />
			<View style={styles.name}>
				<Copy style={styles.nameText}>{t(`report.detail.events.${event.kind}`)}</Copy>
				{event.word ? <Copy style={styles.word}>{event.word.name}</Copy> : null}
				{showServer ? (
					<View style={styles.tag}>
						<Copy style={styles.tagText}>{t("report.detail.serverEnded")}</Copy>
					</View>
				) : null}
			</View>
		</View>
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
