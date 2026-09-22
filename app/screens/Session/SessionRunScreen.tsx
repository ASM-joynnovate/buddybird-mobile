import { useNetInfo } from "@react-native-community/netinfo"
import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useMutation, useQuery } from "@tanstack/react-query"
import { randomUUID } from "expo-crypto"
import { useKeepAwake } from "expo-keep-awake"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { BackHandler, StyleSheet, useWindowDimensions, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import type { RunningSession } from "@/apis/sessions"
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { finishSessionMutationOptions, runningSessionQueryOptions } from "@/hooks/apis/sessions"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { usePermission } from "@/hooks/use-permission"
import { formatTimer } from "@/i18n/format"
import { HorizonRing } from "@/screens/Session/components/horizon-ring"
import { night } from "@/screens/Session/components/night"
import { RunStatus } from "@/screens/Session/components/run-status"
import { phaseStatus, remainingText, useNow } from "@/screens/Session/hooks/use-clock"
import { useHeartbeat, useIdleReveal } from "@/screens/Session/hooks/use-station"
import { font, radius } from "@/theme"
import type { RootStackParamList } from "@/types/navigation"

const RING_MAX = 460

export function SessionRunScreen() {
	useKeepAwake()

	const { t } = useTranslation()
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const { params } = useRoute<RouteProp<RootStackParamList, "SessionRun">>()
	const { sessionId } = params
	const running = useQuery(runningSessionQueryOptions())
	const session = running.data?.id === sessionId ? running.data : null
	const microphone = usePermission("microphone")
	const camera = usePermission("camera")
	const network = useNetInfo()
	const idle = useIdleReveal()
	const [ending, setEnding] = useState(false)
	const finishing = useMutation(finishSessionMutationOptions())

	const showSummary = useCallback(
		() => navigation.replace("SessionSummary", { sessionId, role: "station" }),
		[navigation, sessionId],
	)

	useHeartbeat({
		sessionId,
		appliedVersion: session?.settings_version ?? 1,
		cameraAvailable: camera.granted === true,
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
		finishing.mutate(
			{ id: sessionId, idempotencyKey: randomUUID() },
			{ onSuccess: showSummary },
		)
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
			{idle.visible && session ? (
				<RunInfo
					session={session}
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

function RunInfo({
	session,
	online,
	microphone,
	camera,
	onEnd,
}: {
	session: RunningSession
	online: boolean | null
	microphone: boolean | null
	camera: boolean | null
	onEnd(): void
}) {
	const { t } = useTranslation()
	const locale = useDeviceSetting("locale")
	const { width } = useWindowDimensions()
	const now = useNow()
	const status = phaseStatus(session, now)
	const word = session.learning_enabled
		? (session.word?.name ?? t("session.run.noWord"))
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
						{formatTimer(now - Date.parse(session.started_at))}
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
					detail={remainingText(status, session.wake_at, t, locale)}
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
