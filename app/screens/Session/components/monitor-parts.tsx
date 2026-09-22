import { useTranslation } from "react-i18next"
import { ActivityIndicator, StyleSheet, View } from "react-native"

import { phaseTone } from "@/components/session/phase-tone"
import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { IconButton } from "@/components/ui/icon-button"
import { Card } from "@/components/ui/surface"
import { Tag } from "@/components/ui/tag"
import { Copy, Title } from "@/components/ui/text"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import type { RunningSessionDetail } from "@/hooks/use-running-session"
import { formatTimer } from "@/i18n/format"
import type { StationStatus } from "@/mocks/types"
import { phaseStatus, remainingText, useNow } from "@/screens/Session/hooks/use-clock"
import { colors, font, radius } from "@/theme"

export function BatteryState({ status }: { status: StationStatus }) {
	const { t } = useTranslation()

	if (status.battery_level === null && status.is_charging === null) {
		return null
	}

	const percent = status.battery_level === null ? null : Math.round(status.battery_level * 100)

	return (
		<View
			style={styles.battery}
			accessible
			accessibilityLabel={t(
				status.is_charging ? "session.monitor.charging" : "session.monitor.battery",
				{ percent: percent ?? "-" },
			)}
		>
			<Icon
				name={status.is_charging ? "charging" : "battery"}
				size={22}
				color={colors.muted}
			/>
			{percent === null ? null : <Copy style={styles.batteryText}>{`${percent}%`}</Copy>}
		</View>
	)
}

export function WarningBanner({ message }: { message: string }) {
	return (
		<View style={styles.banner} accessibilityRole="alert">
			<Icon name="warning" size={20} color={colors.onAccent} />
			<Copy style={styles.bannerText}>{message}</Copy>
		</View>
	)
}

export function LiveArea({
	requested,
	cameraAvailable,
	disabled,
	onPlay,
	onFullscreen,
}: {
	requested: boolean
	cameraAvailable: boolean
	disabled: boolean
	onPlay(): void
	onFullscreen(): void
}) {
	const { t } = useTranslation()
	let center = (
		<IconButton
			icon="play"
			label={t("session.monitor.playLive")}
			tone="primary"
			round
			size={64}
			iconSize={28}
			color={colors.onAccent}
			disabled={disabled}
			onPress={onPlay}
		/>
	)

	if (!cameraAvailable) {
		center = <Copy style={styles.liveText}>{t("session.monitor.cameraOff")}</Copy>
	} else if (requested) {
		center = <Copy style={styles.liveText}>{t("session.live.notReady")}</Copy>
	}

	return (
		<View style={styles.live}>
			<Copy style={styles.still}>{t("session.monitor.still")}</Copy>
			{center}
			<View style={styles.fullscreen}>
				<IconButton
					icon="expand"
					label={t("session.monitor.fullscreen")}
					color={colors.onAccent}
					disabled={disabled || !cameraAvailable}
					onPress={onFullscreen}
				/>
			</View>
		</View>
	)
}

export function StatusCard({
	detail,
	applyingWord,
	disabled,
	onChangeWord,
}: {
	detail: RunningSessionDetail
	applyingWord: boolean
	disabled: boolean
	onChangeWord(): void
}) {
	const { t } = useTranslation()
	const locale = useDeviceSetting("locale")
	const now = useNow()
	const { session, sleep } = detail
	const status = phaseStatus(session.period.started_at, sleep, now)
	const word = session.settings.learning_enabled
		? (detail.wordName ?? t("session.run.noWord"))
		: t("session.run.learningOff")

	return (
		<Card contentStyle={styles.card}>
			<View style={styles.row}>
				<Tag tone={phaseTone(status.phase)} label={t(`common.phases.${status.phase}`)} />
				<Copy style={styles.timer}>{remainingText(status, sleep.wake_at, t, locale)}</Copy>
			</View>
			<View style={styles.row}>
				<Title style={styles.word}>{word}</Title>
				{applyingWord ? <ActivityIndicator color={colors.orange} /> : null}
				<Button
					label={t("session.monitor.changeWord")}
					variant="secondary"
					compact
					disabled={disabled}
					onPress={onChangeWord}
				/>
			</View>
			<Copy style={styles.elapsed}>
				{t("session.monitor.elapsed", {
					time: formatTimer(now - Date.parse(session.period.started_at)),
				})}
			</Copy>
		</Card>
	)
}

const styles = StyleSheet.create({
	battery: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 4 },
	batteryText: { fontFamily: font.extraBold, fontSize: 14, color: colors.muted },
	banner: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		paddingHorizontal: 14,
		paddingVertical: 10,
		borderRadius: radius.control,
		backgroundColor: colors.error,
	},
	bannerText: { flex: 1, fontFamily: font.extraBold, fontSize: 14, color: colors.onAccent },
	live: {
		width: "100%",
		aspectRatio: 16 / 9,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 24,
		backgroundColor: colors.text,
	},
	still: {
		position: "absolute",
		top: 10,
		left: 14,
		fontFamily: font.extraBold,
		fontSize: 12,
		color: colors.disabled,
	},
	liveText: {
		fontFamily: font.extraBold,
		fontSize: 15,
		color: colors.onAccent,
		textAlign: "center",
	},
	fullscreen: { position: "absolute", right: 4, bottom: 4 },
	card: { gap: 12 },
	row: { flexDirection: "row", alignItems: "center", gap: 10 },
	timer: {
		flex: 1,
		fontFamily: font.black,
		fontSize: 18,
		color: colors.text,
		fontVariant: ["tabular-nums"],
	},
	word: { flex: 1, minWidth: 0, fontSize: 26, lineHeight: 32 },
	elapsed: { fontSize: 13, color: colors.muted, fontVariant: ["tabular-nums"] },
})
