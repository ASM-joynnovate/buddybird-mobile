import Foundation

@main struct NativeCoreCheck {
  static func main() throws {
    let p = sessionPosition(
      elapsed: 2_400_000, total: 2_400_000, learning: 600000, rest: 300000, care: 300000)
    precondition(p.cycle == 2 && p.phase == "stress-care" && p.elapsed == 300000)
    let partial = sessionPosition(
      elapsed: 600000, total: 600000, learning: 600000, rest: 300000, care: 0)
    precondition(partial.cycle == 1 && partial.phase == "learning" && partial.elapsed == 600000)
    let transition = sessionPosition(
      elapsed: 600000, total: 2_400_000, learning: 600000, rest: 300000, care: 300000)
    precondition(transition.phase == "rest" && transition.elapsed == 0)
    let loud = [Int16](repeating: 16000, count: 1600)
    let silent = [Int16](repeating: 0, count: 1600)
    let vad = SpeechDetector(VADSettings())
    for _ in 0..<2 {
      precondition(vad.consume(silent) == nil)
    }
    for _ in 0..<3 {
      precondition(vad.consume(loud) == nil)
    }
    for _ in 0..<4 {
      precondition(vad.consume(silent) == nil)
    }
    let segment = vad.consume(silent)!
    precondition(
      segment.durationMs == 1000 && segment.speechStartMs == 200 && segment.speechEndMs == 500)
    for _ in 0..<2 {
      _ = vad.consume(silent)
    }
    for _ in 0..<97 {
      precondition(vad.consume(loud) == nil)
    }
    let ceiling = vad.consume(loud)!
    precondition(
      ceiling.durationMs == 10000 && ceiling.speechStartMs == 200 && ceiling.speechEndMs == 10000)
    for _ in 0..<3 {
      _ = vad.consume(loud)
    }
    let next = vad.flush()!
    precondition(next.durationMs == 300 && next.speechStartMs == 0 && next.speechEndMs == 300)
    for _ in 0..<2 {
      _ = vad.consume(silent)
    }
    for _ in 0..<96 {
      precondition(vad.consume(loud) == nil)
    }
    precondition(vad.consume(silent) == nil)
    let tailCeiling = vad.consume(silent)!
    precondition(tailCeiling.speechEndMs == 9800)
    var exactSettings = VADSettings()
    exactSettings.threshold = 1
    let exactThreshold = SpeechDetector(exactSettings)
    for _ in 0..<10 {
      precondition(exactThreshold.consume([Int16](repeating: .max, count: 1600)) == nil)
    }
    precondition(exactThreshold.flush() == nil)
    let fixture =
      try JSONSerialization.jsonObject(
        with: Data(contentsOf: URL(fileURLWithPath: "test/fixtures/native-persistence.json")))
      as! [String: Any]
    for key in ["iosPendingRecovery", "iosHistoricalWithoutCareOrNotification"] {
      let record = fixture[key] as! [String: Any]
      let recovered = try recoveredSession(record)
      let snapshot = recovered["snapshot"] as! [String: Any]
      precondition(
        snapshot["state"] as? String == "failed" && snapshot["isTargetPlaying"] as? Bool == false)
      precondition(snapshot["elapsedRunningMs"] as? Double == 615000)
    }
    var completed = fixture["iosPendingRecovery"] as! [String: Any]
    completed["reason"] = "duration-reached"
    let completedRecovery = try recoveredSession(completed)
    precondition(
      (completedRecovery["snapshot"] as! [String: Any])["state"] as? String == "completed")
    var invalid = completed
    var invalidConfig = invalid["configuration"] as! [String: Any]
    var invalidIdentity = invalidConfig["recovery"] as! [String: Any]
    invalidIdentity.removeValue(forKey: "sourceType")
    invalidConfig["recovery"] = invalidIdentity
    invalid["configuration"] = invalidConfig
    do {
      _ = try recoveredSession(invalid)
      preconditionFailure("Missing sourceType must not be synthesized")
    } catch {}
    let wave = waveData(segment.samples)
    precondition(
      wave.count == 44 + segment.samples.count * 2
        && String(data: wave.prefix(4), encoding: .ascii) == "RIFF")
    let root = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    defer { try? FileManager.default.removeItem(at: root) }
    let store = SessionPersistence(
      directory: root.appendingPathComponent("support"),
      captures: root.appendingPathComponent("captures"))
    let saved = try store.save(
      segment, sessionId: "sess_test", phase: "rest", cycle: 1, maxBytes: 1_000_000)
    let initialPending = try store.pending()
    precondition(initialPending.count == 1)
    let final = URL(string: saved.uri)!
    let temporary = store.captures.appendingPathComponent(".\(saved.fileName).tmp")
    try FileManager.default.moveItem(at: final, to: temporary)
    let recoveredPending = try store.pending()
    precondition(recoveredPending.first?.uri == final.absoluteString)
    precondition(FileManager.default.fileExists(atPath: final.path))
    try store.acknowledge([saved.segmentId])
    let acknowledged = try store.pending()
    precondition(acknowledged.isEmpty)
    precondition(
      FileManager.default.fileExists(atPath: final.path), "ACK must never delete user media")
    let orphanID = UUID().uuidString.lowercased()
    let orphanName = "session-sess_test-\(orphanID).wav"
    let orphan = CapturedAudio(
      segmentId: orphanID, sessionId: "sess_test",
      uri: store.captures.appendingPathComponent(orphanName).absoluteString, fileName: orphanName,
      phase: "rest", cycle: 1, capturedAt: "2026-09-01T00:00:00Z", durationMs: segment.durationMs,
      speechStartMs: segment.speechStartMs, speechEndMs: segment.speechEndMs)
    let orphanSidecar = store.captures.appendingPathComponent(".\(orphanName).metadata.json")
    try JSONEncoder().encode(orphan).write(to: orphanSidecar)
    try waveData(segment.samples).write(
      to: store.captures.appendingPathComponent(".\(orphanName).tmp"))
    let sidecarRecovered = try store.pending()
    precondition(sidecarRecovered.count == 1 && sidecarRecovered[0].segmentId == orphanID)
    let retried = try store.pending()
    precondition(retried.count == 1 && !FileManager.default.fileExists(atPath: orphanSidecar.path))
    do {
      _ = try store.save(segment, sessionId: "sess_test", phase: "rest", cycle: 1, maxBytes: 1)
      preconditionFailure("Storage limit must stop new recording")
    } catch {}
    precondition(FileManager.default.fileExists(atPath: final.path))
    precondition(FileManager.default.fileExists(atPath: URL(string: orphan.uri)!.path))
    // JSON may decode fractional monotonic timestamps as NSDecimalNumber.
    // Durability must not depend on NSNumber/NSDecimalNumber dictionary equality.
    var fractional = fixture["iosPendingRecovery"] as! [String: Any]
    fractional["elapsedRunningMs"] = 301.0 / 3_000_001
    fractional["phaseElapsedMs"] = 301.0 / 3_000_001
    try store.writeRecovery(fractional)
    let expectedFractionalBytes = try JSONSerialization.data(
      withJSONObject: fractional, options: [.sortedKeys])
    let savedFractionalBytes = try Data(contentsOf: store.recoveryURL)
    precondition(savedFractionalBytes == expectedFractionalBytes)
    let recovery: [String: Any] = [
      "configuration": ["sessionId": "sess_test", "recovery": ["word": "hello"]],
      "elapsedRunningMs": 300000,
    ]
    try store.writeRecovery(recovery)
    do {
      try store.clearRecovery("wrong")
      preconditionFailure("Mismatched ID must not clear recovery")
    } catch {}
    let retainedRecovery = try store.readRecovery()
    precondition(retainedRecovery != nil)
    try store.clearRecovery("sess_test")
    try Data("{broken".utf8).write(to: store.manifestURL)
    do {
      _ = try store.pending()
      preconditionFailure("Malformed manifest must not become empty")
    } catch {}
    let malformedBytes = try Data(contentsOf: store.manifestURL)
    precondition(malformedBytes == Data("{broken".utf8))
    print("Swift native timing, VAD, WAV, recovery and ACK checks passed")
  }
}
