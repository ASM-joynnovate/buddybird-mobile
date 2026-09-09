import Foundation

struct EngineFailure: Error, LocalizedError {
  let code: String
  let message: String

  var errorDescription: String? { message }

  init(_ code: String, _ message: String) {
    self.code = code
    self.message = message
  }
}

struct PhasePosition {
  let cycle: Int
  let phase: String
  let elapsed: Double
}

func sessionPosition(elapsed: Double, total: Double, learning: Double, rest: Double, care: Double)
  -> PhasePosition
{
  let elapsedRunningMs = min(max(0, elapsed), total)
  let cycleDurationMs = learning + rest + care
  let isCompleted = elapsedRunningMs >= total
  let cycle: Int
  if isCompleted && elapsedRunningMs > 0 {
    cycle = Int(ceil(elapsedRunningMs / cycleDurationMs))
  } else {
    cycle = Int(floor(elapsedRunningMs / cycleDurationMs)) + 1
  }

  var phaseElapsedMs = elapsedRunningMs - Double(cycle - 1) * cycleDurationMs
  for (phase, durationMs) in [("learning", learning), ("rest", rest), ("stress-care", care)]
  where durationMs > 0 {
    if phaseElapsedMs < durationMs || (isCompleted && phaseElapsedMs <= durationMs) {
      return PhasePosition(cycle: cycle, phase: phase, elapsed: phaseElapsedMs)
    }

    phaseElapsedMs -= durationMs
  }

  return PhasePosition(cycle: cycle, phase: "learning", elapsed: 0)
}

struct VADSettings: Codable {
  var dbFloor: Double = -60
  var dbCeil: Double = -10
  var threshold: Double = 0.35
  var sustainMs: Int = 300
  var releaseMs: Int = 500
  var preRollMs: Int = 500
  var echoTailGuardMs: Int = 200
  var maxSegmentMs: Int = 10000

  func validate() throws {
    guard dbFloor.isFinite, dbCeil.isFinite, dbFloor < dbCeil, threshold.isFinite,
      (0...1).contains(threshold), (100...60000).contains(sustainMs),
      (100...60000).contains(releaseMs), (0...60000).contains(preRollMs),
      (0...60000).contains(echoTailGuardMs), maxSegmentMs >= preRollMs + sustainMs,
      maxSegmentMs <= 60000,
      [sustainMs, releaseMs, preRollMs, maxSegmentMs].allSatisfy({ $0 % 100 == 0 })
    else {
      throw EngineFailure("audio-engine-failed", "Invalid VAD calibration")
    }
  }
}

struct SpeechAudio {
  let samples: [Int16]
  let speechStartMs: Int
  let speechEndMs: Int

  var durationMs: Int { samples.count / 16 }
}

// Receives exactly 100 ms of 16 kHz mono PCM. No overlap is carried across WAVs.
final class SpeechDetector {
  let settings: VADSettings

  private var preRollSamples: [Int16] = []
  private var onsetSamples: [Int16] = []
  private var segmentSamples: [Int16] = []

  private var speechStartMs = 0
  private var quietTailMs = 0

  init(_ settings: VADSettings) {
    self.settings = settings
  }

  func consume(_ samples: [Int16]) -> SpeechAudio? {
    precondition(samples.count == 1600)

    let squaredAmplitudeSum = samples.reduce(0.0) { $0 + pow(Double($1) / 32768, 2) }
    let decibels = 20 * log10(max(sqrt(squaredAmplitudeSum / Double(samples.count)), 0.000000001))
    let normalizedLevel = min(
      1, max(0, (decibels - settings.dbFloor) / (settings.dbCeil - settings.dbFloor)))
    let isAboveThreshold = normalizedLevel > settings.threshold

    if segmentSamples.isEmpty {
      if isAboveThreshold {
        onsetSamples += samples

        if onsetSamples.count / 16 >= settings.sustainMs {
          speechStartMs = preRollSamples.count / 16
          segmentSamples = preRollSamples + onsetSamples
          preRollSamples.removeAll(keepingCapacity: true)
          onsetSamples.removeAll(keepingCapacity: true)
        }
      } else {
        preRollSamples += onsetSamples + samples
        onsetSamples.removeAll(keepingCapacity: true)

        if preRollSamples.count > settings.preRollMs * 16 {
          preRollSamples.removeFirst(preRollSamples.count - settings.preRollMs * 16)
        }
      }
    } else {
      segmentSamples += samples
      quietTailMs = isAboveThreshold ? 0 : quietTailMs + 100
    }

    if !segmentSamples.isEmpty
      && (segmentSamples.count / 16 >= settings.maxSegmentMs || quietTailMs >= settings.releaseMs)
    {
      return flush()
    }

    return nil
  }

