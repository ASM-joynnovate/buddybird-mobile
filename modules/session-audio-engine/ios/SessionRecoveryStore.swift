import Foundation

final class SessionRecoveryStore {
  private let fileManager = FileManager.default
  private let encoder = JSONEncoder()
  private let decoder = JSONDecoder()
  private let recordURL: URL

  init() {
    let support = fileManager.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
    let directory = support.appendingPathComponent("session-audio-engine", isDirectory: true)
    try? fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
    recordURL = directory.appendingPathComponent("pending-recovery.json")
  }

  func load() -> PersistedSessionRecord? {
    guard let data = try? Data(contentsOf: recordURL) else { return nil }
    return try? decoder.decode(PersistedSessionRecord.self, from: data)
  }

  func save(_ record: PersistedSessionRecord) throws {
    let data = try encoder.encode(record)
    try data.write(to: recordURL, options: .atomic)
  }

  func clear(sessionId: String) throws {
    guard let record = load(), record.configuration.sessionId == sessionId else { return }
    if fileManager.fileExists(atPath: recordURL.path) {
      try fileManager.removeItem(at: recordURL)
    }
  }
}
