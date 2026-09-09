import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, Alert, AppState, Button, StyleSheet, Text, View } from "react-native"
import { QueryClientProvider, useQuery } from "@tanstack/react-query"
import { useFonts } from "expo-font"
import { getLocales } from "expo-localization"
import * as SplashScreen from "expo-splash-screen"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { useTranslation } from "react-i18next"

import { AppProvider, useAppData, useFeedbackDialog } from "@/context/AppContext"
import { SessionProvider, useSession } from "@/context/SessionContext"
import { AudioConsentDialog, FeedbackDialog, UpdateDialog } from "@/components/Dialogs"
import { initI18n } from "@/i18n"
import { AppNavigator } from "@/navigators/AppNavigator"
import { fontsToLoad } from "@/theme"
import { migrateData } from "@/services/migration"
import { recoverNativeData } from "@/services/session"
import { readData, updateData } from "@/services/storage"
import { seedPresets } from "@/services/library"
import { connectQueryLifecycle, queryClient } from "@/services/api/queryClient"
import {
  currentIdentity,
  dismissUpdate,
  identityQueryOptions,
  installedVersion,
  openStore,
  subscribeIdentity,
  updateQueryOptions,
} from "@/services/api/firebase"
import {
  consumeFeedbackPrompt,
  countFeedbackDay,
  evaluateUpdate,
  feedbackThreshold,
  shouldCheckUpdate,
  shouldPromptUploadConsent,
} from "@/services/api/policy"
import { getIsHeadless, mergePushReceipts, startPush } from "@/services/push"
import {
  initializeTelemetry,
  installGlobalErrorReporting,
  reportError,
  setTelemetryIdentity,
  setUserProperties,
  track,
} from "@/services/telemetry"
import { setUploadConsent, startUploads } from "@/services/uploads"
import { ageMonths, profileStats } from "@/services/statistics"

void SplashScreen.preventAutoHideAsync().catch(() => {})
// Register the translation instance before the first useTranslation hook renders.
const i18nReady = initI18n(getLocales()[0]?.languageCode === "ko" ? "ko" : "en")