  func flush() -> SpeechAudio? {
    defer { reset() }

    guard !segmentSamples.isEmpty else {
      return nil
    }

    let durationMs = segmentSamples.count / 16
    let clampedSpeechStartMs = min(speechStartMs, durationMs)

    return SpeechAudio(
      samples: segmentSamples, speechStartMs: clampedSpeechStartMs,
      speechEndMs: max(clampedSpeechStartMs, durationMs - quietTailMs))
  }

  func reset() {
    preRollSamples.removeAll(keepingCapacity: true)
    onsetSamples.removeAll(keepingCapacity: true)
    segmentSamples.removeAll(keepingCapacity: true)

    speechStartMs = 0
    quietTailMs = 0
  }
}

func waveData(_ samples: [Int16]) -> Data {
  var data = Data()

  func writeASCII(_ text: String) {
    data.append(contentsOf: text.utf8)
  }

  func writeUInt16(_ value: UInt16) {
    var littleEndianValue = value.littleEndian
    withUnsafeBytes(of: &littleEndianValue) { data.append(contentsOf: $0) }
  }

  func writeUInt32(_ value: UInt32) {
    var littleEndianValue = value.littleEndian
    withUnsafeBytes(of: &littleEndianValue) { data.append(contentsOf: $0) }
  }

  writeASCII("RIFF")
  writeUInt32(UInt32(samples.count * 2 + 36))
  writeASCII("WAVEfmt ")

  writeUInt32(16)
  writeUInt16(1)
  writeUInt16(1)
  writeUInt32(16000)
  writeUInt32(32000)
  writeUInt16(2)
  writeUInt16(16)

  writeASCII("data")
  writeUInt32(UInt32(samples.count * 2))

  for sample in samples {
    writeUInt16(UInt16(bitPattern: sample))
  }

  return data
}

struct CapturedAudio: Codable {
  let segmentId: String
  let sessionId: String
  var uri: String
  let fileName: String
  let phase: String
  let cycle: Int
  let capturedAt: String
  let durationMs: Int
  let speechStartMs: Int
  let speechEndMs: Int

  func validate() throws {
    guard UUID(uuidString: segmentId) != nil, !sessionId.isEmpty,
      fileName == URL(fileURLWithPath: fileName).lastPathComponent,
      fileName.hasSuffix(".wav"), ["learning", "rest"].contains(phase), cycle > 0,
      durationMs > 0, speechStartMs >= 0, speechStartMs <= speechEndMs, speechEndMs <= durationMs
    else {
      throw EngineFailure(
        "storage-unavailable", "Malformed pending capture; original manifest retained")
    }
  }

  var dictionary: [String: Any] {
    (try? JSONSerialization.jsonObject(with: JSONEncoder().encode(self))) as? [String: Any] ?? [:]
  }
}

func isoNow() -> String { ISO8601DateFormatter().string(from: Date()) }

// All reads/writes are serialized by the engine queue. Atomic metadata writes precede final WAV rename.
final class SessionPersistence {
  let directory: URL
  let captures: URL
  private let manager = FileManager.default

  private var writingOptions: Data.WritingOptions {
    #if os(iOS)
      return [.atomic, .completeFileProtectionUntilFirstUserAuthentication]
    #else
      return .atomic
    #endif
  }

  var recoveryURL: URL { directory.appendingPathComponent("pending-recovery.json") }

  var manifestURL: URL { directory.appendingPathComponent("pending-captures.json") }

  init(directory: URL, captures: URL) {
    self.directory = directory
    self.captures = captures
  }

  func prepare() throws {
    try manager.createDirectory(at: directory, withIntermediateDirectories: true)
    try manager.createDirectory(at: captures, withIntermediateDirectories: true)
  }

  func readRecovery() throws -> [String: Any]? {
    guard manager.fileExists(atPath: recoveryURL.path) else {
      return nil
    }

    guard
      let record = try JSONSerialization.jsonObject(with: Data(contentsOf: recoveryURL))
        as? [String: Any]
    else {
      throw EngineFailure("storage-unavailable", "Malformed recovery; original bytes retained")
    }
    return record
  }

