import { useCallback, useRef, useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { useTranslation } from "react-i18next"

import { useAppData } from "@/context/AppContext"
import { useSession } from "@/context/SessionContext"
import { durationText } from "@/i18n"
import { visibleWords } from "@/services/library"
import { screen } from "@/services/telemetry"
import { Button, Copy, InlineError, Screen, Title, ui } from "@/components/ui"
import { Icon } from "@/components/Icon"
import { Wheel } from "@/components/Wheel"
import { colors, font } from "@/theme"
import { customTiming, phaseTotals, presetTiming } from "@/screens/Learning/timing"

const hours = Array.from({ length: 24 }, (_, index) => index)
const minutes = Array.from({ length: 60 }, (_, index) => index)

const choices = ["short", "medium", "long", "custom"] as const
const presetMinutes = { short: 40, medium: 80, long: 240 } as const

export function LearningScreen() {
  const { t } = useTranslation()
  const data = useAppData()
  const session = useSession()

  const locale = data.settings.locale
  const words = visibleWords(data, locale)

  const [wordId, setWordId] = useState<string | undefined>()
  const [choice, setChoice] = useState<(typeof choices)[number]>("medium")
  const [customMinutes, setCustomMinutes] = useState(25)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const starting = useRef(false)

  const word = words.find((item) => item.id === wordId) ?? words[0]
  const timing =
    choice === "custom" ? customTiming(customMinutes) : presetTiming(presetMinutes[choice])
  const totals = phaseTotals(timing)

  const hasZeroDuration = timing.totalDurationSeconds === 0
  const startDisabled = !word || hasZeroDuration
  const errorMessage = hasZeroDuration ? t("learning.invalid") : error

  useFocusEffect(
    useCallback(() => {
      screen("session_setup")
    }, []),
  )

  function choose(next: typeof choice) {
    setChoice(next)

    if (next === "custom") {
      setCustomMinutes(25)
    }

    setError(null)
  }

  function changeCustomHours(nextHours: number) {
    setCustomMinutes(nextHours * 60 + (customMinutes % 60))
  }

  function changeCustomMinutes(nextMinutes: number) {
    setCustomMinutes(Math.floor(customMinutes / 60) * 60 + nextMinutes)
  }

  async function start() {
    if (starting.current || !word || timing.totalDurationSeconds === 0) {
      return
    }

    starting.current = true
    setBusy(true)
    setError(null)

    try {
      await session.start(word.id, timing)
    } catch {
      setError(t("learning.startError"))
    } finally {
      starting.current = false
      setBusy(false)
    }
  }

  return (
    <Screen>
      <Title>{t("learning.title")}</Title>
      <Copy style={ui.subtitle}>{t("learning.subtitle")}</Copy>

      <Copy accessibilityRole="header" style={ui.sectionTitle}>
        {t("learning.words")}
      </Copy>
      <View style={styles.words}>
        {words.map((item) => {
          const selected = word?.id === item.id
          let initialColor = colors.orangeSoft

          if (selected) {
            initialColor = colors.orange
          } else if (item.tag === "name") {
            initialColor = colors.purpleSoft
          } else if (item.tag === "food") {
            initialColor = colors.blueSoft
          }

          return (
            <Pressable
              key={item.id}
              testID={`learn-word-${item.id}`}
              accessibilityRole="button"
              accessibilityLabel={t("learning.selectWord", { word: item.label })}
              accessibilityState={{ selected }}
              onPress={() => setWordId(item.id)}
              style={[ui.card, styles.word, selected && styles.selectedWord]}
            >
              <View style={[styles.initial, { backgroundColor: initialColor }]}>
                <Copy style={styles.letter}>{Array.from(item.label)[0]}</Copy>
              </View>
              <Copy style={styles.wordLabel}>{item.label}</Copy>
              {selected ? (
                <View style={styles.check}>
                  <Icon name="check" size={14} color="#3c2600" />
                </View>
              ) : null}
            </Pressable>
          )
        })}
      </View>
      {!word ? <Copy style={ui.subtitle}>{t("learning.noWords")}</Copy> : null}

      <Copy accessibilityRole="header" style={[ui.sectionTitle, ui.section]}>
        {t("learning.time")}
      </Copy>
      {choices.map((item) => {
        const seconds = item === "custom" ? timing.totalDurationSeconds : presetMinutes[item] * 60
        const duration =
          seconds === 0 ? `0${locale === "ko" ? "분" : "m"}` : durationText(seconds, locale)

        return (
          <Pressable
            key={item}
            testID={`duration-${item}`}
            accessibilityRole="radio"
            accessibilityState={{ checked: choice === item }}
            accessibilityLabel={`${t(`learning.${item}`)}, ${duration}`}
            onPress={() => choose(item)}
            style={[ui.card, styles.choice, choice === item && styles.selectedChoice]}
          >
            <View style={[styles.radio, choice === item && styles.radioSelected]}>
              {choice === item ? <Icon name="check" size={15} color="#3c2600" /> : null}
            </View>
            <View style={styles.choiceText}>
              <View style={ui.row}>
                <Copy style={styles.choiceTitle}>{t(`learning.${item}`)}</Copy>
                <Copy style={styles.duration}>{duration}</Copy>
              </View>
              <Copy style={styles.choiceHint}>{t(`learning.${item}Hint`)}</Copy>
            </View>
          </Pressable>
        )
      })}

      {choice === "custom" ? (
        <View style={[ui.card, styles.pickerCard]}>
          <Copy style={styles.pickerTitle}>{t("learning.total")}</Copy>
          <View style={ui.row}>
            <Wheel
              testID="duration-hours"
              label={t("learning.hourPicker")}
              value={Math.floor(customMinutes / 60)}
              values={hours}
              onChange={changeCustomHours}
            />
            <Copy>{t("common.hours")}</Copy>
            <Wheel
              testID="duration-minutes"
              label={t("learning.minutePicker")}
              value={customMinutes % 60}
              values={minutes}
              onChange={changeCustomMinutes}
            />
            <Copy>{t("common.minutes")}</Copy>
          </View>
        </View>
      ) : null}

      <View style={[ui.card, styles.breakdown]}>
        <View style={styles.breakdownHeader}>
          <Copy style={styles.breakdownTitle}>{t("learning.total")}</Copy>
          <Copy style={styles.total}>{durationText(timing.totalDurationSeconds, locale)}</Copy>
        </View>
        <View style={styles.phases}>
          {(["learning", "rest", "care"] as const).map((phase, index) => (
            <View key={phase} style={[styles.phase, index > 0 && styles.phaseBorder]}>
              <Copy style={styles.phaseLabel}>{t(`learning.${phase}`)}</Copy>
              <Copy
                testID={`duration-total-${phase}`}
                style={[
                  styles.phaseTime,
                  { color: index === 0 ? colors.orangeText : colors.blueDark },
                ]}
              >
                {durationText(totals[index], locale)}
              </Copy>
            </View>
          ))}
        </View>
      </View>

      <InlineError message={errorMessage} />
      <Button
        testID="learning-start"
        label={t("learning.start")}
        accessibilityLabel={startDisabled ? t("learning.choose") : t("learning.start")}
        icon="play"
        disabled={startDisabled}
        loading={busy}
        onPress={() => void start()}
        style={styles.start}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  words: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  word: {
    width: "31.5%",
    minHeight: 98,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  selectedWord: { borderColor: colors.orange, backgroundColor: "#fff9ee" },
  initial: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  letter: { fontFamily: font.black, fontSize: 23 },
  wordLabel: { fontFamily: font.extraBold, fontSize: 16, textAlign: "center" },
  check: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center",
  },
  choice: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12, minHeight: 86 },
  selectedChoice: { borderColor: colors.orange },
  radio: {
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: { borderColor: colors.orange, backgroundColor: colors.orange },
  choiceText: { flex: 1 },
  choiceTitle: { fontFamily: font.black, fontSize: 21 },
  duration: { fontSize: 17, color: colors.orangeText, fontFamily: font.extraBold, flexShrink: 1 },
  choiceHint: { color: colors.muted, fontSize: 15, marginTop: 7, lineHeight: 21 },
  pickerCard: { marginBottom: 16 },
  pickerTitle: { textAlign: "center", marginBottom: 4 },
  breakdown: { padding: 0, marginTop: 4, backgroundColor: colors.surface, overflow: "hidden" },
  breakdownHeader: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  breakdownTitle: { fontSize: 15, color: colors.muted, flex: 1 },
  total: { fontFamily: font.black, fontSize: 23 },
  phases: {
    flexDirection: "row",
    borderTopWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  phase: { flex: 1, padding: 14 },
  phaseBorder: { borderLeftWidth: 2, borderColor: colors.border },
  phaseLabel: { color: colors.muted, fontSize: 13 },
  phaseTime: { fontFamily: font.black, fontSize: 22, marginTop: 8 },
  start: { marginTop: 22 },
})
