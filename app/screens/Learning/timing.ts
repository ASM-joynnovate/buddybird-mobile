import type { SessionSettings } from "@/services/data"

export type Timing = Omit<SessionSettings, "wordId" | "sourceType" | "libraryEntryId">

/** Input/output contract: docs/ui-identifiers.md. The final cycle may be partial. */
export function customTiming(minutes: number): Timing {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1439) {
    throw new Error("Invalid custom minutes")
  }

  const totalDurationSeconds = minutes * 60

  if (minutes === 0) {
    return {
      totalDurationSeconds: 0,
      learningDurationSeconds: 0,
      restDurationSeconds: 0,
      stressCareDurationSeconds: 0,
    }
  }

  const cycleCount = Math.max(1, Math.round(totalDurationSeconds / 1200))
  const cycleDurationSeconds = Math.round(totalDurationSeconds / cycleCount)
  const stressCareDurationSeconds = Math.min(300, Math.floor(cycleDurationSeconds / 4))
  const available = cycleDurationSeconds - stressCareDurationSeconds

  let learningDurationSeconds = Math.max(60, Math.round((available * 2) / 3 / 60) * 60)
  let restDurationSeconds = Math.max(60, available - learningDurationSeconds)

  if (learningDurationSeconds + restDurationSeconds > available) {
    learningDurationSeconds = Math.max(1, Math.round((available * 2) / 3))
    restDurationSeconds = available - learningDurationSeconds
  }

  return {
    totalDurationSeconds,
    learningDurationSeconds,
    restDurationSeconds,
    stressCareDurationSeconds,
  }
}

export function presetTiming(minutes: 40 | 80 | 240): Timing {
  return {
    totalDurationSeconds: minutes * 60,
    learningDurationSeconds: 600,
    restDurationSeconds: 300,
    stressCareDurationSeconds: 300,
  }
}

export function phaseTotals(timing: Timing) {
  const phases = [
    timing.learningDurationSeconds,
    timing.restDurationSeconds,
    timing.stressCareDurationSeconds,
  ]
  const cycleDurationSeconds = phases.reduce((sum, phase) => sum + phase, 0)

  if (!cycleDurationSeconds) {
    return [0, 0, 0]
  }

  const completedCycles = Math.floor(timing.totalDurationSeconds / cycleDurationSeconds)
  let remainingSeconds = timing.totalDurationSeconds % cycleDurationSeconds

  return phases.map((phase) => {
    const partialPhaseSeconds = Math.min(phase, remainingSeconds)

    remainingSeconds -= partialPhaseSeconds

    return completedCycles * phase + partialPhaseSeconds
  })
}
