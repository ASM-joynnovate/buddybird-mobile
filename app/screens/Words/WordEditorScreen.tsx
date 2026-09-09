import { useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from "react-native"
import { useNavigation, usePreventRemove } from "@react-navigation/native"
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio"
import { File } from "expo-file-system"
import { useTranslation } from "react-i18next"

import { useAppData } from "@/context/AppContext"
import { Word } from "@/services/data"
import { saveWord } from "@/services/library"
import { reportError, setUserProperties, track } from "@/services/telemetry"
import { queueWordUpload } from "@/services/uploads"
import { Button, Chip, Copy, IconButton, InlineError, Screen, Title, ui } from "@/components/ui"
import { colors, font } from "@/theme"

const categories: Word["tag"][] = ["greeting", "food", "name", "etc"]
const recordingOptions = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true }

export function WordEditorScreen() {
  const { t } = useTranslation()
  const data = useAppData()
  const navigation = useNavigation()

  const [label, setLabel] = useState("")
  const [category, setCategory] = useState<Word["tag"]>("greeting")
  const [recorded, setRecorded] = useState<{ uri: string; duration: number } | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const inFlight = useRef(false)
  const elapsedMilliseconds = useRef(0)
  const retryCount = useRef(0)
  const finishedRecordingUri = useRef<string | null>(null)

  const player = useAudioPlayer(null)
  const playerStatus = useAudioPlayerStatus(player)
  const recorder = useAudioRecorder(recordingOptions, (status) => {
    if (status.hasError) {
      setError(t("words.recordingError"))
    } else if (status.isFinished && status.url) {
      finishRecording(status.url, elapsedMilliseconds.current)
    }
  })
  const recordingState = useAudioRecorderState(recorder, 200)

  elapsedMilliseconds.current = recordingState.durationMillis

  usePreventRemove(busy, () => {})

  useEffect(() => {
    if (!recordingState.isRecording && recordingState.mediaServicesDidReset) {
      setError(t("words.recordingError"))
    }
  }, [recordingState.isRecording, recordingState.mediaServicesDidReset, t])

  useEffect(() => {
    if (saved && !busy) {
      navigation.goBack()
    }
  }, [saved, busy, navigation])

  function finishRecording(uri: string, milliseconds: number) {
    if (finishedRecordingUri.current === uri) {
      return
    }

    finishedRecordingUri.current = uri
    const duration = Math.min(60_000, Math.max(0, milliseconds))

    setRecorded({ uri, duration })

    track("word_recording_finished", {
      word_name: label.trim(),
      recording_duration_ms: duration,
      retry_count: retryCount.current,
    })
  }

  async function toggleRecording() {
    if (inFlight.current) {
      return
    }

    inFlight.current = true
    setBusy(true)
    setError(null)

    try {
      player.pause()

      if (recordingState.isRecording) {
        const duration = recorder.getStatus().durationMillis

        await recorder.stop()

        if (recorder.uri) {
          finishRecording(recorder.uri, duration)
        }
      } else {
        const permission = await AudioModule.requestRecordingPermissionsAsync()

        if (!permission.granted) {
          setError(t("words.microphoneDenied"))

          return
        }

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          interruptionMode: "doNotMix",
          shouldPlayInBackground: false,
          allowsBackgroundRecording: false,
        })
        await recorder.prepareToRecordAsync()

        if (finishedRecordingUri.current) {
          retryCount.current++
        }

        setRecorded(null)
        elapsedMilliseconds.current = 0
        recorder.record({ forDuration: 60 })
        track("word_recording_started", { word_name: label.trim() })
      }
    } catch {
      setError(t("words.recordingError"))
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  async function preview() {
    if (!recorded) {
      return
    }

    try {
      if (playerStatus.playing) {
        player.pause()

        return
      }

      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: "doNotMix",
      })
      player.replace({ uri: recorded.uri })
      player.play()
    } catch {
      setError(t("words.playbackError"))
    }
  }

  async function save() {
    if (inFlight.current || recordingState.isRecording || !label.trim() || !recorded) {
      return
    }

    inFlight.current = true
    setBusy(true)
    setError(null)

    try {
      player.pause()
      const word = await saveWord({ label, tag: category, recordingUri: recorded.uri })

      void queueWordUpload(word.id).catch((error) => reportError(error, "word-upload"))

      track("word_added", {
        word_id: word.id,
        word_name: word.label,
        category,
        registration_method: "voice_recording",
        recording_duration_ms: recorded.duration,
        audio_size_bytes: new File(recorded.uri).size,
      })
      setUserProperties({
        total_words_registered:
          Object.values(data.words).filter(
            (item) => !item.archived && item.sourceType === "recording",
          ).length + 1,
      })

      // Navigation waits until the save guard is released on the next render.
      setSaved(true)
    } catch {
      setError(t("words.saveError"))
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  const seconds = Math.floor(recordingState.durationMillis / 1000)
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`

  const meteringAmplitude = Math.max(12, 40 + (recordingState.metering ?? -40))
  const saveDisabled = !label.trim() || !recorded || recordingState.isRecording

  let recordingStatusText: string

  if (recordingState.isRecording) {
    recordingStatusText = t("words.recordingTime", { time: clock })
  } else if (recorded) {
    recordingStatusText = t("words.recorded")
  } else {
    recordingStatusText = t("words.tapToRecord")
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen>
        <View style={styles.header}>
          <IconButton
            icon="back"
            label={t("common.back")}
            onPress={() => navigation.goBack()}
            disabled={busy}
          />
          <Copy style={styles.headerText}>{t("words.editTitle")}</Copy>
        </View>

        <Title>{t("words.recordTitle")}</Title>
        <Copy style={ui.subtitle}>{t("words.recordHint")}</Copy>

        <Copy style={ui.label}>{t("words.label")}</Copy>
        <TextInput
          testID="word-name"
          accessibilityLabel={t("words.label")}
          value={label}
          onChangeText={setLabel}
          editable={!busy && !recordingState.isRecording}
          placeholder={t("words.labelHint")}
          placeholderTextColor={colors.muted}
          style={ui.input}
        />

        <Copy style={[ui.label, ui.section]}>{t("words.category")}</Copy>
        <View style={ui.wrap}>
          {categories.map((item) => (
            <Chip
              key={item}
              testID={`word-category-${item}`}
              label={t(`categories.${item}`)}
              selected={category === item}
              onPress={() => setCategory(item)}
            />
          ))}
        </View>

        <View style={styles.recordingCard}>
          <Copy style={styles.targetLabel}>{t("words.target")}</Copy>
          <Copy style={styles.target}>
            {label.trim() ? `“${label.trim()}”` : t("words.newWord")}
          </Copy>
          <View style={styles.waveform} accessibilityElementsHidden importantForAccessibility="no">
            {Array.from({ length: 23 }, (_, index) => (
              <View
                key={index}
                style={[
                  styles.wave,
                  {
                    height: recordingState.isRecording
                      ? 8 + Math.abs(Math.sin(index * 1.4 + seconds)) * meteringAmplitude
                      : 6 + (index % 3) * 3,
                    backgroundColor: recordingState.isRecording ? colors.orange : colors.border,
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.recordButton}>
            <IconButton
              testID="word-record"
              icon={recordingState.isRecording ? "stop" : "mic"}
              label={t(recordingState.isRecording ? "words.stopRecording" : "words.record")}
              onPress={() => void toggleRecording()}
              disabled={busy}
              style={styles.microphone}
              color="#3c2600"
            />
            {busy ? <ActivityIndicator style={styles.busy} color={colors.text} /> : null}
          </View>
          <Copy accessibilityLiveRegion="polite" style={styles.recordingStatus}>
            {recordingStatusText}
          </Copy>
        </View>

        {recorded && !recordingState.isRecording ? (
          <View style={[ui.card, styles.review]}>
            <IconButton
              testID="word-review-play"
              icon={playerStatus.playing ? "pause" : "play"}
              label={t("words.listen")}
              onPress={() => void preview()}
            />
            <View>
              <Copy>{t("words.listen")}</Copy>
              <Copy style={styles.original}>{t("words.original")}</Copy>
            </View>
          </View>
        ) : null}

        <InlineError message={error} />
        <View style={styles.actions}>
          <Button
            label={t("common.cancel")}
            variant="secondary"
            disabled={busy}
            onPress={() => navigation.goBack()}
            style={styles.cancel}
          />
          <Button
            testID="word-save"
            label={t("words.addToTraining")}
            loading={busy}
            disabled={saveDisabled}
            onPress={() => void save()}
            style={styles.save}
          />
        </View>
      </Screen>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginLeft: -8, marginBottom: 10 },
  headerText: { fontFamily: font.extraBold, fontSize: 16 },
  recordingCard: { alignItems: "center", paddingTop: 34, paddingBottom: 22 },
  targetLabel: { fontSize: 15, color: colors.muted },
  target: { fontFamily: font.black, fontSize: 32, textAlign: "center", marginTop: 12 },
  waveform: {
    height: 60,
    marginVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  wave: { width: 5, borderRadius: 3 },
  recordButton: { position: "relative" },
  microphone: {
    width: 82,
    height: 82,
    borderRadius: 42,
    backgroundColor: colors.orange,
    borderBottomWidth: 5,
    borderColor: colors.orangeDark,
  },
  busy: { position: "absolute", right: -18, top: 25 },
  recordingStatus: {
    color: colors.muted,
    fontSize: 15,
    textAlign: "center",
    marginTop: 18,
    lineHeight: 23,
  },
  review: { flexDirection: "row", alignItems: "center", gap: 12 },
  original: { color: colors.muted, fontSize: 14, marginTop: 5 },
  actions: { flexDirection: "row", gap: 10, marginTop: 28 },
  cancel: { flex: 1 },
  save: { flex: 2 },
})
