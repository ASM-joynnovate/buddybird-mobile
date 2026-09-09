import assert from "node:assert/strict"
import { test } from "node:test"

import type { PendingRecovery } from "@modules/session-audio-engine/types"
import { emptyData } from "@/services/data"
import { creditRecovery, learningSeconds } from "@/services/sessionHistory"

function recovery(elapsed: number, reason: PendingRecovery["reason"]): PendingRecovery {
  return {
    sessionId: "sess_fixture",
    recovery: {
      wordId: "original-word-id",
      word: "Historical label",
      sourceType: "recording",
      startedAt: "2026-09-09T00:00:00Z",
      libraryEntryId: "original-library-id",
    },
    totalDurationMs: 2_400_000,
    learningDurationMs: 600_000,
    restDurationMs: 300_000,
    stressCareDurationMs: 300_000,
    targetAudioUri: "recording://old.wav",
    reason,
    snapshot: {
      sessionId: "sess_fixture",
      state: "failed",
      elapsedRunningMs: elapsed,
      cycle: 1,
      phase: "learning",
      phaseElapsedMs: elapsed,
      isTargetPlaying: false,
      savedAt: "2026-09-09T00:40:00Z",
      lastPlaybackStartDelayMs: null,
    },
  }
}

test("native recovery credits exact IDs once, excludes pauses and preserves immutable historical identity", () => {
  const data = emptyData("ko")

  assert.equal(creditRecovery(data, recovery(299_999, "failure")), undefined)
  assert.equal(Object.keys(data.history).length, 0)
  const saved = creditRecovery(data, recovery(900_000, "user-stopped"))!

  assert.equal(saved.totalLearningSeconds, 600)
  assert.equal(saved.wordId, "original-word-id")
  assert.equal(saved.libraryEntryId, "original-library-id")
  assert.equal(saved.word.label, "Historical label")
  assert.equal(saved.word.audioUri, "recording://old.wav")
  creditRecovery(data, recovery(900_000, "user-stopped"))
  assert.equal(data.progress["original-word-id"].sessionCount, 1)
  assert.equal(data.progress["original-word-id"].totalTrainingSeconds, 600)
})

test("natural short completion counts and exact cycle boundaries have no extra empty cycle credit", () => {
  const short = recovery(30_000, "duration-reached")

  short.totalDurationMs = 30_000
  assert.equal(creditRecovery(emptyData("en"), short)?.totalLearningSeconds, 30)
  const full = creditRecovery(emptyData("en"), recovery(2_400_000, "duration-reached"))!

  assert.equal(full.completedCycles, 2)
  assert.equal(full.totalLearningSeconds, 1200)
  assert.equal(learningSeconds(9_000_000, full), 1200)
})
