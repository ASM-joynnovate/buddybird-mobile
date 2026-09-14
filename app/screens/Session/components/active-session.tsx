import { useEffect } from "react"
import Animated, {
	cancelAnimation,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated"

import { useTranslation } from "react-i18next"

import { ScrollView, StyleSheet, View } from "react-native"

import { SafeAreaView } from "react-native-safe-area-context"

import { SessionStatus } from "@/screens/Session/components/session-status"

import { SessionFailureNotice } from "@/components/session-failure"
import { Button } from "@/components/ui/button"
import { IconButton } from "@/components/ui/icon-button"
import { InlineError } from "@/components/ui/inline-error"
import { Copy } from "@/components/ui/text"
import { SessionRing } from "@/screens/Session/components/session-ring"
import { useSessionDetails } from "@/screens/Session/hooks/use-session-details"
import { sessionCountdown } from "@/services/session/countdown"
import { colors } from "@/theme"

export function ActiveSession({
	busy,
	commandError,
	onBack,
	onEnd,
	onRetry,
	onTogglePause,
}: {
	busy: boolean
	commandError: boolean
	onBack(): void
	onEnd(): void
	onRetry(): void
	onTogglePause(): void
}) {
	const { t } = useTranslation()
	const { session, snapshot, settings, word } = useSessionDetails()
	const { timer, cycleCount, progress, elapsedPercent, phaseDuration, remaining } =
		sessionCountdown(snapshot, settings)
	const paused = snapshot.state === "paused" || snapshot.state === "interrupted"
	const learning = snapshot.phase === "learning"
	const accent = learning ? colors.orange : colors.blue

	const progressValue = useSharedValue(0)
	const progressStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progressValue.get() }] }))

	useEffect(() => {
		progressValue.set(withTiming(elapsedPercent / 100, { duration: 500 }))

		return () => cancelAnimation(progressValue)
	}, [elapsedPercent, progressValue])

	return (
		<SafeAreaView style={styles.screen}>
			<ScrollView contentContainerStyle={styles.sessionContent}>
				<View style={styles.header}>
					<IconButton
						testID="session-back"
						icon="back"
						label={t("common.back")}
						disabled={busy}
						onPress={onBack}
					/>
					<View
						accessible
						accessibilityRole="progressbar"
						accessibilityLabel={t("session.progress")}
						accessibilityValue={{
							min: 0,
							max: 100,
							now: Math.round(Math.max(0, elapsedPercent)),
						}}
						style={styles.progressTrack}
					>
						<Animated.View
							style={[
								styles.progressFill,
								progressStyle,
								{
									backgroundColor: accent,
								},
							]}
						/>
					</View>
					<Button
						testID="session-end"
						label={t("session.end")}
						accessibilityLabel={t("session.endLabel")}
						compact
						variant="secondary"
						disabled={busy}
						onPress={onEnd}
					/>
				</View>

				<Copy style={styles.cycle}>
					{t("session.cycle", { cycle: snapshot.cycle, total: cycleCount })}
				</Copy>
				<SessionRing
					phase={snapshot.phase}
					cycle={snapshot.cycle}
					wordLabel={word?.label}
					timer={timer}
					progress={progress}
					running={snapshot.state === "running"}
					phaseDurationMs={phaseDuration}
					remainingMs={remaining}
				/>

				<SessionStatus snapshot={snapshot} />

				<SessionFailureNotice failure={session.error} onChooseWord={onEnd} />
				<InlineError
					message={commandError && !session.error ? t("session.unavailable") : null}
				/>
				{session.error && snapshot.state !== "failed" ? (
					<Button
						label={t("session.recovery")}
						variant="secondary"
						loading={busy}
						onPress={onRetry}
						style={styles.retry}
					/>
				) : null}

				{snapshot.state !== "failed" || session.error?.recoverable !== false ? (
					<Button
						testID={snapshot.state === "failed" ? "session-retry" : "session-pause"}
						label={t(
							snapshot.state === "starting"
								? "session.preparing"
								: snapshot.state === "failed"
									? "session.retry"
									: paused
										? "session.resume"
										: "session.pause",
						)}
						icon={paused || snapshot.state === "failed" ? "play" : "pause"}
						variant={learning ? "primary" : "blue"}
						loading={busy || snapshot.state === "stopping"}
						disabled={snapshot.state === "starting"}
						onPress={snapshot.state === "failed" ? onRetry : onTogglePause}
						style={styles.pause}
					/>
				) : null}
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: colors.background },
	sessionContent: { flexGrow: 1, padding: 22, width: "100%", maxWidth: 480, alignSelf: "center" },
	header: { flexDirection: "row", alignItems: "center", gap: 14 },
	progressTrack: {
		flex: 1,
		height: 14,
		backgroundColor: colors.border,
		borderRadius: 8,
		overflow: "hidden",
	},
	progressFill: { width: "100%", height: "100%", borderRadius: 8, transformOrigin: "left" },
	cycle: {
		alignSelf: "center",
		borderWidth: 2,
		borderColor: colors.border,
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 9,
		color: colors.muted,
		fontSize: 12,
		marginTop: 16,
	},
	pause: { marginTop: 22 },
	retry: { marginTop: 12 },
})