function AppLifecycle() {
  const { t } = useTranslation()
  const data = useAppData()
  const feedback = useFeedbackDialog()
  const { snapshot } = useSession()

  const profileId = data.profile?.id

  const [telemetryReady, setTelemetryReady] = useState(false)
  const [consentResolved, setConsentResolved] = useState(
    () => !shouldPromptUploadConsent(data.settings.uploadConsent, true),
  )

  const [storeOpening, setStoreOpening] = useState(false)
  const [acceptedUpdate, setAcceptedUpdate] = useState<string | null>(null)
  const shownUpdate = useRef<string | null>(null)
  const feedbackPromptOpen = useRef(false)

  const identity = useQuery(identityQueryOptions())
  const update = useQuery({ ...updateQueryOptions(), enabled: telemetryReady })

  const decision =
    update.isSuccess && !update.isFetching && !update.isError
      ? evaluateUpdate(
          update.data,
          installedVersion,
          data.settings.update.dismissedVersion,
          data.settings.locale,
        )
      : null
  const updateVisible = !!decision && (decision.forced || acceptedUpdate !== decision.latestVersion)
  const updatesSettled =
    telemetryReady &&
    !update.isFetching &&
    (update.isSuccess || update.isError || update.fetchStatus === "paused")
  const consentVisible = !!data.profile && updatesSettled && !updateVisible && !consentResolved
  const sessionActive = ["starting", "running", "paused", "interrupted", "stopping"].includes(
    snapshot.state,
  )

  useEffect(() => {
    const removeErrors = installGlobalErrorReporting()
    let mounted = true

    void initializeTelemetry()
      .catch((error) => reportError(error, "telemetry_start"))
      .finally(() => {
        if (mounted) {
          setTelemetryReady(true)
          track("app_open", { cold_start: true })
        }
      })

    const uploads = startUploads()
    const auth = subscribeIdentity((uid) => {
      if (uid) {
        queryClient.setQueryData(["firebase", "identity"], uid)
        setTelemetryIdentity(uid)
      }
    })

    updateData((next) => {
      countFeedbackDay(next.settings.feedback)
    })

    let foregroundAt = Date.now()
    let previous = AppState.currentState
    const lifecycle = AppState.addEventListener("change", (next) => {
      if (next === "active" && previous !== "active") {
        foregroundAt = Date.now()
        track("app_foreground", {})
        void initializeTelemetry(false).catch((error) => reportError(error, "telemetry_foreground"))

        try {
          mergePushReceipts()
          updateData((value) => {
            countFeedbackDay(value.settings.feedback)
          })

          if (shouldCheckUpdate(readData().settings.update.lastCheckedAt, false)) {
            void queryClient.invalidateQueries({ queryKey: ["firebase", "update"] })
          }

          if (!currentIdentity()) {
            void queryClient.invalidateQueries({ queryKey: ["firebase", "identity"] })
          }
        } catch (error) {
          reportError(error, "foreground")
        }
      } else if (next === "background" && previous !== "background") {
        track("app_background", { session_duration_ms: Date.now() - foregroundAt })
      }

      previous = next
    })

    return () => {
      mounted = false
      removeErrors()
      uploads()
      auth()
      lifecycle.remove()
    }
  }, [])

  useEffect(() => {
    if (identity.data) {
      setTelemetryIdentity(identity.data)
    }
  }, [identity.data])

  useEffect(() => {
    if (!profileId) {
      return
    }

    return startPush()
  }, [profileId])

  useEffect(() => {
    if (!telemetryReady || !data.profile) {
      return
    }

    const stats = profileStats(data)

    setUserProperties({
      profile_age_days: Math.max(
        0,
        Math.floor((Date.now() - Date.parse(data.profile.createdAt)) / 86400_000),
      ),
      parrot_name: data.profile.name,
      parrot_species: data.profile.species,
      parrot_age_months: ageMonths(data.profile.birthDate),
      total_words_registered: stats.wordCount,
      total_training_sessions: stats.sessionCount,
      locale: data.settings.locale,
    })
  }, [data, telemetryReady])

  useEffect(() => {
    if (updateVisible && decision && shownUpdate.current !== decision.latestVersion) {
      shownUpdate.current = decision.latestVersion
      track("update_prompt_shown", {
        latest_version: decision.latestVersion,
        is_forced: decision.forced,
      })
    }
  }, [updateVisible, decision])

  const threshold = feedbackThreshold(data.settings.feedback)

  useEffect(() => {
    if (
      !data.profile ||
      !updatesSettled ||
      updateVisible ||
      !consentResolved ||
      sessionActive ||
      feedback.source ||
      feedbackPromptOpen.current ||
      data.settings.feedback.dayCount < threshold
    ) {
      return
    }

    feedbackPromptOpen.current = true
    track("feedback_prompt_shown", { threshold })
    const consume = (write: boolean) => {
      try {
        updateData((next) => {
          consumeFeedbackPrompt(next.settings.feedback)
        })

        if (write) {
          feedback.open("prompt")
        } else {
          track("feedback_prompt_dismissed", { threshold })
        }
      } catch (error) {
        reportError(error, "feedback_prompt")
      }

      feedbackPromptOpen.current = false
    }

    Alert.alert(
      t("feedback.promptTitle"),
      t("feedback.promptMessage"),
      [
        { text: t("feedback.later"), style: "cancel", onPress: () => consume(false) },
        { text: t("feedback.write"), onPress: () => consume(true) },
      ],
      { cancelable: false },
    )
  }, [
    data.profile,
    data.settings.feedback,
    updatesSettled,
    updateVisible,
    consentResolved,
    sessionActive,
    feedback,
    threshold,
    t,
  ])

  async function acceptUpdate() {
    if (!decision || storeOpening) {
      return
    }

    setStoreOpening(true)

    try {
      track("update_prompt_accepted", {
        latest_version: decision.latestVersion,
        is_forced: decision.forced,
      })
      await openStore()

      if (!decision.forced) {
        setAcceptedUpdate(decision.latestVersion)
      }
    } catch (error) {
      reportError(error, "open_store")
      throw error
    } finally {
      setStoreOpening(false)
    }
  }

  return (
    <>
      <UpdateDialog
        visible={updateVisible}
        latestVersion={decision?.latestVersion ?? ""}
        notes={decision?.notes ?? []}
        forced={decision?.forced ?? false}
        pending={storeOpening}
        onAccept={acceptUpdate}
        onDismiss={() => {
          if (!decision || decision.forced) {
            return
          }

          try {
            dismissUpdate(decision.latestVersion)
            track("update_prompt_dismissed", { latest_version: decision.latestVersion })
          } catch (error) {
            reportError(error, "dismiss_update")
            Alert.alert(t("update.error"))
          }
        }}
      />
      <AudioConsentDialog
        visible={consentVisible}
        onDecision={async (status) => {
          await setUploadConsent(status)
          setConsentResolved(true)
        }}
      />
      <FeedbackDialog
        visible={feedback.source !== null && !updateVisible && !consentVisible}
        source={feedback.source ?? "profile"}
        onClose={feedback.close}
      />
    </>
  )
}

export function App() {
  const [state, setState] = useState<"loading" | "ready" | "failed" | "headless">("loading")
  const [attempt, setAttempt] = useState(0)
  const [fontsLoaded, fontError] = useFonts(fontsToLoad)
  const { t } = useTranslation()

  useEffect(connectQueryLifecycle, [])

  useEffect(() => {
    let mounted = true

    setState("loading")

    async function bootstrap() {
      await i18nReady

      if (await getIsHeadless()) {
        return "headless" as const
      }

      const data = await migrateData()

      await initI18n(data.settings.locale)
      seedPresets()
      await recoverNativeData()
      mergePushReceipts()

      return "ready" as const
    }

    void bootstrap()
      .then((next) => {
        if (mounted) {
          setState(next)
        }
      })
      .catch((error) => {
        reportError(error, "bootstrap")

        if (mounted) {
          setState("failed")
        }
      })

    return () => {
      mounted = false
    }
  }, [attempt])

  useEffect(() => {
    if (state !== "loading" && (fontsLoaded || fontError)) {
      void SplashScreen.hideAsync()
    }
  }, [state, fontsLoaded, fontError])

  if (state === "headless") {
    return null
  }

  const ready = state === "ready" && (fontsLoaded || fontError)

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        {ready ? (
          <AppProvider>
            <SessionProvider>
              <AppNavigator />
              <AppLifecycle />
            </SessionProvider>
          </AppProvider>
        ) : (
          <View style={styles.startup}>
            {state === "failed" ? (
              <>
                <Text style={styles.title}>{t("startup.title")}</Text>
                <Text style={styles.message}>{t("startup.message")}</Text>
                <Button
                  title={t("startup.retry")}
                  onPress={() => setAttempt((value) => value + 1)}
                />
              </>
            ) : (
              <ActivityIndicator accessibilityLabel={t("startup.loading")} />
            )}
          </View>
        )}
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  startup: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  message: { fontSize: 16, marginBottom: 20 },
})
