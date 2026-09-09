import {
  getAnalytics,
  logEvent,
  setAnalyticsCollectionEnabled,
  setUserId,
  setUserProperties as firebaseProperties,
} from "@react-native-firebase/analytics"
import {
  getCrashlytics,
  recordError,
  setAttributes,
  setCrashlyticsCollectionEnabled,
  setUserId as crashUser,
} from "@react-native-firebase/crashlytics"
import {
  getTrackingPermissionsAsync,
  requestTrackingPermissionsAsync,
} from "expo-tracking-transparency"
import * as Clarity from "react-native-clarity"
import { Platform } from "react-native"

import { config } from "@/config"
import type { AnalyticsConsent } from "@/services/data"
import {
  firebaseParameters,
  sendTelemetrySafely,
  type Events,
  type UserProperties,
} from "@/services/api/events"
import { updateData } from "@/services/storage"

export type { Events, UserProperties } from "@/services/api/events"
let permitted = false
let replayPaused = false
let clarityStarted = false
let identity: string | null = null
let currentScreen: string | null = null

function syncReplay() {
  if (clarityStarted) {
    void sendTelemetrySafely(() =>
      !permitted || replayPaused ? Clarity.pause() : Clarity.resume(),
    )
  }
}

/** OS permission is authoritative; a saved grant never enables collection by itself. */
export async function initializeTelemetry(requestATT = true): Promise<AnalyticsConsent> {
  permitted = false
  await Promise.all([
    setAnalyticsCollectionEnabled(getAnalytics(), false),
    setCrashlyticsCollectionEnabled(getCrashlytics(), false),
  ])
  syncReplay()
  let consent: AnalyticsConsent = "not_applicable"

  if (Platform.OS === "ios") {
    let permission = await getTrackingPermissionsAsync()

    if (requestATT && permission.status === "undetermined") {
      permission = await requestTrackingPermissionsAsync()
    }

    consent = permission.status === "granted" ? "granted" : "denied"
  }

  updateData((data) => {
    data.settings.analyticsConsent = consent
  })
  permitted = consent === "granted" || consent === "not_applicable"
  await Promise.all([
    setAnalyticsCollectionEnabled(getAnalytics(), permitted),
    setCrashlyticsCollectionEnabled(getCrashlytics(), permitted),
  ])

  if (permitted && !clarityStarted && config.clarityProjectId.trim()) {
    Clarity.setOnSessionStartedCallback(() => {
      syncReplay()

      const uid = identity

      if (permitted && uid) {
        void sendTelemetrySafely(() => Clarity.setCustomUserId(uid))
      }
    })
    clarityStarted = true
    Clarity.initialize(config.clarityProjectId)
  }

  syncReplay()

  if (identity) {
    setTelemetryIdentity(identity)
  }

  return consent
}

export function setTelemetryIdentity(uid: string) {
  identity = uid

  if (!permitted) {
    return
  }

  void sendTelemetrySafely(() => setUserId(getAnalytics(), uid))
  void sendTelemetrySafely(() => crashUser(getCrashlytics(), uid))

  if (clarityStarted) {
    void sendTelemetrySafely(() => Clarity.setCustomUserId(uid))
  }
}

export function setSessionReplayPaused(paused: boolean) {
  replayPaused = paused
  syncReplay()
}

export function track<K extends keyof Events>(name: K, payload: Events[K]) {
  if (!permitted) {
    return
  }

  void sendTelemetrySafely(() =>
    logEvent(getAnalytics(), name.slice(0, 40), firebaseParameters(payload)),
  )

  if (!clarityStarted) {
    return
  }

  void sendTelemetrySafely(() => Clarity.sendCustomEvent(name))

  for (const [key, value] of Object.entries(payload)) {
    if (value == null || (typeof value === "number" && !Number.isFinite(value))) {
      continue
    }

    void sendTelemetrySafely(() =>
      Clarity.setCustomTag(
        `${name}.${key}`,
        Array.isArray(value) ? value.join(",") : String(value),
      ),
    )
  }
}

export function screen(
  name:
    | "onboarding_welcome"
    | "onboarding_profile"
    | "session_setup"
    | "words"
    | "profile"
    | "session_active",
  screenClass = name,
) {
  currentScreen = name
  track("screen_view", { screen_name: name, screen_class: screenClass })
}

