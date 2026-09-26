import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useKeepAwake } from "expo-keep-awake"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { BackHandler, StyleSheet, useWindowDimensions, View } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { SafeAreaView } from "react-native-safe-area-context"

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { PressableSurface } from "@/components/ui/surface"
import { Copy } from "@/components/ui/text"
import { formatTimer } from "@/i18n/format"
import { HorizonRing } from "@/screens/Session/components/horizon-ring"
import { phaseStatus, remainingText, useNow } from "@/screens/Session/hooks/use-clock"
import { useIdleReveal } from "@/screens/Session/hooks/use-idle-reveal"
import { useLearningSession } from "@/screens/Session/hooks/use-learning-session"
import { useDeviceSettingsStore } from "@/stores/device-settings"
import { font, radius } from "@/theme"
import { night } from "@/theme/night"
import type { RootStackParamList, SessionSleep } from "@/types/navigation"
import { SECOND } from "@/utils/units"

const RING_MAX = 460
const FADE_MS = 2 * SECOND

export function SessionRunScreen() {
	useKeepAwake()

	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const { params } = useRoute<RouteProp<RootStackParamList, "SessionRun">>()
	const { sessionId, sleep } = params

	const showSummary = useCallback(
		(learningMs: number) => navigation.replace("SessionSummary", { sessionId, learningMs }),
		[navigation, sessionId],
	)

	const learning = useLearningSession(params, showSummary)

	const idle = useIdleReveal()

	const opacity = useSharedValue(1)
	const fade = useAnimatedStyle(() => ({ opacity: opacity.get() }))

	const [ending, setEnding] = useState(false)

	const startedAt = learning.startedAt

	useEffect(() => {
		opacity.set(withTiming(idle.visible ? 1 : 0, { duration: FADE_MS }))
	}, [idle.visible, opacity])

	useEffect(() => {
		const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
			setEnding(true)

			return true
		})

		return () => subscription.remove()
	}, [])

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
			<Animated.View
				style={[styles.fill, fade]}
				pointerEvents={idle.visible ? "box-none" : "none"}
			>
				{startedAt ? (
					<RunInfo
						startedAt={startedAt}
						sleep={sleep}
						failed={learning.failed}
						onEnd={() => setEnding(true)}
					/>
				) : null}
			</Animated.View>
			<ConfirmDialog
				visible={ending}
				title={t("session.end.title")}
				confirmLabel={t("session.end.confirm")}
				cancelLabel={t("session.end.keep")}
				busy={learning.ending}
				error={learning.endFailed ? t("session.end.error") : null}
				onConfirm={learning.end}
				onClose={() => setEnding(false)}
			/>
		</PressableSurface>
	)
}

interface Props {
	startedAt: string
	sleep: SessionSleep
	failed: boolean
	onEnd(): void
}

function RunInfo({ startedAt, sleep, failed, onEnd }: Props) {
	const { t } = useTranslation()

	const locale = useDeviceSettingsStore((state) => state.locale)

	const { width } = useWindowDimensions()

	const now = useNow()

	const status = phaseStatus(startedAt, sleep, now)

	return (
		<SafeAreaView style={styles.info} edges={["top", "bottom", "left", "right"]}>
			<View style={styles.stack}>
				<Copy style={styles.label}>{t("session.run.elapsed")}</Copy>
				<Copy style={styles.timer}>{formatTimer(now - Date.parse(startedAt))}</Copy>
				<Copy style={[styles.label, styles.gap]}>{t("session.run.keepOpen")}</Copy>
				{failed ? <Copy style={styles.label}>{t("session.run.engineError")}</Copy> : null}
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
