import assert from "node:assert/strict"
import test from "node:test"

import { emptyData } from "@/services/data"
import {
  coalesceIdentity,
  compareVersions,
  consumeFeedbackPrompt,
  countFeedbackDay,
  evaluateUpdate,
  feedbackThreshold,
  newestReceipts,
  parseReleaseNotes,
  shouldCheckUpdate,
  shouldPromptUploadConsent,
  UPDATE_INTERVAL,
  validateFeedback,
} from "@/services/api/policy"
import { firebaseParameters } from "@/services/api/events"
import { audioFile, captureMetadata, codePoints } from "@/services/api/multipart"
import { isMediaReferenced } from "@/services/api/filePolicy"

test("identity reuses native UID, coalesces concurrent sign-in, and retries after failure", async () => {
  let uid: string | null = "restored"
  let calls = 0
  const ensure = coalesceIdentity(
    () => uid,
    async () => {
      calls++
      await Promise.resolve()

      return "new"
    },
  )

  assert.equal(await ensure(), "restored")
  assert.equal(calls, 0)
  uid = null
  assert.deepEqual(await Promise.all([ensure(), ensure(), ensure()]), ["new", "new", "new"])
  assert.equal(calls, 1)
  const failing = coalesceIdentity(
    () => null,
    async () => {
      calls++
      throw Error("offline")
    },
  )

  await assert.rejects(failing())
  await assert.rejects(failing())
  assert.equal(calls, 3)
})
test("update policy accepts compatible versions and forced updates ignore dismissal", () => {
  assert.equal(compareVersions("v1.2", "1.2.0-beta+45"), 0)
  assert.equal(compareVersions("1.2.3.4", "2"), null)
  assert.equal(compareVersions("1.a", "2"), null)
  assert.equal(compareVersions("1.99", "2"), -1)
  const policy = { latestVersion: "2.1", minimumVersion: "2", notes: { en: ["Fix"] } }

  assert.deepEqual(evaluateUpdate(policy, "1", "2.1", "ko"), {
    latestVersion: "2.1",
    forced: true,
    notes: ["Fix"],
  })
  assert.equal(evaluateUpdate(policy, "2", "2.1", "en"), null)
  assert.equal(evaluateUpdate({ ...policy, latestVersion: "" }, "1", null, "en"), null)
  assert.equal(evaluateUpdate({ ...policy, minimumVersion: "broken" }, "1", null, "en"), null)
  assert.deepEqual(parseReleaseNotes('{"ko":[1,"안녕"],"en":false}'), { ko: ["안녕"] })
  assert.deepEqual(parseReleaseNotes("bad"), {})
  assert.equal(shouldCheckUpdate(100, false, 100 + UPDATE_INTERVAL - 1), false)
  assert.equal(shouldCheckUpdate(100, false, 100 + UPDATE_INTERVAL), true)
  assert.equal(shouldCheckUpdate(100, true, 100), true)
})
test("audio consent is independent and denied consent waits thirty cold-start days", () => {
  const now = Date.parse("2026-09-09T00:00:00Z")
  const denied = {
    status: "denied" as const,
    decidedAt: new Date(now - 30 * 86400_000).toISOString(),
    noticeVersion: 1,
  }

  assert.equal(shouldPromptUploadConsent(denied, false, now), false)
  assert.equal(shouldPromptUploadConsent(denied, true, now), true)
  assert.equal(
    shouldPromptUploadConsent(
      { ...denied, decidedAt: new Date(now - 29 * 86400_000).toISOString() },
      true,
      now,
    ),
    false,
  )
  assert.equal(
    shouldPromptUploadConsent({ ...denied, status: "granted", noticeVersion: 99 }, true, now),
    false,
  )
  assert.equal(shouldPromptUploadConsent({ ...denied, decidedAt: null }, false, now), true)
})
test("feedback counts local dates once, consumes prompts, and validates trimmed messages", () => {
  const state = emptyData("en").settings.feedback

  countFeedbackDay(state, "2026-09-01")
  countFeedbackDay(state, "2026-09-01")
  assert.equal(state.dayCount, 1)
  assert.equal(feedbackThreshold(state), 3)
  consumeFeedbackPrompt(state)
  assert.equal(state.dayCount, 0)
  assert.equal(feedbackThreshold(state), 5)
  consumeFeedbackPrompt(state)
  assert.equal(feedbackThreshold(state), 7)
  consumeFeedbackPrompt(state)
  consumeFeedbackPrompt(state)
  assert.equal(feedbackThreshold(state), 10)
  assert.equal(validateFeedback("  Thanks  "), "Thanks")
  assert.throws(() => validateFeedback(" "))
  assert.throws(() => validateFeedback("a".repeat(1001)))
})
test("telemetry uses UTF-16 caps while upload text preserves code points", () => {
  const result = firebaseParameters({
    list: ["a", "b"],
    nil: null,
    bad: Infinity,
    yes: true,
    long: "😀".repeat(60),
  })

  assert.deepEqual(result, { list: "a,b", yes: true, long: "😀".repeat(50) })
  assert.equal(codePoints("😀".repeat(60), 50), "😀".repeat(50))
  assert.deepEqual(audioFile("file:///a/HELLO.WAV?key=1"), { name: "HELLO.WAV", type: "audio/wav" })
  assert.deepEqual(audioFile("file:///"), { name: "reference-audio.m4a", type: "audio/x-m4a" })
})
test("capture metadata retains unknown word identity and frozen profile values", () => {
  const capture = {
    id: "c",
    wordId: "old-word",
    clientWordId: "",
    sessionId: "s",
    cycle: 4,
    phase: "rest" as const,
    capturedAt: "2026-09-09T09:00:00+09:00",
    fileName: "s-c.wav",
    parrotSpecies: "bird",
    parrotBirthdate: "2024-02-03",
    uri: "recording://s-c.wav",
    segments: [],
    sizeBytes: 1,
  }

  assert.throws(
    () => captureMetadata({ ...capture, phase: "stress-care" } as never, "1.1.0"),
    /Only learning and rest/,
  )
  assert.deepEqual(captureMetadata(capture, "1.1.0"), {
    client_capture_id: "c",
    client_word_id: "old-word",
    client_session_id: "s",
    cycle: 4,
    phase: "RE",
    captured_at: "2026-09-09T00:00:00.000Z",
    file_name: "s-c.wav",
    app_version: "1.1.0",
    parrot_species: "bird",
    parrot_birthdate: "2024-02-03",
  })
})
test("file cleanup recognizes historical, shared and rebased media references", () => {
  const data = emptyData("en")

  data.history.session = {
    word: {
      audioUri: "recording://original.m4a",
      transformedAudioUri: "file:///old/recordings/pitched.m4a",
    },
  } as never
  data.sessionDrafts.active = { word: { audioUri: "recording://active.m4a" } } as never
  data.words.deleted = { audioUri: "recording://deleted.m4a", archived: true } as never
  const resolve = (uri: string) =>
    uri.replace("recording://", "file:///new/recordings/").replace("file:///old/", "file:///new/")

  assert.equal(isMediaReferenced(data, "file:///new/recordings/original.m4a", resolve), true)
  assert.equal(isMediaReferenced(data, "recording://pitched.m4a", resolve), true)
  assert.equal(isMediaReferenced(data, "recording://active.m4a", resolve), true)
  assert.equal(isMediaReferenced(data, "recording://deleted.m4a", resolve), false)
  assert.equal(isMediaReferenced(data, "recording://uploaded.wav", resolve), false)
})
test("receipt merge retains newest twenty and is idempotent after interrupted cleanup", () => {
  const receipts = Array.from({ length: 25 }, (_, i) => ({
    messageId: String(i),
    from: null,
    sentTime: null,
    source: "background" as const,
    receivedAt: new Date(i * 1000).toISOString(),
  }))
  const merged = newestReceipts([...receipts, ...receipts])

  assert.equal(merged.length, 20)
  assert.equal(merged[0].messageId, "24")
  assert.equal(merged[19].messageId, "5")
})
