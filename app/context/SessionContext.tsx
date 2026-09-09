import {
  createContext,
  useCallback,
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { AppState } from "react-native"
import i18next from "i18next"

import { SessionInput, SessionSnapshot } from "@modules/session-audio-engine"
import { SessionSettings } from "@/services/data"
import { engine, recoverNativeData, startSession } from "@/services/session"
import { readData } from "@/services/storage"
import { createPerformanceReporter, reportError, track } from "@/services/telemetry"
import { isUploading, triggerUploads } from "@/services/uploads"

type Timing = Omit<SessionSettings, "wordId" | "sourceType" | "libraryEntryId">

const idle: SessionSnapshot = {
  sessionId: null,
  state: "idle",
  elapsedRunningMs: 0,
  cycle: 1,
  phase: "learning",
  phaseElapsedMs: 0,
  isTargetPlaying: false,
  savedAt: "",
  lastPlaybackStartDelayMs: null,
}

type SessionValue = {
  snapshot: SessionSnapshot
  error: Error | null
  start(wordId: string, settings: Timing): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  stop(): Promise<void>
  retryRecovery(): Promise<void>
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState(idle)
  const [error, setError] = useState<Error | null>(null)

  const latestSnapshot = useRef(snapshot)
  const performanceReporter = useRef<ReturnType<typeof createPerformanceReporter> | null>(null)

  const applySnapshot = useCallback((next: SessionSnapshot) => {
    latestSnapshot.current = next
    setSnapshot(next)
  }, [])

  const recordSessionError = useCallback((cause: unknown) => {
    const error = cause instanceof Error ? cause : new Error("Session unavailable")

    setError(error)
    reportError(error, "session")

    return error
  }, [])

  const reconcileSessionData = useCallback(async () => {
    try {
      await recoverNativeData()

      // Saving recovery does not resolve a failed native audio start.
      if (latestSnapshot.current.state !== "failed") {
        setError(null)
      }
    } catch (cause) {
      throw recordSessionError(cause)
    }
  }, [recordSessionError])

  useEffect(() => {
    void engine.getSnapshot().then(applySnapshot).catch(recordSessionError)

    const state = engine.addListener("onStateChanged", (next) => {
      applySnapshot(next)

      if (["completed", "failed", "idle"].includes(next.state)) {
        void reconcileSessionData()
          .then(() => triggerUploads("session_end"))
          .catch(() => {})
      }
    })

    const progress = engine.addListener("onProgress", (next) => {
      applySnapshot(next)

      if (next.lastPlaybackStartDelayMs !== null) {
        performanceReporter.current?.audioDelay(next.lastPlaybackStartDelayMs)
      }
    })

    const capture = engine.addListener("onSegmentCaptured", () => {
      void reconcileSessionData()
        .then(() => triggerUploads("accumulation"))
        .catch(() => {})
    })

    const failure = engine.addListener("onFailure", (value) => {
      recordSessionError(new Error(value.message))
    })

    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void engine.getSnapshot().then(applySnapshot).catch(recordSessionError)
        void reconcileSessionData().catch(() => {})
      } else if (
        state === "background" &&
        latestSnapshot.current.sessionId &&
        latestSnapshot.current.state === "running"
      ) {
        track("training_session_backgrounded", {
          session_id: latestSnapshot.current.sessionId,
          phase: latestSnapshot.current.phase,
          elapsed_seconds: latestSnapshot.current.elapsedRunningMs / 1000,
        })
      }
    })

    return () => {
      state.remove()
      progress.remove()
      capture.remove()
      failure.remove()
      appState.remove()
      performanceReporter.current?.stop()
    }
  }, [recordSessionError, applySnapshot, reconcileSessionData])

  const active = ["starting", "running", "paused", "interrupted", "stopping"].includes(
    snapshot.state,
  )

  useEffect(() => {
    if (!active) {
      performanceReporter.current?.stop()
      performanceReporter.current = null
    }
  }, [active])

  async function runSessionCommand(action: () => Promise<SessionSnapshot>) {
    try {
      const next = await action()

      applySnapshot(next)

      if (next.state === "failed") {
        throw new Error("Native audio command failed")
      }

      setError(null)
    } catch (cause) {
      throw recordSessionError(cause)
    }
  }

  async function start(wordId: string, settings: Timing) {
    const notification: SessionInput["notification"] = {
      learningSubtitle: i18next.t("session.notificationLearning"),
      restSubtitle: i18next.t("session.notificationRest"),
      stressCareSubtitle: i18next.t("session.notificationCare"),
      pausedSubtitle: i18next.t("session.notificationPaused"),
    }

    await runSessionCommand(() => startSession(wordId, settings, notification))
    const next = latestSnapshot.current

    if (next.sessionId) {
      const data = readData()
      const draft = data.sessionDrafts[next.sessionId]
      const profile = data.profile

      if (draft && profile) {
        track("training_session_started", {
          session_id: next.sessionId,
          word_count: 1,
          target_word_ids: [draft.settings.wordId],
          target_word_names: [draft.word.label],
          profile_age_days: Math.max(
            0,
            Math.floor((Date.now() - Date.parse(profile.createdAt)) / 86400_000),
          ),
          parrot_species: profile.species,
          parrot_name: profile.name,
        })
        track("word_selected", {
          session_id: next.sessionId,
          word_id: draft.settings.wordId,
          word_name: draft.word.label,
          source: "list",
        })
        const progress = data.progress[draft.settings.wordId]

        track("word_practice_started", {
          session_id: next.sessionId,
          word_id: draft.settings.wordId,
          word_name: draft.word.label,
          attempt_number: 1,
          cumulative_practice_count: progress?.sessionCount ?? 0,
          cumulative_practice_duration_ms: (progress?.totalTrainingSeconds ?? 0) * 1000,
        })
      }

      performanceReporter.current?.stop()
      performanceReporter.current = createPerformanceReporter(next.sessionId, () => ({
        duringUpload: isUploading(),
        consentStatus: readData().settings.uploadConsent.status,
      }))
    }
  }

  const value: SessionValue = {
    snapshot,
    error,
    start,
    pause: () => runSessionCommand(() => engine.pause()),
    resume: () => runSessionCommand(() => engine.resume()),
    stop: async () => {
      await runSessionCommand(() => engine.stop())
      await reconcileSessionData()
      await triggerUploads("session_end")
      performanceReporter.current?.stop()
    },
    retryRecovery: reconcileSessionData,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const value = useContext(SessionContext)

  if (!value) {
    throw new Error("SessionProvider missing")
  }

  return value
}
