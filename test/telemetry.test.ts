import assert from "node:assert/strict"
import test from "node:test"

import { sendTelemetrySafely } from "@/services/api/events"

test("SDK validation errors and rejected telemetry requests do not interrupt app work", async () => {
  await sendTelemetrySafely(() => {
    throw new Error("Reserved Firebase event name")
  })
  await sendTelemetrySafely(() => Promise.reject(new Error("Telemetry offline")))

  let sent = false

  await sendTelemetrySafely(() => {
    sent = true
  })
  assert.equal(sent, true)
})
