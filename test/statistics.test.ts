import assert from "node:assert/strict"
import { test } from "node:test"

import { emptyData, History } from "@/services/data"
import { ageMonths, profileStats } from "@/services/statistics"

test("profile statistics count learning, local days and month boundaries", () => {
  const data = emptyData("ko")
  const base: History = {
    id: "a",
    wordId: "w",
    sourceType: "recording",
    word: { label: "hi", sourceType: "recording", audioUri: "recording://a.wav" },
    totalDurationSeconds: 120,
    learningDurationSeconds: 60,
    restDurationSeconds: 30,
    stressCareDurationSeconds: 30,
    completedCycles: 1,
    totalLearningSeconds: 60,
    startedAt: new Date(2026, 8, 8, 23, 55).toISOString(),
    endedAt: new Date(2026, 8, 9, 0, 1).toISOString(),
  }

  data.history.a = base
  data.history.b = {
    ...base,
    id: "b",
    startedAt: new Date(2026, 8, 8, 12).toISOString(),
    endedAt: new Date(2026, 8, 8, 12, 2).toISOString(),
  }
  data.progress.w = {
    wordId: "w",
    totalTrainingSeconds: 120,
    sessionCount: 2,
    updatedAt: base.endedAt!,
  }
  const result = profileStats(data, new Date(2026, 8, 9, 10))

  assert.equal(result.todaySeconds, 60)
  assert.equal(result.totalSeconds, 120)
  assert.equal(result.streakDays, 2)
  assert.equal(profileStats(data, new Date(2026, 8, 10, 10)).streakDays, 2)
  assert.equal(profileStats(data, new Date(2026, 8, 11, 10)).streakDays, 0)
  assert.equal(ageMonths("2025-09-10", new Date(2026, 8, 9)), 11)
  assert.equal(ageMonths(null), null)
})
