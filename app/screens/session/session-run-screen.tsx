import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useKeepAwake } from "expo-keep-awake"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { BackHandler, StyleSheet } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"

import { ConfirmDialog } from "@/components/dialogs/confirm-dialog"
import { PressableSurface } from "@/components/ui/surface"
import { RunInfo } from "@/screens/session/components/run-info"
import { useIdleReveal } from "@/screens/session/hooks/use-idle-reveal"
import { useLearningSession } from "@/screens/session/hooks/use-learning-session"
import { night } from "@/theme/night"
import type { RootStackParamList } from "@/types/navigation"
import { SECOND } from "@/utils/units"

const FADE_MS = 2 * SECOND

export function SessionRunScreen() {
	useKeepAwake()

	const { t } = useTranslation()

	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	const { params } = useRoute<RouteProp<RootStackParamList, "SessionRun">>()

	const { sessionId, endsAt, sleep } = params

	const showSummary = useCallback(
		() => navigation.replace("SessionSummary", { sessionId }),
		[navigation, sessionId],
	)

	const learning = useLearningSession(params, showSummary)

	const idle = useIdleReveal()

	const opacity = useSharedValue(1)
	const fade = useAnimatedStyle(() => ({ opacity: opacity.get() }))

	const [endDialogOpen, setEndDialogOpen] = useState(false)

	useEffect(() => {
		opacity.set(idle.visible ? 1 : withTiming(0, { duration: FADE_MS }))
	}, [idle.visible, opacity])

	useEffect(() => {
		const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
			setEndDialogOpen(true)

			return true
		})

		return () => subscription.remove()
	}, [])

	return (
		<PressableSurface
			tone="plain"
			depth="none"
			cornerRadius="none"
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
				{learning.startedAt ? (
					<RunInfo
						startedAt={learning.startedAt}
						endsAt={endsAt}
						sleep={sleep}
						engineFailed={learning.engineFailed}
						onEnd={() => setEndDialogOpen(true)}
					/>
				) : null}
			</Animated.View>
			<ConfirmDialog
				visible={endDialogOpen}
				text={{
					title: t("session.end.title"),
					confirm: t("session.end.confirm"),
					cancel: t("session.end.keep"),
				}}
				state={{ busy: learning.ending }}
				onConfirm={learning.end}
				onClose={() => setEndDialogOpen(false)}
			/>
		</PressableSurface>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: night.background },
	fill: { flex: 1, borderWidth: 0 },
})