export function setUserProperties(properties: UserProperties) {
  if (!permitted) {
    return
  }

  const strings = Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [key, value == null ? null : String(value)]),
  )

  void sendTelemetrySafely(() => firebaseProperties(getAnalytics(), strings))
  const attributes = Object.fromEntries(
    Object.entries(strings).filter((entry): entry is [string, string] => entry[1] !== null),
  )

  void sendTelemetrySafely(() => setAttributes(getCrashlytics(), attributes))

  if (clarityStarted) {
    for (const [key, value] of Object.entries(attributes)) {
      void sendTelemetrySafely(() => Clarity.setCustomTag(key, value))
    }
  }
}

export function reportError(error: unknown, scope: string, fatal?: boolean) {
  if (!permitted) {
    return
  }

  const value = error instanceof Error ? error : new Error("UnknownError")
  const context: Record<string, string> = { scope }

  if (currentScreen) {
    context.screen_name = currentScreen
  }

  if (fatal !== undefined) {
    context.is_fatal = String(fatal)
  }

  void sendTelemetrySafely(() =>
    setAttributes(getCrashlytics(), context).then(() => recordError(getCrashlytics(), value)),
  )
  track("app_error", {
    error_code: error instanceof Error ? error.name : "UnknownError",
    screen_name: currentScreen,
  })
}

export function installGlobalErrorReporting() {
  type Handler = (error: Error, fatal?: boolean) => void
  const errors = (
    globalThis as typeof globalThis & {
      ErrorUtils?: { getGlobalHandler: () => Handler; setGlobalHandler: (handler: Handler) => void }
    }
  ).ErrorUtils
  const previous = errors?.getGlobalHandler()
  const handler: Handler = (error, fatal) => {
    reportError(error, "uncaught", fatal)
    previous?.(error, fatal)
  }

  errors?.setGlobalHandler(handler)
  // Preserve React Native's own reporting after recording rejection context.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Native rejection hooks have no public typed entry.
  const rejection = require("react-native/Libraries/promiseRejectionTrackingOptions").default as {
    onUnhandled: (id: number, error: unknown) => void
  }
  const previousRejection = rejection.onUnhandled

  rejection.onUnhandled = (id, error) => {
    reportError(error, "unhandled_rejection", false)
    previousRejection(id, error)
  }

  const hermes = (
    globalThis as typeof globalThis & {
      HermesInternal?: { enablePromiseRejectionTracker?: (options: typeof rejection) => void }
    }
  ).HermesInternal
  const enableTracking = () => {
    if (hermes?.enablePromiseRejectionTracker) {
      hermes.enablePromiseRejectionTracker(rejection)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- Match React Native's fallback promise tracker.
      require("promise/setimmediate/rejection-tracking").enable(rejection)
    }
  }

  enableTracking()

  return () => {
    if (previous && errors?.getGlobalHandler() === handler) {
      errors.setGlobalHandler(previous)
    }

    rejection.onUnhandled = previousRejection
    enableTracking()
  }
}

export function createPerformanceReporter(
  sessionId: string,
  state: () => { duringUpload: boolean; consentStatus: "unknown" | "granted" | "denied" },
) {
  const samples = {
    audio_delay: { count: 0, time: -Infinity },
    ui_lag: { count: 0, time: -Infinity },
  }
  const report = (kind: "audio_delay" | "ui_lag", milliseconds: number) => {
    const sample = samples[kind]
    const now = Date.now()

    if (milliseconds <= 200 || sample.count >= 20 || now - sample.time < 5000) {
      return
    }

    sample.count++
    sample.time = now
    const current = state()

    track("session_perf_degraded", {
      kind,
      value_ms: milliseconds,
      during_upload: current.duringUpload,
      session_id: sessionId,
      consent_status: current.consentStatus,
    })
  }

  let last = Date.now()
  const timer = setInterval(() => {
    const now = Date.now()

    report("ui_lag", now - last - 100)
    last = now
  }, 100)

  return {
    audioDelay: (milliseconds: number) => report("audio_delay", milliseconds),
    stop: () => clearInterval(timer),
  }
}
