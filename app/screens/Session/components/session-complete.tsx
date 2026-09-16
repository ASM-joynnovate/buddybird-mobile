import { useTranslation } from "react-i18next"

import { ScrollView, StyleSheet, View } from "react-native"

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"

import { useCaptureShortcut } from "@/screens/Session/hooks/use-capture-shortcut"
import { Mascot } from "@/components/mascot"
import { Card, PressableSurface } from "@/components/ui/surface"

import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { InlineError } from "@/components/ui/inline-error"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { durationText } from "@/i18n/duration"
import { useDeviceSetting } from "@/hooks/use-device-setting"
import { withSubjectParticle } from "@/i18n/particles"
import { Confetti } from "@/screens/Session/components/confetti"
import { useSessionDetails } from "@/screens/Session/hooks/use-session-details"
import { learningSeconds } from "@/services/session/history"
import { colors, font } from "@/theme"

export function SessionComplete({
	busy,
	onRetry,
	onContinue,
}: {
	busy: boolean
	onRetry(): void
	onContinue(): void
}) {
	const { t } = useTranslation()
	const locale = useDeviceSetting("locale")
	const insets = useSafeAreaInsets()
	const { profile, stats, session, snapshot, history, settings, word } = useSessionDetails()
	const openCaptures = useCaptureShortcut(snapshot.sessionId, word?.label ?? "")
	const learned =
		history?.totalLearningSeconds ??
		(settings ? learningSeconds(snapshot.elapsedRunningMs, settings) : 0)

	return (
		<SafeAreaView edges={["top"]} style={styles.complete}>
			<Confetti />
			<ScrollView contentContainerStyle={styles.completeScroll}>
				<View style={styles.completeContent}>
					<PressableSurface
						testID="session-capture-shortcut"
						tone="plain"
						depth={0}
						accessibilityLabel={t("common.mascot")}
						accessibilityHint={t("captures.shortcut")}
						onPress={openCaptures}
						contentStyle={styles.shortcut}
					>
						<Mascot size={140} motion="bounce" />
					</PressableSurface>
					<Copy
						accessibilityRole="header"
						testID="session-complete"
						style={styles.completeTitle}
					>
						{t("session.complete")}
					</Copy>
					<Copy style={styles.completeDescription}>
						{t("session.listened", {
							name:
								locale === "ko"
									? withSubjectParticle(profile?.name ?? "")
									: (profile?.name ?? ""),
							word: word?.label ?? "",
							duration: `${Math.max(1, Math.round(learned / 60))}${t("common.minutes")}`,
						})}
					</Copy>
				</View>

				<View style={[styles.completeFooter, { paddingBottom: insets.bottom + 22 }]}>
					<InlineError
						message={stats.incomplete ? t("storage.historyUnavailable") : null}
					/>
					<View style={ui.wrap}>
						<Card
							color={colors.orange}
							style={styles.cell}
							contentStyle={styles.completeStat}
						>
							<Copy style={styles.completeStatLabel}>{t("session.streak")}</Copy>
							<View style={[ui.row, styles.statValueRow]}>
								<Icon name="flame" color={colors.orange} />
								<Copy style={styles.completeStatValue}>{stats.streakDays}</Copy>
							</View>
						</Card>
						<Card
							color={colors.yellow}
							style={styles.cell}
							contentStyle={styles.completeStat}
						>
							<Copy style={[styles.completeStatLabel, { color: colors.yellowDark }]}>
								{t("session.total")}
							</Copy>
							<View style={[ui.row, styles.statValueRow]}>
								<Icon name="clock" color={colors.yellow} />
								<Copy style={styles.completeStatValue}>
									{durationText(stats.totalSeconds, locale)}
								</Copy>
							</View>
						</Card>
					</View>
					<InlineError message={session.error ? t("session.unavailable") : null} />
					{session.error ? (
						<Button
							label={t("session.recovery")}
							onPress={onRetry}
							loading={busy}
							variant="secondary"
							style={styles.retry}
						/>
					) : null}
					<Button
						testID="session-continue"
						label={t("common.continue")}
						disabled={Boolean(session.error)}
						onPress={onContinue}
						style={styles.continue}
					/>
				</View>
			</ScrollView>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	shortcut: { borderWidth: 0, flexGrow: 0 },
	retry: { marginTop: 12 },
	complete: { flex: 1, backgroundColor: colors.orange },
	completeScroll: { flexGrow: 1 },
	completeContent: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 22 },
	completeTitle: {
		fontFamily: font.black,
		fontSize: 34,
		lineHeight: 40,
		marginTop: 24,
		textAlign: "center",
		color: colors.onAccent,
	},
	completeDescription: {
		fontSize: 16,
		fontFamily: font.extraBold,
		textAlign: "center",
		color: colors.onAccent,
		marginTop: 6,
		lineHeight: 23,
	},
	completeFooter: {
		backgroundColor: colors.background,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		padding: 22,
		width: "100%",
		maxWidth: 480,
		alignSelf: "center",
	},
	cell: { flexGrow: 1, flexShrink: 1, flexBasis: 140, minWidth: 0 },
	completeStat: { alignItems: "center", gap: 4, minHeight: 102, justifyContent: "center" },
	completeStatLabel: { fontSize: 11, color: colors.orangeDark },
	statValueRow: { flexWrap: "wrap", justifyContent: "center", maxWidth: "100%" },
	completeStatValue: { fontSize: 24, fontFamily: font.black, flexShrink: 1, textAlign: "center" },
	continue: { marginTop: 20 },
})
