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

// 부제목은 `%{cycle}`·`%{total}` 자리표시자를 담고 있고 Now Playing 을 갱신할 때마다 치환한다.
struct NativeNotificationCopy: Codable {
  let learningSubtitle: String
  let restSubtitle: String
  // BB-380 이전에 저장된 복구 기록에는 없는 필드다. optional 이어야 예전 기록도 디코딩된다.
  let stressCareSubtitle: String?
  let pausedSubtitle: String

  init(_ input: SessionNotificationInput) {
    learningSubtitle = input.learningSubtitle
    restSubtitle = input.restSubtitle
    stressCareSubtitle = input.stressCareSubtitle
    pausedSubtitle = input.pausedSubtitle
  }

  func subtitle(phase: String, cycle: Int, totalCycles: Int) -> String {
    let template: String
    switch phase {
    case "rest": template = restSubtitle
    case "stress-care": template = stressCareSubtitle ?? restSubtitle
    default: template = learningSubtitle
    }
    return template
      .replacingOccurrences(of: "%{cycle}", with: String(cycle))
      .replacingOccurrences(of: "%{total}", with: String(totalCycles))
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
  // BB-380 이전에 저장된 복구 기록에는 없는 필드다. optional 이어야 예전 기록도 디코딩된다.
  let stressCareDurationMs: Int64?
  let stressCareAudioUris: [String]?
  let maxPendingCaptureBytes: Int64
  let vad: NativeVadConfiguration
  let recovery: NativeRecoveryInfo
  // 이 앱 버전 이전에 저장된 복구 기록에는 없는 필드다. optional 이어야 예전 기록도 디코딩된다.
  let notification: NativeNotificationCopy?

  var careDurationMs: Int64 { stressCareDurationMs ?? 0 }
  var careAudioUris: [String] { stressCareAudioUris ?? [] }

  // 마지막 회차는 일부만 진행될 수 있으므로 올림한다 — Now Playing 의 "사이클 2/4" 분모.
  var totalCycles: Int {
    let cycleMs = learningDurationMs + restDurationMs + careDurationMs
    guard cycleMs > 0 else { return 1 }
    return max(1, Int((totalDurationMs + cycleMs - 1) / cycleMs))
  }

  init(_ input: SessionAudioEngineStartInputRecord) {
    sessionId = input.sessionId
    targetAudioUri = input.targetAudioUri
    captureDirectoryUri = input.captureDirectoryUri
    totalDurationMs = Int64(input.totalDurationMs)
    learningDurationMs = Int64(input.learningDurationMs)
    restDurationMs = Int64(input.restDurationMs)
    stressCareDurationMs = Int64(input.stressCareDurationMs)
    stressCareAudioUris = input.stressCareAudioUris
    maxPendingCaptureBytes = Int64(input.maxPendingCaptureBytes)
    vad = NativeVadConfiguration(input.vad)
    recovery = NativeRecoveryInfo(input.recovery)
    notification = NativeNotificationCopy(input.notification)
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
  case audioRouteUnavailable
  case storageUnavailable
  case audioEngineFailed(String)

  var errorDescription: String? {
    switch self {
    case .invalidInput(let message): return message
    case .sessionAlreadyRunning: return "A different training session is already running."
    case .noSession: return "There is no active training session."
    case .permissionDenied: return "Microphone permission is required."
    case .audioSourceUnavailable: return "The target audio file is unavailable."
    case .audioRouteUnavailable: return "The current audio input route is unavailable."
    case .storageUnavailable: return "The capture directory is unavailable."
    case .audioEngineFailed(let message): return message
    }
  }

  // JS `SessionEngineFailureCode` union 과 1:1 — onFailure 이벤트로 나가는 기계 판독용 코드.
  var failureCode: String {
    switch self {
    case .permissionDenied: return "permission-denied"
    case .audioSourceUnavailable: return "audio-source-unavailable"
    case .audioRouteUnavailable: return "audio-route-unavailable"
    case .storageUnavailable: return "storage-unavailable"
    case .invalidInput, .sessionAlreadyRunning, .noSession, .audioEngineFailed: return "audio-engine-failed"
    }
  }
}
