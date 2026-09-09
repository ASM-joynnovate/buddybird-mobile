import assert from "node:assert/strict"
import { test } from "node:test"

import { emptyData } from "@/services/data"
import { transferNativeState } from "@/services/sessionTransfer"
import type { CapturedSegment, PendingRecovery } from "@modules/session-audio-engine/types"

function harness() {
  let data = emptyData("en")
  let recovery: PendingRecovery | null = {
    sessionId: "sess_transfer",
    recovery: {
      wordId: "word_original",
      word: "Hi",
      sourceType: "recording",
      startedAt: "2026-09-09T00:00:00Z",
      libraryEntryId: "library_original",
    },
    totalDurationMs: 2_400_000,
    learningDurationMs: 600_000,
    restDurationMs: 300_000,
    stressCareDurationMs: 300_000,
    targetAudioUri: "recording://reference.m4a",
    reason: "duration-reached",
    snapshot: {
      sessionId: "sess_transfer",
      state: "completed",
      elapsedRunningMs: 2_400_000,
      cycle: 2,
      phase: "stress-care",
      phaseElapsedMs: 300_000,
      isTargetPlaying: false,
      savedAt: "2026-09-09T00:40:00Z",
      lastPlaybackStartDelayMs: null,
    },
  }
  const segment: CapturedSegment = {
    segmentId: "capture-a",
    sessionId: "sess_transfer",
    uri: "file:///capture-a.wav",
    fileName: "capture-a.wav",
    phase: "learning",
    cycle: 1,
    capturedAt: "2026-09-09T00:01:00Z",
    durationMs: 1000,
    speechStartMs: 200,
    speechEndMs: 900,
  }
  let pending = [segment]
  let writes = 0
  let ackCalls = 0
  let clears = 0
  let failWrite = 0
  let failAck = false
  let failClear = false
  const native = {
    getSnapshot: async () => recovery!.snapshot,
    getPendingRecovery: async () => recovery,
    getUnstoredSegments: async () => [...pending],
    markSegmentsStored: async (ids: string[]) => {
      ackCalls++

      for (const id of ids) {
        assert.ok(
          data.captures[id] || data.nativeCaptureReceipts.includes(id),
          "ACK must follow durable capture storage",
        )
      }

      if (failAck) {
        throw new Error("ACK failed")
      }

      pending = pending.filter((segment) => !ids.includes(segment.segmentId))
    },
    clearPendingRecovery: async (id: string) => {
      clears++
      assert.ok(data.history[id], "clear must follow durable history")

      if (failClear) {
        throw new Error("clear failed")
      }

      recovery = null
    },
  }
  const store = {
    read: () => JSON.parse(JSON.stringify(data)) as typeof data,
    update: (change: (next: typeof data) => void) => {
      const next = store.read()

      change(next)

      if (++writes === failWrite) {
        throw new Error("write failed")
      }

      data = next

      return next
    },
    fileSize: () => 32044,
  }

  return {
    native,
    store,
    segment,
    get data() {
      return data
    },
    get pending() {
      return pending
    },
    get recovery() {
      return recovery
    },
    get ackCalls() {
      return ackCalls
    },
    get clears() {
      return clears
    },
    failWrite: (value: number) => {
      failWrite = value
    },
    failAck: (value: boolean) => {
      failAck = value
    },
    failClear: (value: boolean) => {
      failClear = value
    },
    addSegment: (value: CapturedSegment) => pending.push(value),
  }
}

test("capture save failure retains manifest and recovery; retry transfers once", async () => {
  const h = harness()

  h.failWrite(1)
  await assert.rejects(transferNativeState(h.native, h.store), /write failed/)
  assert.equal(h.ackCalls, 0)
  assert.equal(h.pending.length, 1)
  assert.ok(h.recovery)
  h.failWrite(0)
  await transferNativeState(h.native, h.store)
  assert.equal(Object.keys(h.data.captures).length, 1)
  assert.equal(h.data.progress.word_original.sessionCount, 1)
  assert.equal(h.recovery, null)
})

test("ACK retry cannot resurrect a capture uploaded after its durable save", async () => {
  const h = harness()

  h.failAck(true)
  await assert.rejects(transferNativeState(h.native, h.store), /ACK failed/)
  assert.equal(h.data.sessionDrafts.sess_transfer.captureCount, 1)
  h.store.update((data) => {
    delete data.captures["capture-a"]
  })
  h.failAck(false)
  await transferNativeState(h.native, h.store)
  assert.equal(Object.keys(h.data.captures).length, 0)
  assert.equal(h.pending.length, 0)
  assert.equal(h.data.progress.word_original.sessionCount, 1)
})

test("history write and native clear failures preserve recoverability without double credit", async () => {
  const failedWrite = harness()

  failedWrite.failWrite(3)
  await assert.rejects(transferNativeState(failedWrite.native, failedWrite.store), /write failed/)
  assert.equal(failedWrite.pending.length, 0)
  assert.equal(failedWrite.clears, 0)
  assert.ok(failedWrite.recovery)
  failedWrite.failWrite(0)
  await transferNativeState(failedWrite.native, failedWrite.store)
  assert.equal(failedWrite.data.progress.word_original.sessionCount, 1)
  const failedClear = harness()

  failedClear.failClear(true)
  await assert.rejects(transferNativeState(failedClear.native, failedClear.store), /clear failed/)
  assert.equal(failedClear.data.progress.word_original.sessionCount, 1)
  failedClear.failClear(false)
  await transferNativeState(failedClear.native, failedClear.store)
  assert.equal(failedClear.data.progress.word_original.sessionCount, 1)
  assert.equal(failedClear.data.progress.word_original.totalTrainingSeconds, 1200)
})

test("completion flush during ACK transfers its last segment before clearing history context", async () => {
  const h = harness()
  const original = h.native.markSegmentsStored
  let first = true

  h.native.markSegmentsStored = async (ids) => {
    await original(ids)

    if (first) {
      first = false
      h.addSegment({ ...h.segment, segmentId: "capture-b", fileName: "capture-b.wav" })
    }
  }

  await transferNativeState(h.native, h.store)
  assert.equal(Object.keys(h.data.captures).length, 2)
  assert.equal(h.pending.length, 0)
  assert.equal(h.recovery, null)
})

test("unrecoverable orphan capture remains native-owned and is never ACKed", async () => {
  const h = harness()

  h.native.getUnstoredSegments = async () => [{ ...h.segment, sessionId: "unknown_session" }]
  await assert.rejects(transferNativeState(h.native, h.store), /context unavailable/)
  assert.equal(h.ackCalls, 0)
  assert.equal(h.clears, 0)
})
