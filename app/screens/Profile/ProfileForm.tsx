import { useEffect, useRef, useState } from "react"
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"
import * as ImagePicker from "expo-image-picker"

import { useAppData } from "@/context/AppContext"
import { saveProfile } from "@/services/library"
import { resolveRecordingUri } from "@/services/media"
import { ageMonths } from "@/services/statistics"
import { screen, setUserProperties, track } from "@/services/telemetry"
import { Button, Chip, Copy, IconButton, InlineError, ui } from "@/components/ui"
import { Wheel } from "@/components/Wheel"
import { colors, font, mascot } from "@/theme"
import { speciesGroups, speciesIds } from "@/screens/Profile/species"

const months = Array.from({ length: 12 }, (_, index) => index + 1)

export function OnboardingScreen() {
  return <ProfileForm onboarding />
}

export function ProfileEditorScreen() {
  return <ProfileForm />
}

function ProfileForm({ onboarding = false }: { onboarding?: boolean }) {
  const { t } = useTranslation()
  const { profile } = useAppData()
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()

  const now = new Date()
  const initialDate = profile?.birthDate?.split("-").map(Number) ?? [
    now.getFullYear() - 1,
    now.getMonth() + 1,
    1,
  ]

  const savedSpecies = profile?.species ?? ""
  const hasKnownSpecies = speciesIds.includes(savedSpecies)

  const [name, setName] = useState(profile?.name ?? "")
  const [species, setSpecies] = useState(hasKnownSpecies ? savedSpecies : "")
  const [custom, setCustom] = useState(Boolean(savedSpecies && !hasKnownSpecies))
  const [customSpecies, setCustomSpecies] = useState(custom ? savedSpecies : "")

  const [unknownBirthday, setUnknownBirthday] = useState(Boolean(profile && !profile.birthDate))
  const [year, setYear] = useState(initialDate[0])
  const [month, setMonth] = useState(initialDate[1])
  const [day, setDay] = useState(initialDate[2])
  const [photoUri, setPhotoUri] = useState(profile?.photoUri)

  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saving = useRef(false)
  const started = useRef(Date.now())
  const completed = useRef(false)

  const effectiveSpecies = (custom ? customSpecies : species).trim()

  const days = Array.from({ length: new Date(year, month, 0).getDate() }, (_, index) => index + 1)
  const earliestYear = Math.min(now.getFullYear() - 100, initialDate[0])
  const years = Array.from(
    { length: now.getFullYear() - earliestYear + 1 },
    (_, index) => earliestYear + index,
  )

  const chosenDay = Math.min(day, days.length)
  const birthDate = unknownBirthday
    ? null
    : `${year}-${String(month).padStart(2, "0")}-${String(chosenDay).padStart(2, "0")}`
  const futureBirthday =
    !unknownBirthday && new Date(year, month - 1, chosenDay).getTime() > Date.now()

  const nameError = submitted && !name.trim() ? t("profile.nameRequired") : null
  const speciesError = submitted && !effectiveSpecies ? t("profile.speciesRequired") : null
  const birthdayError = submitted && futureBirthday ? t("profile.birthdayInvalid") : error

  useEffect(() => {
    if (!onboarding) {
      return
    }

    const began = started.current

    screen("onboarding_profile")
    track("onboarding_started", {})

    return () => {
      if (!completed.current) {
        track("onboarding_abandoned", {
          last_step: "profile",
          last_step_duration_ms: Date.now() - began,
        })
      }
    }
  }, [onboarding])

  async function choosePhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri)
      }
    } catch {
      setError(t("profile.photoError"))
    }
  }

  async function save() {
    setSubmitted(true)

    if (saving.current || !name.trim() || !effectiveSpecies || futureBirthday) {
      return
    }

    saving.current = true
    setBusy(true)
    setError(null)

    try {
      const saved = await saveProfile({ name, species: effectiveSpecies, birthDate, photoUri })
      const age = ageMonths(saved.birthDate)
      const properties = {
        parrot_name: saved.name,
        parrot_species: saved.species,
        ...(age !== null ? { parrot_age_months: age } : {}),
      }

      setUserProperties(properties)

      if (onboarding) {
        completed.current = true
        track("profile_created", properties)
        track("onboarding_step_completed", {
          step: "profile",
          duration_ms: Date.now() - started.current,
        })
        track("onboarding_completed", { total_duration_ms: Date.now() - started.current })
      } else {
        const fieldsChanged = (["name", "species", "birthDate", "photoUri"] as const).filter(
          (key) => saved[key] !== profile?.[key],
        )

        track("profile_updated", { ...properties, fields_changed: fieldsChanged })
        navigation.goBack()
      }
    } catch {
      setError(t("profile.saveError"))
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[
            styles.content,
            { paddingBottom: onboarding ? 24 : insets.bottom + 30 },
          ]}
        >
          {onboarding ? (
            <View style={styles.intro}>
              <Image source={mascot} style={styles.smallMascot} />
              <View style={styles.speech}>
                <Copy style={styles.introText}>{t("profile.intro")}</Copy>
              </View>
            </View>
          ) : (
            <View style={[ui.row, styles.header]}>
              <IconButton
                icon="back"
                label={t("common.back")}
                onPress={() => navigation.goBack()}
              />
              <Copy style={styles.headerText}>{t("profile.edit")}</Copy>
            </View>
          )}

          <View style={styles.photoArea}>
            <IconButton
              testID="profile-photo"
              icon="plus"
              label={t("profile.photo")}
              disabled={busy}
              onPress={() => void choosePhoto()}
              style={styles.photoTouch}
            />
            <View pointerEvents="none" style={styles.photoPreview}>
              {photoUri ? (
                <Image source={{ uri: resolveRecordingUri(photoUri) }} style={styles.photo} />
              ) : (
                <Copy style={styles.parrot}>🦜</Copy>
              )}
              <View style={styles.photoPlus}>
                <Copy style={styles.plusText}>+</Copy>
              </View>
            </View>
          </View>

          <Copy style={ui.label}>{t("profile.name")}</Copy>
          <TextInput
            testID="profile-name"
            accessibilityLabel={t("profile.name")}
            value={name}
            onChangeText={setName}
            editable={!busy}
            placeholder={t("profile.nameHint")}
            placeholderTextColor={colors.muted}
            style={ui.input}
            autoCapitalize="words"
            returnKeyType="done"
          />
          <InlineError message={nameError} />

          <View style={styles.labelRow}>
            <Copy style={[ui.label, styles.noMargin]}>{t("profile.species")}</Copy>
            <Chip
              label={t(custom ? "common.select" : "profile.custom")}
              onPress={() => setCustom(!custom)}
            />
          </View>
          {custom ? (
            <TextInput
              testID="profile-custom-species"
              accessibilityLabel={t("profile.species")}
              value={customSpecies}
              onChangeText={setCustomSpecies}
              editable={!busy}
              maxLength={50}
              placeholder={t("profile.customHint")}
              placeholderTextColor={colors.muted}
              style={ui.input}
            />
          ) : (
            Object.entries(speciesGroups).map(([group, items]) => (
              <View key={group} style={styles.group}>
                <Copy style={styles.groupLabel}>{t(`groups.${group}`)}</Copy>
                <View style={ui.wrap}>
                  {items.map((id) => (
                    <Chip
                      key={id}
                      testID={`species-${id}`}
                      label={t(`species.${id}`)}
                      selected={species === id}
                      onPress={() => setSpecies(id)}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
          <InlineError message={speciesError} />

          <View style={styles.labelRow}>
            <Copy style={[ui.label, styles.noMargin]}>{t("profile.birthday")}</Copy>
            <Chip
              testID="birthday-unknown"
              label={t(unknownBirthday ? "common.select" : "common.unknown")}
              selected={unknownBirthday}
              onPress={() => setUnknownBirthday(!unknownBirthday)}
            />
          </View>
          {unknownBirthday ? (
            <Copy style={styles.birthdayHint}>{t("profile.birthdayUnknown")}</Copy>
          ) : (
            <View style={ui.row}>
              <Wheel
                testID="birthday-year"
                value={year}
                values={years}
                onChange={setYear}
                label={t("profile.yearPicker")}
              />
              <Wheel
                testID="birthday-month"
                value={month}
                values={months}
                onChange={setMonth}
                label={t("profile.monthPicker")}
              />
              <Wheel
                testID="birthday-day"
                value={chosenDay}
                values={days}
                onChange={setDay}
                label={t("profile.dayPicker")}
              />
            </View>
          )}

          <InlineError message={birthdayError} />
          {!onboarding ? (
            <Button
              testID="profile-save"
              label={t("common.save")}
              loading={busy}
              onPress={() => void save()}
              style={styles.save}
            />
          ) : null}
        </ScrollView>

        {onboarding ? (
          <View style={[styles.footer, { paddingBottom: Math.max(18, insets.bottom) }]}>
            <Button
              testID="onboarding-start"
              label={t("profile.start")}
              loading={busy}
              onPress={() => void save()}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 22, width: "100%", maxWidth: 680, alignSelf: "center" },
  intro: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  smallMascot: { width: 66, height: 76, resizeMode: "contain" },
  speech: { flex: 1, borderWidth: 2, borderColor: colors.border, borderRadius: 20, padding: 17 },
  introText: { fontFamily: font.extraBold, fontSize: 19, lineHeight: 27 },
  header: { marginLeft: -8, marginBottom: 18 },
  headerText: { fontSize: 17, fontFamily: font.extraBold },
  photoArea: { width: 120, height: 130, alignSelf: "center", marginBottom: 24 },
  photoTouch: { width: 120, height: 120, borderRadius: 60 },
  photoPreview: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    borderWidth: 3,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  photo: { width: 114, height: 114, borderRadius: 57 },
  parrot: { fontSize: 56 },
  photoPlus: {
    position: "absolute",
    right: -5,
    bottom: -5,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.orange,
    borderWidth: 3,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  plusText: { fontSize: 35, lineHeight: 38, color: "#3c2600" },
  labelRow: {
    marginTop: 24,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noMargin: { marginBottom: 0 },
  group: { marginBottom: 10 },
  groupLabel: { fontSize: 14, color: colors.muted, marginBottom: 8 },
  birthdayHint: { color: colors.muted, paddingVertical: 12, lineHeight: 23 },
  save: { marginTop: 26 },
  footer: {
    paddingTop: 14,
    paddingHorizontal: 22,
    borderTopWidth: 2,
    borderColor: colors.border,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    backgroundColor: colors.background,
  },
})
