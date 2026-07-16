import Foundation

struct NativeRecoveryInfo: Codable {
  let wordId: String
  let word: String
  let sourceType: String
  let libraryEntryId: String?
  let startedAt: String

  init(_ input: SessionRecoveryInput) {
    wordId = input.wordId
    word = input.word
    sourceType = input.sourceType
    libraryEntryId = input.libraryEntryId
    startedAt = input.startedAt
  }

  var dictionary: [String: Any?] {
    [
      "wordId": wordId,
      "word": word,
      "sourceType": sourceType,
      "libraryEntryId": libraryEntryId,
      "startedAt": startedAt
    ]
  }
}

struct NativeVadConfiguration: Codable {
  let dbFloor: Double
  let dbCeil: Double
  let threshold: Double
  let sustainMs: Int64
  let releaseMs: Int64
  let preRollMs: Int64
  let echoTailGuardMs: Int64
  let maxSegmentMs: Int64

  init(_ input: SessionVadInput) {
    dbFloor = input.dbFloor
    dbCeil = input.dbCeil
    threshold = input.threshold
    sustainMs = Int64(input.sustainMs)
    releaseMs = Int64(input.releaseMs)
    preRollMs = Int64(input.preRollMs)
    echoTailGuardMs = Int64(input.echoTailGuardMs)
    maxSegmentMs = Int64(input.maxSegmentMs)
  }
}

struct NativeSessionConfiguration: Codable {
  let sessionId: String
  let targetAudioUri: String
  let captureDirectoryUri: String
  let totalDurationMs: Int64
  let learningDurationMs: Int64
  let restDurationMs: Int64
  let maxPendingCaptureBytes: Int64
  let vad: NativeVadConfiguration
  let recovery: NativeRecoveryInfo

  init(_ input: SessionAudioEngineStartInputRecord) {
    sessionId = input.sessionId
    targetAudioUri = input.targetAudioUri
    captureDirectoryUri = input.captureDirectoryUri
    totalDurationMs = Int64(input.totalDurationMs)
    learningDurationMs = Int64(input.learningDurationMs)
    restDurationMs = Int64(input.restDurationMs)
    maxPendingCaptureBytes = Int64(input.maxPendingCaptureBytes)
    vad = NativeVadConfiguration(input.vad)
    recovery = NativeRecoveryInfo(input.recovery)
  }
}

struct NativeCapturedSegment: Codable {
  let segmentId: String
  let sessionId: String
  let uri: String
  let fileName: String
  let phase: String
  let cycle: Int
  let capturedAt: String
  let durationMs: Int64
  let speechStartMs: Int64
  let speechEndMs: Int64

  var dictionary: [String: Any] {
    [
      "segmentId": segmentId,
      "sessionId": sessionId,
      "uri": uri,
      "fileName": fileName,
      "phase": phase,
      "cycle": cycle,
      "capturedAt": capturedAt,
      "durationMs": durationMs,
      "speechStartMs": speechStartMs,
      "speechEndMs": speechEndMs
    ]
  }
}

struct PersistedSessionRecord: Codable {
  let configuration: NativeSessionConfiguration
  var elapsedRunningMs: Int64
  var cycle: Int
  var phase: String
  var phaseElapsedMs: Int64
  var savedAt: String
  var reason: String?
}

enum SessionAudioEngineError: LocalizedError {
  case invalidInput(String)
  case sessionAlreadyRunning
  case noSession
  case permissionDenied
  case audioSourceUnavailable
  case storageUnavailable
  case audioEngineFailed(String)

  var errorDescription: String? {
    switch self {
    case .invalidInput(let message): return message
    case .sessionAlreadyRunning: return "A different training session is already running."
    case .noSession: return "There is no active training session."
    case .permissionDenied: return "Microphone permission is required."
    case .audioSourceUnavailable: return "The target audio file is unavailable."
    case .storageUnavailable: return "The capture directory is unavailable."
    case .audioEngineFailed(let message): return message
    }
  }
}
