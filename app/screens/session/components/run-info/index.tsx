import { useTranslation } from "react-i18next"
import { StyleSheet, useWindowDimensions, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { formatTimer } from "@/i18n/format"
import { HorizonRing } from "@/screens/session/components/run-info/horizon-ring"
import { useNow } from "@/screens/session/hooks/use-now"
import { font } from "@/theme"
import { night } from "@/theme/night"
import type { SleepSettings } from "@/types/sleep-settings"
import { runStatus } from "@/utils/phases"

const RING_MAX = 460

interface Props {
	startedAt: string
	endsAt: number | null
	sleep: SleepSettings
	engineFailed: boolean
	onEnd(): void
}

export function RunInfo({ startedAt, endsAt, sleep, engineFailed, onEnd }: Props) {
	const { t } = useTranslation()

	const { width } = useWindowDimensions()

	const now = useNow()

	const status = runStatus(startedAt, endsAt, sleep, now)

	return (
		<SafeAreaView style={styles.info} edges={["top", "bottom", "left", "right"]}>
			<View style={styles.stack}>
				<Copy style={styles.label}>{t("session.run.elapsed")}</Copy>
				<Copy style={styles.timer}>{formatTimer(now - Date.parse(startedAt))}</Copy>
				<Copy style={[styles.label, styles.gap]}>{t("session.run.keepOpen")}</Copy>
				{engineFailed ? (
					<Copy style={styles.label}>{t("session.run.engineError")}</Copy>
				) : null}
			</View>
			<View style={styles.bottom} pointerEvents="box-none">
				<HorizonRing
					width={Math.min(width * 0.55, RING_MAX)}
					phase={status.phase}
					fraction={status.fraction}
					title={t(`common.phases.${status.phase}`)}
					detail={
						status.remainingMs === null
							? null
							: t("session.remaining", { left: formatTimer(status.remainingMs) })
					}
				/>
				<PressableSurface
					depth="low"
					cornerRadius="control"
					color={night.edge}
					backgroundColor={night.background}
					style={styles.end}
					contentStyle={styles.endFace}
					accessibilityLabel={t("session.end.title")}
					onPress={onEnd}
				>
					<Copy style={styles.endText}>{t("session.end.button")}</Copy>
				</PressableSurface>
			</View>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	info: { flex: 1, justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 12 },
	stack: { gap: 2 },
	label: { fontFamily: font.extraBold, fontSize: 13, color: night.faint },
	gap: { marginTop: 12 },
	timer: {
		fontFamily: font.black,
		fontSize: 22,
		color: night.text,
		fontVariant: ["tabular-nums"],
	},
	bottom: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center" },
	end: { position: "absolute", right: 0, bottom: 16 },
	endFace: { minHeight: 44, justifyContent: "center", paddingHorizontal: 18 },
	endText: { fontFamily: font.extraBold, fontSize: 15, color: night.text },
})
