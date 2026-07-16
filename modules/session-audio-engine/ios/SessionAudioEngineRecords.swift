import ExpoModulesCore

struct SessionVadInput: Record {
  @Field var dbFloor: Double = -60
  @Field var dbCeil: Double = -10
  @Field var threshold: Double = 0.35
  @Field var sustainMs: Double = 300
  @Field var releaseMs: Double = 500
  @Field var preRollMs: Double = 500
  @Field var echoTailGuardMs: Double = 200
  @Field var maxSegmentMs: Double = 30_000
}

struct SessionRecoveryInput: Record {
  @Field var wordId: String = ""
  @Field var word: String = ""
  @Field var sourceType: String = "preset"
  @Field var libraryEntryId: String?
  @Field var startedAt: String = ""
}

struct SessionAudioEngineStartInputRecord: Record {
  @Field var sessionId: String = ""
  @Field var targetAudioUri: String = ""
  @Field var captureDirectoryUri: String = ""
  @Field var totalDurationMs: Double = 0
  @Field var learningDurationMs: Double = 0
  @Field var restDurationMs: Double = 0
  @Field var maxPendingCaptureBytes: Double = 0
  @Field var vad: SessionVadInput = SessionVadInput()
  @Field var recovery: SessionRecoveryInput = SessionRecoveryInput()
}
