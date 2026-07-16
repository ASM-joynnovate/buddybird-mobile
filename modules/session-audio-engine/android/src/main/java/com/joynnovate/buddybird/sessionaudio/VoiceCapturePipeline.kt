package com.joynnovate.buddybird.sessionaudio

import kotlin.math.log10
import kotlin.math.sqrt

class VoiceCapturePipeline(
  private val configuration: NativeSessionConfiguration,
  private val store: PendingCaptureStore,
) {
  var onCaptured: ((NativeCapturedSegment) -> Unit)? = null
  var onFailure: ((Throwable) -> Unit)? = null

  private val pendingSamples = ArrayList<Short>()
  private val ringBuffer = ArrayList<Short>()
  private val segmentSamples = ArrayList<Short>()
  private var aboveMs = 0L
  private var belowMs = 0L
  private var voiceActive = false
  private var speechStartMs = 0L
  private var phase = "learning"
  private var cycle = 1

  @Synchronized
  fun process(samples: ShortArray, count: Int, captureAllowed: Boolean, phase: String, cycle: Int) {
    if (!captureAllowed) {
      flush()
      ringBuffer.clear()
      aboveMs = 0
      return
    }
    this.phase = phase
    this.cycle = cycle
    for (index in 0 until count) pendingSamples += samples[index]
    while (pendingSamples.size >= 1_600) {
      val chunk = ShortArray(1_600) { pendingSamples[it] }
      pendingSamples.subList(0, 1_600).clear()
      processChunk(chunk)
    }
  }

  @Synchronized
  fun flush() {
    if (voiceActive) finalizeSegment(belowMs)
    resetDetection()
  }

  private fun processChunk(chunk: ShortArray) {
    val normalized = normalizedLevel(chunk)
    if (!voiceActive) {
      chunk.forEach { ringBuffer += it }
      val preRollSamples = configuration.vad.preRollMs.toInt() * 16
      if (ringBuffer.size > preRollSamples) ringBuffer.subList(0, ringBuffer.size - preRollSamples).clear()
      aboveMs = if (normalized > configuration.vad.threshold) aboveMs + 100 else 0
      if (aboveMs >= configuration.vad.sustainMs) {
        voiceActive = true
        segmentSamples.addAll(ringBuffer)
        speechStartMs = (segmentSamples.size.toLong() / 16 - aboveMs).coerceAtLeast(0)
        belowMs = 0
      }
      return
    }

    chunk.forEach { segmentSamples += it }
    belowMs = if (normalized <= configuration.vad.threshold) belowMs + 100 else 0
    val durationMs = segmentSamples.size.toLong() / 16
    if (belowMs >= configuration.vad.releaseMs || durationMs >= configuration.vad.maxSegmentMs) {
      finalizeSegment(belowMs)
      resetDetection()
    }
  }

  private fun finalizeSegment(releaseTailMs: Long) {
    if (segmentSamples.isEmpty()) return
    val samples = ShortArray(segmentSamples.size) { segmentSamples[it] }
    val durationMs = samples.size.toLong() / 16
    runCatching {
      store.store(
        samples = samples,
        configuration = configuration,
        phase = phase,
        cycle = cycle,
        speechStartMs = speechStartMs,
        speechEndMs = (durationMs - releaseTailMs).coerceAtLeast(speechStartMs),
      )
    }.onSuccess { onCaptured?.invoke(it) }.onFailure { onFailure?.invoke(it) }
  }

  private fun resetDetection() {
    voiceActive = false
    aboveMs = 0
    belowMs = 0
    speechStartMs = 0
    segmentSamples.clear()
    ringBuffer.clear()
    pendingSamples.clear()
  }

  private fun normalizedLevel(samples: ShortArray): Double {
    val meanSquare = samples.sumOf {
      val normalized = it.toDouble() / Short.MAX_VALUE
      normalized * normalized
    } / samples.size.coerceAtLeast(1)
    val db = if (meanSquare > 0) 20 * log10(sqrt(meanSquare)) else configuration.vad.dbFloor
    val range = configuration.vad.dbCeil - configuration.vad.dbFloor
    return if (range > 0) ((db - configuration.vad.dbFloor) / range).coerceIn(0.0, 1.0) else 0.0
  }
}