  func writeRecovery(_ record: [String: Any]) throws {
    try prepare()

    let encoded = try JSONSerialization.data(withJSONObject: record, options: [.sortedKeys])
    try encoded.write(to: recoveryURL, options: writingOptions)

    guard try Data(contentsOf: recoveryURL) == encoded else {
      throw EngineFailure("storage-unavailable", "Recovery write verification failed")
    }
  }

  func clearRecovery(_ sessionID: String) throws {
    guard let record = try readRecovery() else {
      return
    }

    guard let config = record["configuration"] as? [String: Any],
      config["sessionId"] as? String == sessionID
    else {
      throw EngineFailure("storage-unavailable", "Recovery session ID mismatch")
    }

    try manager.removeItem(at: recoveryURL)
  }

  private func writeManifest(_ pendingCaptures: [CapturedAudio]) throws {
    try prepare()

    let encoded = try JSONEncoder().encode(pendingCaptures)
    try encoded.write(to: manifestURL, options: writingOptions)

    guard try Data(contentsOf: manifestURL) == encoded else {
      throw EngineFailure("storage-unavailable", "Capture manifest write verification failed")
    }
  }

  func pending() throws -> [CapturedAudio] {
    try prepare()

    var pendingCaptures: [CapturedAudio] = []
    if manager.fileExists(atPath: manifestURL.path) {
      pendingCaptures = try JSONDecoder().decode(
        [CapturedAudio].self, from: Data(contentsOf: manifestURL))
    }

    let metadataURLs = try manager.contentsOfDirectory(
      at: captures, includingPropertiesForKeys: nil
    )
    .filter { $0.lastPathComponent.hasSuffix(".metadata.json") }

    for metadataURL in metadataURLs {
      let capture = try JSONDecoder().decode(
        CapturedAudio.self, from: Data(contentsOf: metadataURL))
      try capture.validate()

      let finalURL = captures.appendingPathComponent(capture.fileName)
      let temporaryURL = captures.appendingPathComponent(".\(capture.fileName).tmp")

      if !pendingCaptures.contains(where: {
        $0.segmentId == capture.segmentId
      }),
        manager.fileExists(atPath: finalURL.path) || manager.fileExists(atPath: temporaryURL.path)
      {
        pendingCaptures.append(capture)
      }
    }

    try pendingCaptures.forEach { try $0.validate() }
    guard
      Set(
        pendingCaptures.map {
          $0.segmentId
        }
      ).count == pendingCaptures.count
    else {
      throw EngineFailure("storage-unavailable", "Duplicate pending capture identity")
    }
    try writeManifest(pendingCaptures)

    for captureIndex in pendingCaptures.indices {
      try pendingCaptures[captureIndex].validate()
      let finalURL = captures.appendingPathComponent(pendingCaptures[captureIndex].fileName)
      let temporaryURL = captures.appendingPathComponent(
        ".\(pendingCaptures[captureIndex].fileName).tmp")

      if !manager.fileExists(atPath: finalURL.path), manager.fileExists(atPath: temporaryURL.path) {
        try manager.moveItem(at: temporaryURL, to: finalURL)
      }
      guard manager.fileExists(atPath: finalURL.path) else {
        throw EngineFailure(
          "storage-unavailable",
          "Pending capture file unavailable: \(pendingCaptures[captureIndex].fileName)")
      }
      pendingCaptures[captureIndex].uri = finalURL.absoluteString
    }

    try writeManifest(pendingCaptures)

    for metadataURL in metadataURLs {
      let capture = try JSONDecoder().decode(
        CapturedAudio.self, from: Data(contentsOf: metadataURL))
      if pendingCaptures.contains(where: {
        $0.segmentId == capture.segmentId
      }) {
        try manager.removeItem(at: metadataURL)
      }
    }

    return pendingCaptures
  }

