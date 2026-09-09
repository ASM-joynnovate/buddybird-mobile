package com.joynnovate.buddybird.sessionaudio

import org.junit.Assert.*
import org.junit.Test

class NativeCoreCheck {
    @Test
    fun timingSpeechAndRecovery() {
        assertEquals(
            PhasePosition(2, "stress-care", 300000.0),
            sessionPosition(2400000.0, 2400000.0, 600000.0, 300000.0, 300000.0),
        )
        assertEquals(
            PhasePosition(1, "learning", 600000.0),
            sessionPosition(600000.0, 600000.0, 600000.0, 300000.0, 0.0),
        )
        assertEquals(
            PhasePosition(1, "rest", 0.0),
            sessionPosition(600000.0, 2400000.0, 600000.0, 300000.0, 300000.0),
        )
        val loud = ShortArray(1600) { 16000 }
        val quiet = ShortArray(1600)
        val detector = SpeechDetector(VADSettings())
        repeat(2) { assertNull(detector.consume(quiet)) }
        repeat(3) { assertNull(detector.consume(loud)) }
        repeat(4) { assertNull(detector.consume(quiet)) }
        val segment = detector.consume(quiet)!!
        assertEquals(1000, segment.durationMs)
        assertEquals(200, segment.speechStartMs)
        assertEquals(500, segment.speechEndMs)
        repeat(2) { detector.consume(quiet) }
        repeat(97) { assertNull(detector.consume(loud)) }
        val ceiling = detector.consume(loud)!!
        assertEquals(10000, ceiling.durationMs)
        assertEquals(200, ceiling.speechStartMs)
        assertEquals(10000, ceiling.speechEndMs)
        repeat(3) { detector.consume(loud) }
        assertEquals(0, detector.flush()!!.speechStartMs)
        repeat(2) { detector.consume(quiet) }
        repeat(96) { assertNull(detector.consume(loud)) }
        assertNull(detector.consume(quiet))
        val tailCeiling = detector.consume(quiet)!!
        assertEquals(9800, tailCeiling.speechEndMs)
        val exactThreshold = SpeechDetector(VADSettings(threshold = 1.0))
        repeat(10) { assertNull(exactThreshold.consume(ShortArray(1600) { Short.MAX_VALUE })) }
        assertNull(exactThreshold.flush())
        val wav = waveData(segment.samples)
        assertEquals(32044, wav.size)
        assertEquals("RIFF", String(wav.copyOfRange(0, 4), Charsets.US_ASCII))
        val identity =
            mapOf(
                "wordId" to "word-test",
                "word" to "hello",
                "sourceType" to "recording",
                "startedAt" to "2026-09-01T08:00:00Z",
            )
        val legacy =
            mapOf(
                "sessionId" to "sess_test",
                "recovery" to identity,
                "targetAudioUri" to "file:///recordings/test.m4a",
                "totalDurationMs" to 2400000,
                "learningDurationMs" to 600000,
                "restDurationMs" to 300000,
                "snapshot" to
                    mapOf("elapsedRunningMs" to 615000, "savedAt" to "2026-09-01T08:10:15Z"),
            )
        val recovery = recoveredSession(legacy)
        assertEquals(0.0, recovery["stressCareDurationMs"])
        assertEquals("failed", (recovery["snapshot"] as Map<*, *>)["state"])
        assertEquals(false, (recovery["snapshot"] as Map<*, *>)["isTargetPlaying"])
        val complete = recoveredSession(legacy + ("reason" to "duration-reached"))
        assertEquals("completed", (complete["snapshot"] as Map<*, *>)["state"])
        assertEquals(
            "task-removed",
            recoveredSession(legacy + ("reason" to "task-removed"))["reason"],
        )
        try {
            recoveredSession(legacy + ("recovery" to (identity - "sourceType")))
            fail("Missing sourceType must retain malformed recovery")
        } catch (_: EngineFailure) {}
        try {
            recoveredSession(legacy + ("stressCareDurationMs" to null))
            fail("Only absent care has the historical zero default")
        } catch (_: EngineFailure) {}
    }
}
