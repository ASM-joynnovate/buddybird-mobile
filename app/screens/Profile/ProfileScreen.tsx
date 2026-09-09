import { useCallback, useState } from "react"
import { Image, StyleSheet, View } from "react-native"
import { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import { useTranslation } from "react-i18next"

import { useAppData, useFeedbackDialog } from "@/context/AppContext"
import { initI18n, durationText } from "@/i18n"
import type { Locale } from "@/services/data"
import { resolveRecordingUri } from "@/services/media"
import { ageMonths, profileStats } from "@/services/statistics"
import { updateData } from "@/services/storage"
import { screen, setUserProperties, track } from "@/services/telemetry"
import type { RootStackParamList } from "@/navigators/types"
import { Button, Chip, Copy, InlineError, Screen, ui } from "@/components/ui"
import { Icon, IconName } from "@/components/Icon"
import { colors, font } from "@/theme"
import { speciesIds } from "@/screens/Profile/species"

export function ProfileScreen() {
  const { t } = useTranslation()
  const data = useAppData()
  const { profile } = data
  const feedback = useFeedbackDialog()
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const [error, setError] = useState<string | null>(null)

  const stats = profileStats(data)
  const locale = data.settings.locale

  useFocusEffect(
    useCallback(() => {
      screen("profile")
    }, []),
  )

  if (!profile) {
    return null
  }

  const age = ageMonths(profile.birthDate)
  const speciesLabel = speciesIds.includes(profile.species)
    ? t(`species.${profile.species}`)
    : profile.species

  const summaries: { icon: IconName; value: string; label: string; color: string }[] = [
    {
      icon: "flame",
      value: String(stats.streakDays),
      label: t("profile.streak"),
      color: colors.orangeText,
    },
    {
      icon: "clock",
      value: durationText(stats.todaySeconds, locale),
      label: t("profile.today"),
      color: colors.orangeText,
    },
    {
      icon: "clock",
      value: durationText(stats.totalSeconds, locale),
      label: t("profile.total"),
      color: colors.blueDark,
    },
  ]

  const achievements = [
    {
      value: t("profile.streakCount", { count: stats.streakDays }),
      label: t("profile.flame"),
      unlocked: stats.streakDays > 0,
      icon: "flame" as const,
    },
    {
      value: durationText(stats.todaySeconds, locale),
      label: t("profile.todayAchievement"),
      unlocked: stats.todaySeconds > 0,
      icon: "clock" as const,
    },
    {
      value: durationText(stats.totalSeconds, locale),
      label: t("profile.totalAchievement"),
      unlocked: stats.totalSeconds > 0,
      icon: "clock" as const,
    },
    {
      value: t("profile.report"),
      label: t("profile.comingSoon"),
      unlocked: false,
      icon: "lock" as const,
    },
  ]

  async function changeLanguage(next: Locale) {
    if (locale === next) {
      return
    }

    try {
      updateData((value) => {
        value.settings.locale = next
      })
      await initI18n(next)
      setUserProperties({ locale: next })
      track("language_changed", { from: locale, to: next })
      setError(null)
    } catch {
      setError(t("profile.languageError"))
    }
  }

  return (
    <Screen>
      <View style={styles.profileCard}>
        {profile.photoUri ? (
          <Image source={{ uri: resolveRecordingUri(profile.photoUri) }} style={styles.photo} />
        ) : (
          <View style={styles.photo}>
            <Copy style={styles.parrot}>🦜</Copy>
          </View>
        )}
        <View style={styles.details}>
          <Copy testID="profile-display-name" style={styles.name}>
            {profile.name}
          </Copy>
          <Copy style={styles.species}>{speciesLabel}</Copy>
          {age !== null ? (
            <Copy style={styles.age}>{t("profile.age", { months: age })}</Copy>
          ) : null}
        </View>
      </View>

      <View style={styles.summaries}>
        {summaries.map((item) => (
          <View key={item.label} style={[ui.card, styles.summary]}>
            <Icon name={item.icon} color={item.color} size={28} />
            <Copy style={styles.stat}>{item.value}</Copy>
            <Copy style={styles.statLabel}>{item.label}</Copy>
          </View>
        ))}
      </View>
      <Copy accessibilityRole="header" style={[ui.sectionTitle, ui.section]}>
        {t("profile.achievements")}
      </Copy>

      <View style={styles.achievements}>
        {achievements.map((item) => (
          <View
            key={item.label}
            style={[ui.card, styles.achievement, !item.unlocked && styles.locked]}
          >
            <Icon
              name={item.unlocked ? item.icon : "lock"}
              color={item.unlocked ? colors.orangeText : colors.muted}
              size={30}
            />
            <View style={styles.achievementText}>
              <Copy style={styles.achievementValue}>{item.value}</Copy>
              <Copy style={styles.achievementLabel}>{item.label}</Copy>
            </View>
          </View>
        ))}
      </View>

      <Copy accessibilityRole="header" style={[ui.sectionTitle, ui.section]}>
        {t("profile.language")}
      </Copy>
      <View style={ui.row}>
        <Chip
          testID="language-ko"
          label="한국어"
          selected={locale === "ko"}
          onPress={() => void changeLanguage("ko")}
        />
        <Chip
          testID="language-en"
          label="English"
          selected={locale === "en"}
          onPress={() => void changeLanguage("en")}
        />
      </View>

      <InlineError message={error} />

      <View style={styles.actions}>
        <Button
          testID="profile-edit"
          label={t("profile.edit")}
          variant="secondary"
          onPress={() => navigation.navigate("ProfileEditor")}
          style={styles.action}
        />
        <Button
          testID="profile-feedback"
          label={t("profile.feedback")}
          variant="secondary"
          onPress={() => feedback.open("profile")}
          style={styles.action}
        />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: colors.orange,
    borderRadius: 24,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderBottomWidth: 5,
    borderColor: colors.orangeDark,
  },
  photo: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.orangeSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  parrot: { fontSize: 40 },
  details: { flex: 1 },
  name: { fontSize: 28, fontFamily: font.black, color: "#3c2600" },
  species: { marginTop: 6, fontSize: 17, color: "#3c2600" },
  age: { fontSize: 14, color: "#3c2600", marginTop: 4 },
  summaries: { flexDirection: "row", gap: 10, marginTop: 24 },
  summary: { flex: 1, alignItems: "center", paddingHorizontal: 7, paddingVertical: 18, gap: 8 },
  stat: { fontSize: 25, fontFamily: font.black, textAlign: "center" },
  statLabel: { fontSize: 11, textAlign: "center", color: colors.muted },
  achievements: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  achievement: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 90,
    padding: 14,
  },
  locked: { backgroundColor: colors.surface },
  achievementText: { flex: 1 },
  achievementValue: { fontFamily: font.extraBold, fontSize: 16 },
  achievementLabel: { fontSize: 12, color: colors.muted, marginTop: 4 },
  actions: { flexDirection: "row", gap: 10, marginTop: 24 },
  action: { flex: 1 },
})