  func save(_ audio: SpeechAudio, sessionId: String, phase: String, cycle: Int, maxBytes: Int64)
    throws -> CapturedAudio
  {
    var pendingCaptures = try pending()

    let segmentID = UUID().uuidString.lowercased()
    let fileName = "session-\(sessionId)-\(segmentID).wav"
    let finalURL = captures.appendingPathComponent(fileName)
    let capture = CapturedAudio(
      segmentId: segmentID, sessionId: sessionId, uri: finalURL.absoluteString, fileName: fileName,
      phase: phase,
      cycle: cycle, capturedAt: isoNow(), durationMs: audio.durationMs,
      speechStartMs: audio.speechStartMs, speechEndMs: audio.speechEndMs)

    let storedBytes = try manager.contentsOfDirectory(
      at: captures, includingPropertiesForKeys: [.fileSizeKey]
    ).reduce(Int64(0)) { total, file in
      total + Int64(try file.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0)
    }
    guard storedBytes + Int64(audio.samples.count * 2 + 44) <= maxBytes else {
      throw EngineFailure(
        "storage-unavailable", "Capture storage limit reached; existing recordings retained")
    }

    let metadataURL = captures.appendingPathComponent(".\(fileName).metadata.json")
    try JSONEncoder().encode(capture).write(to: metadataURL, options: writingOptions)

    let temporaryURL = captures.appendingPathComponent(".\(fileName).tmp")
    try waveData(audio.samples).write(to: temporaryURL, options: writingOptions)

    pendingCaptures.append(capture)
    try writeManifest(pendingCaptures)

    try manager.moveItem(at: temporaryURL, to: finalURL)
    try manager.removeItem(at: metadataURL)

    return capture
  }

  func acknowledge(_ ids: [String]) throws {
    let acknowledgedIDs = Set(ids)
    try writeManifest(pending().filter { !acknowledgedIDs.contains($0.segmentId) })
  }
}

func recoveredSession(_ record: [String: Any]) throws -> [String: Any] {
  guard let config = record["configuration"] as? [String: Any],
    let sessionId = config["sessionId"] as? String,
    let recoveryMetadata = config["recovery"] as? [String: Any],
    recoveryMetadata["wordId"] is String,
    recoveryMetadata["word"] is String,
    ["preset", "recording"].contains(recoveryMetadata["sourceType"] as? String ?? ""),
    recoveryMetadata["startedAt"] is String,
    let totalDurationMs = config["totalDurationMs"] as? Double,
    let learningDurationMs = config["learningDurationMs"] as? Double,
    let restDurationMs = config["restDurationMs"] as? Double,
    let elapsedRunningMs = record["elapsedRunningMs"] as? Double,
    let savedAt = record["savedAt"] as? String,
    totalDurationMs > 0, learningDurationMs > 0, restDurationMs >= 0, elapsedRunningMs >= 0,
    let targetAudioUri = config["targetAudioUri"] as? String
  else {
    throw EngineFailure(
      "storage-unavailable", "Malformed session recovery; original bytes retained")
  }

  guard config["stressCareDurationMs"] == nil || config["stressCareDurationMs"] is Double else {
    throw EngineFailure("storage-unavailable", "Malformed recovery care duration")
  }

  let stressCareDurationMs = config["stressCareDurationMs"] as? Double ?? 0
  guard validDurations(totalDurationMs, learningDurationMs, restDurationMs, stressCareDurationMs),
    elapsedRunningMs.isFinite
  else {
    throw EngineFailure("storage-unavailable", "Malformed recovery durations")
  }

  let reason = record["reason"] as? String
  let phasePosition = sessionPosition(
    elapsed: elapsedRunningMs, total: totalDurationMs, learning: learningDurationMs,
    rest: restDurationMs, care: stressCareDurationMs)
  let snapshot: [String: Any] = [
    "sessionId": sessionId,
    "state": reason == "duration-reached" ? "completed" : "failed",
    "elapsedRunningMs": min(totalDurationMs, elapsedRunningMs),
    "cycle": phasePosition.cycle,
    "phase": phasePosition.phase,
    "phaseElapsedMs": phasePosition.elapsed,
    "savedAt": savedAt,
    "isTargetPlaying": false,
    "lastPlaybackStartDelayMs": NSNull(),
  ]

  return [
    "sessionId": sessionId,
    "recovery": recoveryMetadata,
    "targetAudioUri": targetAudioUri,
    "totalDurationMs": totalDurationMs,
    "learningDurationMs": learningDurationMs,
    "restDurationMs": restDurationMs,
    "stressCareDurationMs": stressCareDurationMs,
    "snapshot": snapshot,
    "reason": reason as Any? ?? NSNull(),
  ]
}

func validDurations(_ total: Double, _ learning: Double, _ rest: Double, _ care: Double) -> Bool {
  [total, learning, rest, care].allSatisfy { $0.isFinite && $0 >= 0 && $0 <= 31_536_000_000 }
    && total >= 1 && learning >= 1 && total / (learning + rest + care) <= Double(Int32.max)
}
