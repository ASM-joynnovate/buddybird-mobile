package com.joynnovate.buddybird.sessionaudio

import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.*

class EngineFailure(val code: String, override val message: String) : Exception(message)

data class PhasePosition(val cycle: Int, val phase: String, val elapsed: Double)

fun sessionPosition(
    elapsed: Double,
    total: Double,
    learning: Double,
    rest: Double,
    care: Double,
): PhasePosition {
    val elapsedRunningMs = elapsed.coerceIn(0.0, total)
    val cycleDurationMs = learning + rest + care
    val fullCycles = (elapsedRunningMs / cycleDurationMs).toInt()
    val inside = elapsedRunningMs % cycleDurationMs
    if (elapsedRunningMs >= total && inside == 0.0) {
        return PhasePosition(max(1, fullCycles), if (care > 0) "stress-care" else "rest", if (care > 0) care else rest)
    }
    if (inside < learning) return PhasePosition(fullCycles + 1, "learning", inside)
    val afterLearning = inside - learning
    return if (afterLearning < rest || care == 0.0) PhasePosition(fullCycles + 1, "rest", afterLearning)
        else PhasePosition(fullCycles + 1, "stress-care", afterLearning - rest)
}

data class VADSettings(
    val dbFloor: Double = -60.0,
    val dbCeil: Double = -10.0,
    val threshold: Double = 0.35,
    val sustainMs: Int = 300,
    val releaseMs: Int = 500,
    val preRollMs: Int = 500,
    val echoTailGuardMs: Int = 200,
    val maxSegmentMs: Int = 10000,
) {
    fun validate() {
        if (
            !dbFloor.isFinite() ||
                !dbCeil.isFinite() ||
                dbFloor >= dbCeil ||
                !threshold.isFinite() ||
                threshold !in 0.0..1.0 ||
                sustainMs !in 100..60000 ||
                releaseMs !in 100..60000 ||
                preRollMs !in 0..60000 ||
                echoTailGuardMs !in 0..60000 ||
                maxSegmentMs < preRollMs + sustainMs ||
                maxSegmentMs > 60000 ||
                listOf(sustainMs, releaseMs, preRollMs, maxSegmentMs).any { it % 100 != 0 }
        ) {
            throw EngineFailure("audio-engine-failed", "Invalid VAD calibration")
        }
    }
}

data class SpeechAudio(val samples: ShortArray, val speechStartMs: Int, val speechEndMs: Int) {
    val durationMs: Int
        get() = samples.size / 16
}

class SpeechDetector(private val settings: VADSettings) {
    private var preRollSamples = ShortArray(0)
    private var onsetSamples = ShortArray(0)
    private val segmentSamples = ShortArray(settings.maxSegmentMs * 16)
    private var segmentSampleCount = 0

    private var speechStartMs = 0
    private var quietTailMs = 0

    fun consume(samples: ShortArray): SpeechAudio? {
        require(samples.size == 1600)

        val rms = sqrt(samples.sumOf { (it / 32768.0).pow(2) } / samples.size)
        val decibels = 20 * log10(max(rms, 0.000000001))
        val normalizedLevel =
            ((decibels - settings.dbFloor) / (settings.dbCeil - settings.dbFloor)).coerceIn(
                0.0,
                1.0,
            )
        val isAboveThreshold = normalizedLevel > settings.threshold

        if (segmentSampleCount == 0) {
            if (isAboveThreshold) {
                onsetSamples += samples

                if (onsetSamples.size / 16 >= settings.sustainMs) {
                    val retained = (preRollSamples + onsetSamples).takeLast(settings.preRollMs * 16).toShortArray()
                    speechStartMs = max(0, retained.size / 16 - settings.sustainMs)
                    retained.copyInto(segmentSamples)
                    segmentSampleCount = retained.size
                    preRollSamples = ShortArray(0)
                    onsetSamples = ShortArray(0)
                }
            } else {
                preRollSamples += onsetSamples + samples
                onsetSamples = ShortArray(0)

                if (preRollSamples.size > settings.preRollMs * 16) {
                    preRollSamples =
                        preRollSamples.copyOfRange(
                            preRollSamples.size - settings.preRollMs * 16,
                            preRollSamples.size,
                        )
                }
            }
        } else {
            samples.copyInto(segmentSamples, segmentSampleCount)
            segmentSampleCount += samples.size
            quietTailMs =
                if (isAboveThreshold) {
                    0
                } else {
                    quietTailMs + 100
                }
        }

        return if (
            segmentSampleCount > 0 &&
                (segmentSampleCount / 16 >= settings.maxSegmentMs ||
                    quietTailMs >= settings.releaseMs)
        ) {
            flush()
        } else {
            null
        }
    }

    fun flush(): SpeechAudio? {
        val durationMs = segmentSampleCount / 16
        val clampedSpeechStartMs = min(speechStartMs, durationMs)
        val output =
            if (segmentSampleCount == 0) {
                null
            } else {
                SpeechAudio(
                    segmentSamples.copyOf(segmentSampleCount),
                    clampedSpeechStartMs,
                    max(clampedSpeechStartMs, durationMs - quietTailMs),
                )
            }
        reset()

        return output
    }

