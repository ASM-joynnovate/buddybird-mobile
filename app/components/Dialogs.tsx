import { PropsWithChildren, useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native"
import { useTranslation } from "react-i18next"
import { useMutation } from "@tanstack/react-query"

import { useAppData } from "@/context/AppContext"
import { feedbackMutationOptions } from "@/services/api/firebase"
import { track } from "@/services/telemetry"
import { colors, font } from "@/theme"
import { Button, Copy, InlineError, Title, ui } from "@/components/ui"

function Dialog({
  visible,
  onClose,
  title,
  children,
}: PropsWithChildren<{ visible: boolean; onClose(): void; title: string }>) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <View accessibilityViewIsModal style={styles.dialog}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <Title style={styles.title}>{title}</Title>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export function AudioConsentDialog({
  visible,
  onDecision,
}: {
  visible: boolean
  onDecision(status: "granted" | "denied"): Promise<void> | void
}) {
  const { t } = useTranslation()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function decide(status: "granted" | "denied") {
    if (busy) {
      return
    }

    setBusy(true)
    setError(false)

    try {
      await onDecision(status)
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog visible={visible} onClose={() => {}} title={t("consent.title")}>
      <Copy style={styles.body}>{t("consent.body")}</Copy>
      <InlineError message={error ? t("consent.error") : null} />

      <View style={styles.actions}>
        <Button
          testID="audio-consent-decline"
          label={t("consent.decline")}
          variant="secondary"
          disabled={busy}
          onPress={() => void decide("denied")}
          style={styles.action}
        />
        <Button
          testID="audio-consent-accept"
          label={t("consent.accept")}
          loading={busy}
          onPress={() => void decide("granted")}
          style={styles.action}
        />
      </View>
    </Dialog>
  )
}

export function UpdateDialog({
  visible,
  latestVersion,
  notes,
  forced,
  onAccept,
  onDismiss,
  pending = false,
}: {
  visible: boolean
  latestVersion: string
  notes: string[]
  forced: boolean
  onAccept(): Promise<void> | void
  onDismiss(): void
  pending?: boolean
}) {
  const { t } = useTranslation()

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const blocked = busy || pending

  async function accept() {
    setBusy(true)
    setError(false)

    try {
      await onAccept()
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  function dismiss() {
    if (!forced && !blocked) {
      onDismiss()
    }
  }

  return (
    <Dialog
      visible={visible}
      onClose={dismiss}
      title={t(forced ? "update.required" : "update.title")}
    >
      <Copy style={styles.body}>
        {t(forced ? "update.requiredBody" : "update.body", { version: latestVersion })}
      </Copy>
      {notes.map((note, index) => (
        <Copy key={`${index}-${note}`} style={styles.note}>
          {note}
        </Copy>
      ))}
      <InlineError message={error ? t("update.error") : null} />

      <View style={styles.actions}>
        {!forced ? (
          <Button
            testID="update-later"
            label={t("update.later")}
            variant="secondary"
            disabled={blocked}
            onPress={onDismiss}
            style={styles.action}
          />
        ) : null}
        <Button
          testID="update-open-store"
          label={t("update.accept")}
          loading={blocked}
          onPress={() => void accept()}
          style={styles.action}
        />
      </View>
    </Dialog>
  )
}

export function FeedbackDialog({
  visible,
  source,
  onClose,
  onSubmitted,
}: {
  visible: boolean
  source: "profile" | "prompt"
  onClose(): void
  onSubmitted?(): void
}) {
  const { t } = useTranslation()
  const data = useAppData()

  const [message, setMessage] = useState("")
  const mutation = useMutation(feedbackMutationOptions())

  function close() {
    if (mutation.isPending) {
      return
    }

    mutation.reset()
    setMessage("")
    onClose()
  }

  function submit() {
    mutation.mutate(
      { message: message.trim(), locale: data.settings.locale },
      {
        onSuccess: () => {
          track("feedback_submitted", { source, message_length: message.trim().length })
          setMessage("")
          onSubmitted?.()
          onClose()
          Alert.alert(t("feedback.sent"))
        },
      },
    )
  }

  return (
    <Dialog visible={visible} onClose={close} title={t("feedback.title")}>
      <TextInput
        testID="feedback-message"
        accessibilityLabel={t("feedback.title")}
        value={message}
        onChangeText={setMessage}
        maxLength={1000}
        multiline
        editable={!mutation.isPending}
        textAlignVertical="top"
        placeholder={t("feedback.placeholder")}
        placeholderTextColor={colors.muted}
        style={[ui.input, styles.message]}
      />
      <Copy style={styles.privacy}>{t("feedback.privacy")}</Copy>
      <InlineError message={mutation.isError ? t("feedback.error") : null} />

      <View style={styles.actions}>
        <Button
          label={t("common.cancel")}
          variant="secondary"
          disabled={mutation.isPending}
          onPress={close}
          style={styles.action}
        />
        <Button
          testID="feedback-send"
          label={t("feedback.send")}
          icon="send"
          disabled={!message.trim()}
          loading={mutation.isPending}
          onPress={submit}
          style={styles.action}
        />
      </View>
    </Dialog>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
    padding: 20,
  },
  dialog: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    borderRadius: 24,
    backgroundColor: colors.background,
  },
  content: { padding: 22 },
  title: { fontSize: 26, lineHeight: 33, marginBottom: 22 },
  body: { fontSize: 17, lineHeight: 27 },
  actions: { flexDirection: "row", gap: 12, marginTop: 26 },
  action: { flex: 1 },
  note: { marginTop: 12, lineHeight: 24 },
  message: { height: 160, fontFamily: font.bold, fontSize: 17, lineHeight: 26 },
  privacy: { fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: 12 },
})
