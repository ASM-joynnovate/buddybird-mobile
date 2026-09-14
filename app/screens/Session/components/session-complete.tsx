import { useTranslation } from "react-i18next"

import { Image, ScrollView, StyleSheet, View } from "react-native"

import { SafeAreaView } from "react-native-safe-area-context"

import { useCaptureShortcut } from "@/screens/Session/hooks/use-capture-shortcut"
import { Card, PressableSurface } from "@/components/ui/surface"

import { Button } from "@/components/ui/button"
import { Icon } from "@/components/ui/icon"
import { InlineError } from "@/components/ui/inline-error"
import { ui } from "@/components/ui/styles"
import { Copy } from "@/components/ui/text"
import { durationText } from "@/i18n/duration"
import { withSubjectParticle } from "@/i18n/particles"
import { Confetti } from "@/screens/Session/components/confetti"
import { useSessionDetails } from "@/screens/Session/hooks/use-session-details"
import { profileStats } from "@/services/profile/statistics"
import { learningSeconds } from "@/services/session/history"
import { colors, font, mascot, radius } from "@/theme"

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
	const { data, session, snapshot, history, settings, word } = useSessionDetails()
	const stats = profileStats(data)
	const openCaptures = useCaptureShortcut(snapshot.sessionId, word?.label ?? "")
	const learned =
		history?.totalLearningSeconds ??
		(settings ? learningSeconds(snapshot.elapsedRunningMs, settings) : 0)

	return (
		<SafeAreaView style={styles.complete}>
			<Confetti />
			<ScrollView contentContainerStyle={styles.completeScroll}>
				<View style={styles.completeContent}>
					<PressableSurface
						testID="session-capture-shortcut"
						tone="plain"
						depth={0}
						accessibilityLabel="Buddy"
						accessibilityHint={t("captures.shortcut")}
						onPress={openCaptures}
						contentStyle={styles.shortcut}
					>
						<Image accessible={false} source={mascot} style={styles.completeMascot} />
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
								data.settings.locale === "ko"
									? withSubjectParticle(data.profile?.name ?? "")
									: (data.profile?.name ?? ""),
							word: word?.label ?? "",
							duration: durationText(learned, data.settings.locale),
						})}
					</Copy>
				</View>

				<View style={styles.completeFooter}>
					<View style={ui.row}>
						<Card style={styles.cell} contentStyle={styles.completeStat}>
							<Copy style={styles.completeStatLabel}>{t("session.streak")}</Copy>
							<View style={[ui.row, styles.statValueRow]}>
								<Icon name="flame" color={colors.orange} />
								<Copy style={styles.completeStatValue}>{stats.streakDays}</Copy>
							</View>
						</Card>
						<Card style={styles.cell} contentStyle={styles.completeStat}>
							<Copy style={styles.completeStatLabel}>{t("session.total")}</Copy>
							<View style={[ui.row, styles.statValueRow]}>
								<Icon name="clock" color={colors.orange} />
								<Copy style={styles.completeStatValue}>
									{durationText(stats.totalSeconds, data.settings.locale)}
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
	completeMascot: { width: 160, height: 180, resizeMode: "contain", marginBottom: 22 },
	completeTitle: {
		fontFamily: font.black,
		fontSize: 38,
		textAlign: "center",
		color: colors.onAccent,
	},
	completeDescription: {
		fontSize: 20,
		textAlign: "center",
		color: colors.onAccent,
		marginTop: 15,
		lineHeight: 27,
	},
	completeFooter: {
		backgroundColor: colors.background,
		borderTopLeftRadius: radius.hero,
		borderTopRightRadius: radius.hero,
		padding: 22,
		width: "100%",
		maxWidth: 680,
		alignSelf: "center",
	},
	cell: { flex: 1 },
	completeStat: { alignItems: "center", gap: 10, borderColor: colors.orange },
	completeStatLabel: { fontSize: 12, color: colors.orange },
	statValueRow: { flexWrap: "wrap", justifyContent: "center" },
	completeStatValue: { fontSize: 28, fontFamily: font.black, flexShrink: 1, textAlign: "center" },
	continue: { marginTop: 20 },
})
