import { useNetInfo } from "@react-native-community/netinfo"
import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useKeepAwake } from "expo-keep-awake"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { BackHandler, StyleSheet, useWindowDimensions, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { finishSessionMutationOptions } from "@/hooks/apis/sessions"
import { useIdempotentMutation } from "@/hooks/apis/use-idempotent-mutation"
import { usePermission } from "@/hooks/use-permission"
import { type RunningSessionDetail, useRunningSession } from "@/hooks/use-running-session"
import { formatTimer } from "@/i18n/format"
import { HorizonRing } from "@/screens/Session/components/horizon-ring"
import { RunStatus } from "@/screens/Session/components/run-status"
import { phaseStatus, remainingText, useNow } from "@/screens/Session/hooks/use-clock"
import { useHeartbeat } from "@/screens/Session/hooks/use-heartbeat"
import { useIdleReveal } from "@/screens/Session/hooks/use-idle-reveal"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { font, radius } from "@/theme"
import { night } from "@/theme/night"
import type { RootStackParamList } from "@/types/navigation"

const RING_MAX = 460

export function SessionRunScreen() {
	useKeepAwake()

	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const { params } = useRoute<RouteProp<RootStackParamList, "SessionRun">>()
	const { sessionId } = params

	const running = useRunningSession()

	const finishing = useIdempotentMutation(finishSessionMutationOptions())

	const microphone = usePermission("microphone")
	const camera = usePermission("camera")

	const network = useNetInfo()

	const idle = useIdleReveal()

	const [ending, setEnding] = useState(false)

	const detail = running.detail?.session.id === sessionId ? running.detail : null

	const showSummary = useCallback(
		() => navigation.replace("SessionSummary", { sessionId, role: "station" }),
		[navigation, sessionId],
	)

	useHeartbeat({
		sessionId,
		appliedVersion: detail?.session.settings.version ?? 1,
		startedAt: detail?.session.period.started_at ?? null,
		sleep: detail?.sleep ?? null,
		onEnded: showSummary,
	})

	useEffect(() => {
		const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
			setEnding(true)

			return true
		})

		return () => subscription.remove()
	}, [])

	function finish() {
		finishing.mutate({ id: sessionId }, { onSuccess: showSummary })
	}

	return (
		<PressableSurface
			tone="plain"
			depth={0}
			cornerRadius={0}
			backgroundColor={night.background}
			style={styles.screen}
			contentStyle={styles.fill}
			onPress={idle.reveal}
			accessibilityLabel={t("session.run.reveal")}
		>
			{idle.visible && detail ? (
				<RunInfo
					detail={detail}
					online={network.isConnected}
					microphone={microphone.granted}
					camera={camera.granted}
					onEnd={() => setEnding(true)}
				/>
			) : null}
			<ConfirmDialog
				visible={ending}
				title={t("session.end.title")}
				confirmLabel={t("session.end.confirm")}
				cancelLabel={t("session.end.keep")}
				busy={finishing.isPending}
				error={finishing.isError ? t("session.end.error") : null}
				onConfirm={finish}
				onClose={() => {
					finishing.reset()

					setEnding(false)
				}}
			/>
		</PressableSurface>
	)
}

interface Props {
	detail: RunningSessionDetail
	online: boolean | null
	microphone: boolean | null
	camera: boolean | null
	onEnd(): void
}

function RunInfo({ detail, online, microphone, camera, onEnd }: Props) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const { width } = useWindowDimensions()

	const now = useNow()

	const { session, sleep } = detail
	const status = phaseStatus(session.period.started_at, sleep, now)
	const word = session.settings.learning_enabled
		? (detail.wordName ?? t("session.run.noWord"))
		: t("session.run.learningOff")

	return (
		<SafeAreaView style={styles.info} edges={["top", "bottom", "left", "right"]}>
			<View style={styles.top}>
				<View style={styles.stack}>
					<Copy style={styles.label}>{t("session.run.word")}</Copy>
					<Copy style={styles.word} numberOfLines={1}>
						{word}
					</Copy>
					<Copy style={[styles.label, styles.gap]}>{t("session.run.elapsed")}</Copy>
					<Copy style={styles.timer}>
						{formatTimer(now - Date.parse(session.period.started_at))}
					</Copy>
				</View>
				<RunStatus online={online} microphone={microphone} camera={camera} />
			</View>
			<View style={styles.bottom} pointerEvents="box-none">
				<HorizonRing
					width={Math.min(width * 0.55, RING_MAX)}
					phase={status.phase}
					fraction={status.fraction}
					title={t(`common.phases.${status.phase}`)}
					detail={remainingText(status, sleep.wake_at, t, locale)}
				/>
				<PressableSurface
					depth={2}
					cornerRadius={radius.control}
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
	screen: { flex: 1, backgroundColor: night.background },
	fill: { flex: 1, borderWidth: 0 },
	info: { flex: 1, justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 12 },
	top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
	stack: { gap: 2, flexShrink: 1 },
	label: { fontFamily: font.extraBold, fontSize: 13, color: night.faint },
	gap: { marginTop: 12 },
	word: { fontFamily: font.black, fontSize: 36, lineHeight: 42, color: night.text },
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
