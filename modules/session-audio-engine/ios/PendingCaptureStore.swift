import Foundation

final class PendingCaptureStore {
  private let fileManager = FileManager.default
  private let encoder = JSONEncoder()
  private let decoder = JSONDecoder()
  private let manifestURL: URL
  private var segments: [NativeCapturedSegment]

  init() {
    let support = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    let directory = support.appendingPathComponent("session-audio-engine", isDirectory: true)
    try? fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
    manifestURL = directory.appendingPathComponent("pending-captures.json")
    if let data = try? Data(contentsOf: manifestURL),
       let decoded = try? decoder.decode([NativeCapturedSegment].self, from: data) {
      segments = decoded
    } else {
      segments = []
    }
    let documents = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
    let captureDirectory = documents
      .appendingPathComponent("recordings", isDirectory: true)
      .appendingPathComponent("session-captures", isDirectory: true)
    try? fileManager.createDirectory(at: captureDirectory, withIntermediateDirectories: true)
    segments = segments.compactMap { segment in
      let finalURL = captureDirectory.appendingPathComponent(segment.fileName)
      let temporaryURL = captureDirectory.appendingPathComponent(".\(segment.fileName).tmp")
      if !fileManager.fileExists(atPath: finalURL.path), fileManager.fileExists(atPath: temporaryURL.path) {
        try? fileManager.moveItem(at: temporaryURL, to: finalURL)
      }
      guard fileManager.fileExists(atPath: finalURL.path) else { return nil }
      return NativeCapturedSegment(
        segmentId: segment.segmentId,
        sessionId: segment.sessionId,
        uri: finalURL.absoluteString,
        fileName: segment.fileName,
        phase: segment.phase,
        cycle: segment.cycle,
        capturedAt: segment.capturedAt,
        durationMs: segment.durationMs,
        speechStartMs: segment.speechStartMs,
        speechEndMs: segment.speechEndMs
      )
    }
    try? persist()
  }

  func store(
    samples: [Int16],
    configuration: NativeSessionConfiguration,
    phase: String,
    cycle: Int,
    speechStartMs: Int64,
    speechEndMs: Int64
  ) throws -> NativeCapturedSegment {
    guard let directoryURL = URL(string: configuration.captureDirectoryUri) else {
      throw SessionAudioEngineError.storageUnavailable
    }
    let segmentId = UUID().uuidString.lowercased()
    let fileName = "session-\(configuration.sessionId)-\(segmentId).wav"
    let temporaryURL = directoryURL.appendingPathComponent(".\(fileName).tmp")
    let finalURL = directoryURL.appendingPathComponent(fileName)
    let durationMs = Int64(samples.count) * 1000 / 16_000
    let segment = NativeCapturedSegment(
      segmentId: segmentId,
      sessionId: configuration.sessionId,
      uri: finalURL.absoluteString,
      fileName: fileName,
      phase: phase,
      cycle: cycle,
      capturedAt: ISO8601DateFormatter().string(from: Date()),
      durationMs: durationMs,
      speechStartMs: max(0, min(speechStartMs, durationMs)),
      speechEndMs: max(0, min(speechEndMs, durationMs))
    )
    let wav = makeWavData(samples: samples)
    try wav.write(to: temporaryURL, options: .atomic)
    segments.append(segment)
    try persist()
    try fileManager.moveItem(at: temporaryURL, to: finalURL)
    evictOverLimit(configuration.maxPendingCaptureBytes)
    try persist()
    return segment
  }

  func all() -> [NativeCapturedSegment] {
    segments.filter { fileManager.fileExists(atPath: URL(string: $0.uri)?.path ?? "") }
  }

  func markStored(ids: Set<String>) throws {
    segments.removeAll { ids.contains($0.segmentId) }
    try persist()
  }

  private func evictOverLimit(_ limit: Int64) {
    guard limit > 0 else { return }
    var total = segments.reduce(Int64(0)) { partial, segment in
      let size = (try? fileManager.attributesOfItem(atPath: URL(string: segment.uri)?.path ?? "")[.size] as? NSNumber)?.int64Value ?? 0
      return partial + size
    }
    while total > limit, let oldest = segments.first {
      let url = URL(string: oldest.uri)
      let size = (try? fileManager.attributesOfItem(atPath: url?.path ?? "")[.size] as? NSNumber)?.int64Value ?? 0
      if let url { try? fileManager.removeItem(at: url) }
      segments.removeFirst()
      total -= size
    }
  }

  private func persist() throws {
    try encoder.encode(segments).write(to: manifestURL, options: .atomic)
  }

  private func makeWavData(samples: [Int16]) -> Data {
    let dataSize = UInt32(samples.count * MemoryLayout<Int16>.size)
    var data = Data()
    data.append(contentsOf: Array("RIFF".utf8))
    data.appendLittleEndian(UInt32(36) + dataSize)
    data.append(contentsOf: Array("WAVEfmt ".utf8))
    data.appendLittleEndian(UInt32(16))
    data.appendLittleEndian(UInt16(1))
    data.appendLittleEndian(UInt16(1))
    data.appendLittleEndian(UInt32(16_000))
    data.appendLittleEndian(UInt32(32_000))
    data.appendLittleEndian(UInt16(2))
    data.appendLittleEndian(UInt16(16))
    data.append(contentsOf: Array("data".utf8))
    data.appendLittleEndian(dataSize)
    samples.forEach { data.appendLittleEndian(UInt16(bitPattern: $0)) }
    return data
  }
}

private extension Data {
  mutating func appendLittleEndian<T: FixedWidthInteger>(_ value: T) {
    var littleEndian = value.littleEndian
    Swift.withUnsafeBytes(of: &littleEndian) { append(contentsOf: $0) }
  }
}
