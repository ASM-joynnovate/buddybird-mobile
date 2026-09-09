import assert from "node:assert/strict"
import test from "node:test"

import { customTiming, phaseTotals, presetTiming } from "@/screens/Learning/timing"

test("custom durations retain the verified v1.1.0 phase and partial-cycle contract", () => {
  const cases = [
    [0, 0, 0, 0, 1],
    [1, 30, 15, 15, 1],
    [2, 60, 30, 30, 1],
    [3, 90, 45, 45, 1],
    [4, 120, 60, 60, 1],
    [10, 300, 150, 150, 1],
    [15, 480, 195, 225, 1],
    [20, 600, 300, 300, 1],
    [25, 780, 420, 300, 1],
    [29, 960, 480, 300, 1],
    [30, 480, 195, 225, 2],
    [31, 480, 218, 232, 2],
    [59, 600, 285, 295, 3],
    [1439, 600, 300, 299, 73],
  ]

  for (const [minutes, learning, rest, care, cycles] of cases) {
    const timing = customTiming(minutes)

    assert.deepEqual(timing, {
      totalDurationSeconds: minutes * 60,
      learningDurationSeconds: learning,
      restDurationSeconds: rest,
      stressCareDurationSeconds: care,
    })
    assert.equal(
      Math.max(1, Math.ceil(timing.totalDurationSeconds / (learning + rest + care || 1))),
      cycles,
    )
  }

  assert.deepEqual(phaseTotals(customTiming(1439)), [43212, 21600, 21528])
  assert.deepEqual(phaseTotals(customTiming(30)), [960, 390, 450])
  assert.deepEqual(phaseTotals(presetTiming(80)), [2400, 1200, 1200])

  for (let minutes = 1; minutes <= 1439; minutes++) {
    const timing = customTiming(minutes)

    assert.equal(
      phaseTotals(timing).reduce((sum, phase) => sum + phase, 0),
      minutes * 60,
    )
    assert.ok(
      timing.learningDurationSeconds > 0 &&
        timing.restDurationSeconds > 0 &&
        timing.stressCareDurationSeconds <= 300,
    )
  }

  for (const invalid of [-1, 0.5, 1440, Infinity, NaN]) {
    assert.throws(() => customTiming(invalid))
  }
})
