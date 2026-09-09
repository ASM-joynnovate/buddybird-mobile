import { useEffect, useRef, useState } from "react"
import {
  AccessibilityInfo,
  Animated,
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { usePreventRemove } from "@react-navigation/native"
import Svg, { Circle } from "react-native-svg"
import { useTranslation } from "react-i18next"

import { useAppData } from "@/context/AppContext"
import { useSession } from "@/context/SessionContext"
import { currentWord } from "@/services/data"
import { learningSeconds } from "@/services/sessionHistory"
import { profileStats } from "@/services/statistics"
import { screen, setSessionReplayPaused } from "@/services/telemetry"
import { durationText } from "@/i18n"
import { Button, Copy, InlineError, ui } from "@/components/ui"
import { Icon } from "@/components/Icon"
import { colors, font, mascot } from "@/theme"

export function SessionScreen({ onContinue }: { onContinue(): void }) {
  const { t } = useTranslation()
  const data = useAppData()
  const session = useSession()
  const { snapshot } = session
  const { width, height } = useWindowDimensions()

  const [busy, setBusy] = useState(false)
  const [commandError, setCommandError] = useState(false)
  const inFlight = useRef(false)

  const history = snapshot.sessionId ? data.history[snapshot.sessionId] : undefined
  const draft = snapshot.sessionId ? data.sessionDrafts[snapshot.sessionId] : undefined
  const settings = history ?? draft?.settings ?? data.settings.lastSession
  const word =
    history?.word ??
    draft?.word ??
    (settings ? currentWord(data, settings.libraryEntryId ?? settings.wordId) : undefined)

  const complete = snapshot.state === "completed"
  const active = ["starting", "running", "paused", "interrupted", "stopping"].includes(
    snapshot.state,
  )
  const paused = snapshot.state === "paused" || snapshot.state === "interrupted"

  useEffect(() => {
    screen("session_active")
    setSessionReplayPaused(true)

    return () => setSessionReplayPaused(false)
  }, [])

  usePreventRemove(active, () => {
    void command(session.stop)
  })

  async function command(action: () => Promise<void>) {
    if (inFlight.current) {
      return
    }

    inFlight.current = true
    setBusy(true)
    setCommandError(false)

    try {
      await action()
    } catch {
      setCommandError(true)
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  async function end() {
    if (snapshot.state === "failed") {
      await session.retryRecovery()
      onContinue()
    } else {
      await session.stop()
    }
  }

  function togglePause() {
    if (paused) {
      void command(session.resume)
    } else {
      void command(session.pause)
    }
  }

  if (complete) {
    const stats = profileStats(data)
    const learned =
      history?.totalLearningSeconds ??
      (settings ? learningSeconds(snapshot.elapsedRunningMs, settings) : 0)

    return (
      <SafeAreaView style={styles.complete}>
        <Confetti />
        <View style={styles.completeContent}>
          <Image accessibilityLabel="Buddy" source={mascot} style={styles.completeMascot} />
          <Copy accessibilityRole="header" testID="session-complete" style={styles.completeTitle}>
            {t("session.complete")}
          </Copy>
          <Copy style={styles.completeDescription}>
            {t("session.listened", {
              name: data.profile?.name ?? "",
              word: word?.label ?? "",
              duration: durationText(learned, data.settings.locale),
            })}
          </Copy>
        </View>

        <View style={styles.completeFooter}>
          <View style={ui.row}>
            <View style={[ui.card, styles.completeStat]}>
              <Copy style={styles.completeStatLabel}>{t("session.streak")}</Copy>
              <View style={ui.row}>
                <Icon name="flame" color={colors.orangeText} />
                <Copy style={styles.completeStatValue}>{stats.streakDays}</Copy>
              </View>
            </View>
            <View style={[ui.card, styles.completeStat]}>
              <Copy style={styles.completeStatLabel}>{t("session.total")}</Copy>
              <View style={ui.row}>
                <Icon name="clock" color={colors.orangeText} />
                <Copy style={styles.completeStatValue}>
                  {durationText(stats.totalSeconds, data.settings.locale)}
                </Copy>
              </View>
            </View>
          </View>
          <InlineError message={session.error ? t("session.unavailable") : null} />
          {session.error ? (
            <Button
              label={t("session.recovery")}
              onPress={() => void command(session.retryRecovery)}
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
      </SafeAreaView>
    )
  }

  const total = (settings?.totalDurationSeconds ?? 1) * 1000
  const durations = {
    "learning": settings?.learningDurationSeconds ?? 1,
    "rest": settings?.restDurationSeconds ?? 0,
    "stress-care": settings?.stressCareDurationSeconds ?? 0,
  }

  const phaseDuration = durations[snapshot.phase] * 1000
  const remaining = Math.max(
    0,
    Math.min(phaseDuration - snapshot.phaseElapsedMs, total - snapshot.elapsedRunningMs),
  )

  const seconds = Math.ceil(remaining / 1000)
  const timerMinutes = String(Math.floor(seconds / 60)).padStart(2, "0")
  const timerSeconds = String(seconds % 60).padStart(2, "0")
  const timer = `${timerMinutes}:${timerSeconds}`

  const cycleDuration = Object.values(durations).reduce((sum, value) => sum + value, 0)
  const cycleCount = Math.max(1, Math.ceil(total / 1000 / (cycleDuration || 1)))

  const learning = snapshot.phase === "learning"
  const accent = learning ? colors.orange : colors.blue

  const size = Math.min(width - 90, height * 0.4, 310)
  const radius = (size - 18) / 2
  const circumference = Math.PI * 2 * radius
  const progress = phaseDuration > 0 ? Math.min(1, snapshot.phaseElapsedMs / phaseDuration) : 0
  const elapsedPercent = Math.min(100, (snapshot.elapsedRunningMs / total) * 100)

  let phaseTitle = word?.label

  if (snapshot.phase === "rest") {
    phaseTitle = t("session.rest")
  } else if (snapshot.phase === "stress-care") {
    phaseTitle = t("session.care")
  }

  let statusKey = "session.waiting"

  if (snapshot.state === "interrupted") {
    statusKey = "session.interrupted"
  } else if (paused) {
    statusKey = "session.paused"
  } else if (snapshot.isTargetPlaying) {
    statusKey = "session.playing"
  }

  let phaseHintKey = snapshot.phase === "rest" ? "session.restHint" : "session.careHint"

  if (paused) {
    phaseHintKey = snapshot.state === "interrupted" ? "session.interrupted" : "session.paused"
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.sessionContent}>
        <View style={styles.header}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${elapsedPercent}%`,
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
            onPress={() => void command(end)}
          />
        </View>

        <Copy style={styles.cycle}>
          {t("session.cycle", { cycle: snapshot.cycle, total: cycleCount })}
        </Copy>
        <View style={styles.middle}>
          <View style={{ width: size, height: size }}>
            <Svg
              width={size}
              height={size}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={colors.border}
                strokeWidth={17}
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={accent}
                strokeWidth={17}
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={circumference * (1 - progress)}
                rotation={-90}
                origin={`${size / 2}, ${size / 2}`}
              />
            </Svg>
            <View style={styles.ringContent}>
              <Image
                source={mascot}
                style={[styles.sessionMascot, { height: size * 0.36, width: size * 0.36 }]}
              />
              <Copy style={[styles.phaseTitle, !learning && styles.restTitle]}>{phaseTitle}</Copy>
              <Copy testID="session-countdown" style={styles.timer}>
                {timer}
              </Copy>
            </View>
          </View>
        </View>

        {learning ? (
          <>
            <View
              style={styles.waveform}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {Array.from({ length: 33 }, (_, index) => (
                <View
                  key={index}
                  style={[
                    styles.wave,
                    {
                      height: paused ? 7 : 7 + Math.sin((index / 32) * Math.PI) * 24,
                      backgroundColor: accent,
                    },
                  ]}
                />
              ))}
            </View>
            <Copy style={[styles.status, { backgroundColor: colors.orangeSoft }]}>
              {t(statusKey)}
            </Copy>
          </>
        ) : (
          <Copy style={styles.phaseHint}>{t(phaseHintKey)}</Copy>
        )}

        <InlineError message={session.error || commandError ? t("session.unavailable") : null} />
        {session.error ? (
          <Button
            label={t("session.recovery")}
            variant="secondary"
            loading={busy}
            onPress={() => void command(session.retryRecovery)}
            style={styles.retry}
          />
        ) : null}

        <Button
          testID="session-pause"
          label={t(paused ? "session.resume" : "session.pause")}
          icon={paused ? "play" : "pause"}
          variant={learning ? "primary" : "blue"}
          loading={busy || snapshot.state === "stopping"}
          disabled={snapshot.state === "failed"}
          onPress={togglePause}
          style={styles.pause}
        />
      </View>
    </SafeAreaView>
  )
}

function Confetti() {
  const value = useRef(new Animated.Value(0)).current
  const [reduceMotion, setReduceMotion] = useState(true)

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion)

    return () => listener.remove()
  }, [])

  useEffect(() => {
    if (reduceMotion) {
      return
    }

    const animation = Animated.loop(
      Animated.timing(value, { toValue: 1, duration: 5500, useNativeDriver: true }),
    )

    animation.start()

    return () => animation.stop()
  }, [reduceMotion, value])

  if (reduceMotion) {
    return null
  }

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {Array.from({ length: 12 }, (_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.confetti,
            {
              left: `${index * 8 + 2}%`,
              top: (index % 4) * 90 - 160,
              backgroundColor: [colors.background, colors.blue, "#ffd43b", "#c176ff"][index % 4],
              transform: [
                { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, 850] }) },
                { rotate: `${index * 47}deg` },
              ],
            },
          ]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  sessionContent: { flex: 1, padding: 22, width: "100%", maxWidth: 680, alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: 14 },
  progressTrack: {
    flex: 1,
    height: 14,
    backgroundColor: colors.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 8 },
  cycle: {
    alignSelf: "center",
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    color: colors.muted,
    fontSize: 14,
    marginTop: 22,
  },
  middle: {
    flex: 1,
    minHeight: 230,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 12,
  },
  ringContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  sessionMascot: { resizeMode: "contain", marginBottom: 10 },
  phaseTitle: { fontSize: 30, fontFamily: font.black, textAlign: "center" },
  restTitle: { fontSize: 24 },
  timer: { fontSize: 28, fontFamily: font.black, marginTop: 9, fontVariant: ["tabular-nums"] },
  waveform: {
    height: 36,
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  wave: { width: 4, borderRadius: 3 },
  status: {
    alignSelf: "center",
    paddingVertical: 11,
    paddingHorizontal: 18,
    borderRadius: 24,
    fontSize: 14,
    textAlign: "center",
  },
  phaseHint: { textAlign: "center", color: colors.muted, lineHeight: 25, marginBottom: 8 },
  pause: { marginTop: 22 },
  retry: { marginTop: 12 },
  complete: { flex: 1, backgroundColor: colors.orange },
  completeContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 22 },
  completeMascot: { width: 160, height: 180, resizeMode: "contain", marginBottom: 22 },
  completeTitle: { fontFamily: font.black, fontSize: 38, textAlign: "center", color: "#3c2600" },
  completeDescription: {
    fontSize: 18,
    textAlign: "center",
    color: "#3c2600",
    marginTop: 15,
    lineHeight: 27,
  },
  completeFooter: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  completeStat: { flex: 1, alignItems: "center", gap: 10, borderColor: colors.orange },
  completeStatLabel: { fontSize: 12, color: colors.orangeText },
  completeStatValue: { fontSize: 28, fontFamily: font.black },
  continue: { marginTop: 20 },
  confetti: { position: "absolute", width: 11, height: 17, borderRadius: 4 },
})
