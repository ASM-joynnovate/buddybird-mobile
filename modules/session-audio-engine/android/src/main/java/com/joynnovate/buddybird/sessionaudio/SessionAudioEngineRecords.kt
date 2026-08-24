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

class SessionNotificationInput : Record {
  @Field var learningSubtitle: String = ""
  @Field var restSubtitle: String = ""
  @Field var stressCareSubtitle: String = ""
  @Field var pausedSubtitle: String = ""
}

class SessionAudioEngineStartInputRecord : Record {
  @Field var sessionId: String = ""
  @Field var targetAudioUri: String = ""
  @Field var captureDirectoryUri: String = ""
  @Field var totalDurationMs: Double = 0.0
  @Field var learningDurationMs: Double = 0.0
  @Field var restDurationMs: Double = 0.0
  @Field var stressCareDurationMs: Double = 0.0
  @Field var stressCareAudioUris: List<String> = emptyList()
  @Field var maxPendingCaptureBytes: Double = 0.0
  @Field var vad: SessionVadInput = SessionVadInput()
  @Field var recovery: SessionRecoveryInput = SessionRecoveryInput()
  @Field var notification: SessionNotificationInput = SessionNotificationInput()
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

// 부제목은 `%{cycle}`·`%{total}` 자리표시자를 담고 있고 알림을 다시 그릴 때마다 치환한다.
data class NativeNotificationCopy(
  val learningSubtitle: String,
  val restSubtitle: String,
  val stressCareSubtitle: String,
  val pausedSubtitle: String,
) {
  fun subtitle(phase: String, cycle: Int, totalCycles: Int): String =
    when (phase) {
      "rest" -> restSubtitle
      // iOS 와 달리 fallback 이 없다 — Android 는 copy 를 복구 기록에 영속하지 않고 항상
      // 살아있는 start 입력에서 받으므로 구버전 기록 경로가 존재하지 않는다.
      "stress-care" -> stressCareSubtitle
      else -> learningSubtitle
    }
      .replace("%{cycle}", cycle.toString())
      .replace("%{total}", totalCycles.toString())
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
  val stressCareDurationMs: Long,
  val stressCareAudioUris: List<String>,
  val maxPendingCaptureBytes: Long,
  val vad: NativeVadConfiguration,
  val recovery: NativeRecoveryInfo,
  val notification: NativeNotificationCopy,
) {
  // 마지막 회차는 일부만 진행될 수 있으므로 올림한다 — 알림의 "사이클 2/4" 분모.
  val totalCycles: Int
    get() {
      val cycleMs = learningDurationMs + restDurationMs + stressCareDurationMs
      if (cycleMs <= 0) return 1
      return maxOf(1, ((totalDurationMs + cycleMs - 1) / cycleMs).toInt())
    }

  companion object {
    fun from(input: SessionAudioEngineStartInputRecord) = NativeSessionConfiguration(
      sessionId = input.sessionId,
      targetAudioUri = input.targetAudioUri,
      captureDirectoryUri = input.captureDirectoryUri,
      totalDurationMs = input.totalDurationMs.toLong(),
      learningDurationMs = input.learningDurationMs.toLong(),
      restDurationMs = input.restDurationMs.toLong(),
      stressCareDurationMs = input.stressCareDurationMs.toLong(),
      stressCareAudioUris = input.stressCareAudioUris,
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
      notification = NativeNotificationCopy(
        learningSubtitle = input.notification.learningSubtitle,
        restSubtitle = input.notification.restSubtitle,
        stressCareSubtitle = input.notification.stressCareSubtitle,
        pausedSubtitle = input.notification.pausedSubtitle,
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