    fun reset() {
        preRollSamples = ShortArray(0)
        onsetSamples = ShortArray(0)
        segmentSampleCount = 0

        speechStartMs = 0
        quietTailMs = 0
    }
}

fun waveData(samples: ShortArray): ByteArray {
    val output = ByteBuffer.allocate(44 + samples.size * 2).order(ByteOrder.LITTLE_ENDIAN)

    output
        .put("RIFF".toByteArray(Charsets.US_ASCII))
        .putInt(samples.size * 2 + 36)
        .put("WAVEfmt ".toByteArray(Charsets.US_ASCII))

    output.putInt(16)
    output.putShort(1)
    output.putShort(1)
    output.putInt(16000)
    output.putInt(32000)
    output.putShort(2)
    output.putShort(16)

    output.put("data".toByteArray(Charsets.US_ASCII)).putInt(samples.size * 2)

    samples.forEach { output.putShort(it) }

    return output.array()
}

fun isoNow(): String =
    java.text
        .SimpleDateFormat("yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'", java.util.Locale.US)
        .apply { timeZone = java.util.TimeZone.getTimeZone("UTC") }
        .format(java.util.Date())

fun recoveredSession(record: Map<String, Any?>): Map<String, Any?> {
    fun malformed(): Nothing =
        throw EngineFailure(
            "storage-unavailable",
            "Malformed session recovery; original bytes retained",
        )

    fun requiredNumber(key: String): Double =
        (record[key] as? Number)?.toDouble()?.takeIf { it.isFinite() } ?: malformed()

    val recoveryMetadata = record["recovery"] as? Map<*, *> ?: malformed()
    if (
        listOf("wordId", "word", "startedAt").any {
            (recoveryMetadata[it] as? String).isNullOrEmpty()
        } || recoveryMetadata["sourceType"] !in listOf("preset", "recording")
    ) {
        malformed()
    }

    val sessionId = record["sessionId"] as? String ?: malformed()
    val targetAudioUri = record["targetAudioUri"] as? String ?: malformed()
    val totalDurationMs = requiredNumber("totalDurationMs")
    val learningDurationMs = requiredNumber("learningDurationMs")
    val restDurationMs = requiredNumber("restDurationMs")
    val stressCareDurationMs =
        if (record.containsKey("stressCareDurationMs")) {
            requiredNumber("stressCareDurationMs")
        } else {
            0.0
        }

    val savedSnapshot = record["snapshot"] as? Map<*, *> ?: malformed()
    val elapsedRunningMs = (savedSnapshot["elapsedRunningMs"] as? Number)?.toDouble() ?: malformed()
    val savedAt = savedSnapshot["savedAt"] as? String ?: malformed()
    if (
        sessionId.isEmpty() ||
            !validDurations(
                totalDurationMs,
                learningDurationMs,
                restDurationMs,
                stressCareDurationMs,
            ) ||
            elapsedRunningMs < 0 ||
            !elapsedRunningMs.isFinite()
    ) {
        malformed()
    }

    val playbackCount =
        if (!savedSnapshot.containsKey("targetPlaybackCount")) 0.0
        else (savedSnapshot["targetPlaybackCount"] as? Number)?.toDouble() ?: malformed()
    if (!playbackCount.isFinite() || playbackCount < 0 || playbackCount > Int.MAX_VALUE || playbackCount % 1.0 != 0.0) malformed()

    val reason = record["reason"] as? String
    val phasePosition =
        sessionPosition(
            elapsedRunningMs,
            totalDurationMs,
            learningDurationMs,
            restDurationMs,
            stressCareDurationMs,
        )
    val state =
        if (reason == "duration-reached") {
            "completed"
        } else {
            "failed"
        }

    val snapshot =
        mapOf(
            "sessionId" to sessionId,
            "state" to state,
            "elapsedRunningMs" to min(totalDurationMs, elapsedRunningMs),
            "cycle" to phasePosition.cycle,
            "phase" to phasePosition.phase,
            "phaseElapsedMs" to phasePosition.elapsed,
            "savedAt" to savedAt,
            "isTargetPlaying" to false,
            "lastPlaybackStartDelayMs" to null,
            "targetPlaybackCount" to playbackCount.toInt(),
            "failure" to (savedSnapshot["failure"] as? Map<*, *>),
        )

    return mapOf(
        "sessionId" to sessionId,
        "recovery" to recoveryMetadata,
        "targetAudioUri" to targetAudioUri,
        "totalDurationMs" to totalDurationMs,
        "learningDurationMs" to learningDurationMs,
        "restDurationMs" to restDurationMs,
        "stressCareDurationMs" to stressCareDurationMs,
        "snapshot" to snapshot,
        "reason" to reason,
    )
}

fun validDurations(total: Double, learning: Double, rest: Double, care: Double): Boolean =
    listOf(total, learning, rest, care).all { it.isFinite() && it in 0.0..31536000000.0 } &&
        total >= 1 &&
        learning >= 1 &&
        total / (learning + rest + care) <= Int.MAX_VALUE
