package com.joynnovate.buddybird.sessionaudio

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class SessionVadInput : Record {
  @Field var dbFloor: Double = -60.0
  @Field var dbCeil: Double = -10.0
  @Field var threshold: Double = 0.35
  @Field var sustainMs: Double = 300.0
  @Field var releaseMs: Double = 500.0
  @Field var preRollMs: Double = 500.0
  @Field var echoTailGuardMs: Double = 200.0
  @Field var maxSegmentMs: Double = 30_000.0
}

class SessionRecoveryInput : Record {
  @Field var wordId: String = ""
  @Field var word: String = ""
  @Field var sourceType: String = "preset"
  @Field var libraryEntryId: String? = null
  @Field var startedAt: String = ""
}

class SessionAudioEngineStartInputRecord : Record {
  @Field var sessionId: String = ""
  @Field var targetAudioUri: String = ""
  @Field var captureDirectoryUri: String = ""
  @Field var totalDurationMs: Double = 0.0
  @Field var learningDurationMs: Double = 0.0
  @Field var restDurationMs: Double = 0.0
  @Field var maxPendingCaptureBytes: Double = 0.0
  @Field var vad: SessionVadInput = SessionVadInput()
  @Field var recovery: SessionRecoveryInput = SessionRecoveryInput()
}

data class NativeRecoveryInfo(
  val wordId: String,
  val word: String,
  val sourceType: String,
  val libraryEntryId: String?,
  val startedAt: String,
) {
  fun toMap(): Map<String, Any?> = mapOf(
    "wordId" to wordId,
    "word" to word,
    "sourceType" to sourceType,
    "libraryEntryId" to libraryEntryId,
    "startedAt" to startedAt,
  )
}

data class NativeVadConfiguration(
  val dbFloor: Double,
  val dbCeil: Double,
  val threshold: Double,
  val sustainMs: Long,
  val releaseMs: Long,
  val preRollMs: Long,
  val echoTailGuardMs: Long,
  val maxSegmentMs: Long,
)

data class NativeSessionConfiguration(
  val sessionId: String,
  val targetAudioUri: String,
  val captureDirectoryUri: String,
  val totalDurationMs: Long,
  val learningDurationMs: Long,
  val restDurationMs: Long,
  val maxPendingCaptureBytes: Long,
  val vad: NativeVadConfiguration,
  val recovery: NativeRecoveryInfo,
) {
  companion object {
    fun from(input: SessionAudioEngineStartInputRecord) = NativeSessionConfiguration(
      sessionId = input.sessionId,
      targetAudioUri = input.targetAudioUri,
      captureDirectoryUri = input.captureDirectoryUri,
      totalDurationMs = input.totalDurationMs.toLong(),
      learningDurationMs = input.learningDurationMs.toLong(),
      restDurationMs = input.restDurationMs.toLong(),
      maxPendingCaptureBytes = input.maxPendingCaptureBytes.toLong(),
      vad = NativeVadConfiguration(
        dbFloor = input.vad.dbFloor,
        dbCeil = input.vad.dbCeil,
        threshold = input.vad.threshold,
        sustainMs = input.vad.sustainMs.toLong(),
        releaseMs = input.vad.releaseMs.toLong(),
        preRollMs = input.vad.preRollMs.toLong(),
        echoTailGuardMs = input.vad.echoTailGuardMs.toLong(),
        maxSegmentMs = input.vad.maxSegmentMs.toLong(),
      ),
      recovery = NativeRecoveryInfo(
        wordId = input.recovery.wordId,
        word = input.recovery.word,
        sourceType = input.recovery.sourceType,
        libraryEntryId = input.recovery.libraryEntryId,
        startedAt = input.recovery.startedAt,
      ),
    )
  }
}

data class NativeCapturedSegment(
  val segmentId: String,
  val sessionId: String,
  val uri: String,
  val fileName: String,
  val phase: String,
  val cycle: Int,
  val capturedAt: String,
  val durationMs: Long,
  val speechStartMs: Long,
  val speechEndMs: Long,
) {
  fun toMap(): Map<String, Any?> = mapOf(
    "segmentId" to segmentId,
    "sessionId" to sessionId,
    "uri" to uri,
    "fileName" to fileName,
    "phase" to phase,
    "cycle" to cycle,
    "capturedAt" to capturedAt,
    "durationMs" to durationMs,
    "speechStartMs" to speechStartMs,
    "speechEndMs" to speechEndMs,
  )
}
