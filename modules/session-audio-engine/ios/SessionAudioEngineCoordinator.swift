import AVFoundation
import Darwin.Mach
import Foundation

final class SessionAudioEngineCoordinator: NSObject {
  var onStateChanged: (([String: Any]) -> Void)?
  var onProgress: (([String: Any]) -> Void)?
  var onFailure: (([String: Any]) -> Void)?
  var onSegmentCaptured: (([String: Any]) -> Void)?

  private let queue = DispatchQueue(label: "com.joynnovate.buddybird.session-audio-engine")
  private let recoveryStore = SessionRecoveryStore()
  private let captureStore = PendingCaptureStore()
  private var configuration: NativeSessionConfiguration?
  private var state = "idle"
  private var elapsedBeforeRunMs: Int64 = 0
  private var runningSinceMs: Int64?
  private var lastSavedElapsedMs: Int64 = 0
  private var lastProgressSecond: Int64 = -1
  private var lastPhase = "learning"
  private var timer: DispatchSourceTimer?
  private var audioEngine: AVAudioEngine?
  private var playerNode: AVAudioPlayerNode?
  private var audioFile: AVAudioFile?
  private var playbackGeneration = 0
  private var lastStopRecord: [String: Any]?
  private var capturePipeline: VoiceCapturePipeline?
  private var targetPlaying = false
  private var captureAllowedAfterMs: Int64 = 0

  override init() {
    super.init()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleInterruption(_:)),
      name: AVAudioSession.interruptionNotification,
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleRouteChange(_:)),
      name: AVAudioSession.routeChangeNotification,
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleMediaServicesReset(_:)),
      name: AVAudioSession.mediaServicesWereResetNotification,
      object: nil
    )
  }

  func start(_ input: SessionAudioEngineStartInputRecord) throws -> [String: Any] {
    try queue.sync {
      if let current = configuration {
        guard current.sessionId == input.sessionId else { throw SessionAudioEngineError.sessionAlreadyRunning }
        return snapshotDictionary()
      }
      guard !input.sessionId.isEmpty,
            input.totalDurationMs > 0,
            input.learningDurationMs > 0,
            input.restDurationMs >= 0 else {
        throw SessionAudioEngineError.invalidInput("Session durations and sessionId are required.")
      }

      let nextConfiguration = NativeSessionConfiguration(input)
      try validateFiles(nextConfiguration)
      configuration = nextConfiguration
      state = "starting"
      elapsedBeforeRunMs = 0
      runningSinceMs = nil
      lastStopRecord = nil
      do {
        try activateAudio()
        runningSinceMs = monotonicMilliseconds()
        state = "running"
        startTimer()
        scheduleTargetPlaybackIfNeeded()
        try persist(reason: nil)
      } catch {
        state = "failed"
        stopAudio()
        try? persist(reason: "failure")
        throw error
      }
      let snapshot = snapshotDictionary()
      onStateChanged?(snapshot)
      return snapshot
    }
  }

  func pause() throws -> [String: Any] {
    try queue.sync {
      guard configuration != nil else { throw SessionAudioEngineError.noSession }
      guard state == "running" || state == "interrupted" else { return snapshotDictionary() }
      foldElapsed()
      state = "paused"
      stopAudio()
      try persist(reason: nil)
      let snapshot = snapshotDictionary()
      onStateChanged?(snapshot)
      return snapshot
    }
  }

  func resume() throws -> [String: Any] {
    try queue.sync {
      guard configuration != nil else { throw SessionAudioEngineError.noSession }
      guard state == "paused" || state == "interrupted" else { return snapshotDictionary() }
      state = "starting"
      do {
        try activateAudio()
        runningSinceMs = monotonicMilliseconds()
        state = "running"
        startTimer()
        scheduleTargetPlaybackIfNeeded()
        try persist(reason: nil)
      } catch {
        state = "failed"
        stopAudio()
        try? persist(reason: "failure")
        throw error
      }
      let snapshot = snapshotDictionary()
      onStateChanged?(snapshot)
      return snapshot
    }
  }

  func stop() throws -> [String: Any] {
    try queue.sync {
      if configuration == nil, let lastStopRecord { return lastStopRecord }
      guard let configuration else { throw SessionAudioEngineError.noSession }
      let wasCompleted = state == "completed"
      let wasFailed = state == "failed"
      foldElapsed()
      state = "stopping"
      stopAudio()
      let reason = wasCompleted ? "duration-reached" : (wasFailed ? "failure" : "user-stopped")
      try persist(reason: reason)
      let result = recoveryDictionary(configuration: configuration, reason: reason)
      lastStopRecord = result
      capturePipeline = nil
      self.configuration = nil
      state = "idle"
      return result
    }
  }

  func snapshot() -> [String: Any]? {
    queue.sync { configuration == nil ? nil : snapshotDictionary() }
  }

  func pendingRecovery() -> [String: Any]? {
    guard let record = recoveryStore.load() else { return nil }
    return recoveryDictionary(record: record)
  }

  func clearPendingRecovery(sessionId: String) throws {
    try recoveryStore.clear(sessionId: sessionId)
  }

  func unstoredSegments() -> [[String: Any]] {
    captureStore.all().map(\.dictionary)
  }

  func markSegmentsStored(ids: [String]) throws {
    try captureStore.markStored(ids: Set(ids))
  }

  func destroy() {
    queue.sync {
      timer?.cancel()
      timer = nil
      stopAudio()
    }
    NotificationCenter.default.removeObserver(self)
  }

  @objc private func handleInterruption(_ notification: Notification) {
    guard let rawType = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: rawType) else { return }
    queue.async {
      if type == .began {
        guard self.state == "running" else { return }
        self.foldElapsed()
        self.state = "interrupted"
        self.stopAudio()
        try? self.persist(reason: nil)
        self.onStateChanged?(self.snapshotDictionary())
        return
      }
      let rawOptions = notification.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0
      let options = AVAudioSession.InterruptionOptions(rawValue: rawOptions)
      guard self.state == "interrupted", options.contains(.shouldResume) else { return }
      self.resumeAfterInterruption()
    }
  }

  @objc private func handleRouteChange(_ notification: Notification) {
    // 장치 연결/해제 reason만 처리한다. activateAudio/stopAudio가 스스로 유발하는
    // categoryChange·override 통지에 반응하면 엔진 재구성이 재구성을 낳아 재생·캡처가 끊긴다.
    guard let rawReason = notification.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
          let reason = AVAudioSession.RouteChangeReason(rawValue: rawReason),
          reason == .oldDeviceUnavailable || reason == .newDeviceAvailable else {
      return
    }
    queue.async {
      guard self.state == "running" else { return }
      self.foldElapsed()
      self.stopAudio()
      self.resumeAfterInterruption()
    }
  }

  @objc private func handleMediaServicesReset(_ notification: Notification) {
    queue.async {
      guard self.configuration != nil, self.state == "running" || self.state == "interrupted" else { return }
      self.foldElapsed()
      self.stopAudio()
      self.resumeAfterInterruption()
    }
  }

  private func resumeAfterInterruption() {
    state = "starting"
    do {
      try activateAudio()
      runningSinceMs = monotonicMilliseconds()
      state = "running"
      scheduleTargetPlaybackIfNeeded()
      try persist(reason: nil)
      onStateChanged?(snapshotDictionary())
    } catch {
      state = "failed"
      try? persist(reason: "failure")
      onFailure?([
        "code": "audio-engine-failed",
        "message": error.localizedDescription,
        "recoverable": false
      ])
      onStateChanged?(snapshotDictionary())
    }
  }

  private func validateFiles(_ configuration: NativeSessionConfiguration) throws {
    guard let audioURL = URL(string: configuration.targetAudioUri),
          audioURL.isFileURL,
          FileManager.default.fileExists(atPath: audioURL.path) else {
      throw SessionAudioEngineError.audioSourceUnavailable
    }
    guard let captureURL = URL(string: configuration.captureDirectoryUri), captureURL.isFileURL else {
      throw SessionAudioEngineError.storageUnavailable
    }
    do {
      try FileManager.default.createDirectory(at: captureURL, withIntermediateDirectories: true)
      try captureStore.reconcile(captureDirectoryURL: captureURL)
    } catch {
      throw SessionAudioEngineError.storageUnavailable
    }
    guard AVAudioSession.sharedInstance().recordPermission == .granted else {
      throw SessionAudioEngineError.permissionDenied
    }
  }

  private func activateAudio() throws {
    guard let configuration,
          let audioURL = URL(string: configuration.targetAudioUri) else {
      throw SessionAudioEngineError.audioSourceUnavailable
    }
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetoothHFP])
      try session.setActive(true)

      let engine = AVAudioEngine()
      let player = AVAudioPlayerNode()
      let file = try AVAudioFile(forReading: audioURL)
      engine.attach(player)
      engine.connect(player, to: engine.mainMixerNode, format: file.processingFormat)
      let input = engine.inputNode
      let inputFormat = input.inputFormat(forBus: 0)
      guard inputFormat.sampleRate > 0, inputFormat.channelCount > 0 else {
        throw SessionAudioEngineError.audioEngineFailed("The current audio input route is unavailable.")
      }
      if capturePipeline == nil {
        let pipeline = VoiceCapturePipeline(configuration: configuration, store: captureStore)
        pipeline.onCaptured = { [weak self] segment in self?.onSegmentCaptured?(segment.dictionary) }
        pipeline.onFailure = { [weak self] error in
          self?.queue.async { self?.failSession(code: "storage-unavailable", error: error) }
        }
        capturePipeline = pipeline
      }
      input.installTap(onBus: 0, bufferSize: 1600, format: inputFormat) { [weak self] buffer, _ in
        guard let self, let channels = buffer.floatChannelData else { return }
        let frameCount = Int(buffer.frameLength)
        let channelCount = Int(buffer.format.channelCount)
        var mono = [Float](repeating: 0, count: frameCount)
        for channel in 0..<channelCount {
          for frame in 0..<frameCount { mono[frame] += channels[channel][frame] / Float(channelCount) }
        }
        let sampleRate = buffer.format.sampleRate
        self.queue.async {
          let samples = self.resampleTo16k(mono, sourceRate: sampleRate)
          let position = self.phasePosition()
          let allowed = !self.targetPlaying && self.monotonicMilliseconds() >= self.captureAllowedAfterMs
          self.capturePipeline?.process(samples: samples, captureAllowed: allowed, phase: position.phase, cycle: position.cycle)
        }
      }
      engine.prepare()
      try engine.start()
      audioEngine = engine
      playerNode = player
      audioFile = file
      playbackGeneration += 1
    } catch let error as SessionAudioEngineError {
      throw error
    } catch {
      throw SessionAudioEngineError.audioEngineFailed(error.localizedDescription)
    }
  }

  private func stopAudio() {
    capturePipeline?.flush()
    playbackGeneration += 1
    targetPlaying = false
    playerNode?.stop()
    audioEngine?.inputNode.removeTap(onBus: 0)
    audioEngine?.stop()
    playerNode = nil
    audioFile = nil
    audioEngine = nil
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
  }

  private func scheduleTargetPlaybackIfNeeded() {
    guard state == "running", phasePosition().phase == "learning",
          let playerNode, let audioFile else { return }
    let generation = playbackGeneration
    targetPlaying = true
    capturePipeline?.flush()
    onStateChanged?(snapshotDictionary())
    playerNode.scheduleFile(audioFile, at: nil, completionCallbackType: .dataPlayedBack) { [weak self] _ in
      guard let self else { return }
      let durationSeconds = Double(audioFile.length) / audioFile.processingFormat.sampleRate
      self.queue.async {
        guard self.playbackGeneration == generation else { return }
        self.targetPlaying = false
        self.captureAllowedAfterMs = self.monotonicMilliseconds() + (self.configuration?.vad.echoTailGuardMs ?? 0)
        self.onStateChanged?(self.snapshotDictionary())
      }
      self.queue.asyncAfter(deadline: .now() + durationSeconds) {
        guard self.playbackGeneration == generation,
              self.state == "running",
              self.phasePosition().phase == "learning" else { return }
        self.scheduleTargetPlaybackIfNeeded()
      }
    }
    playerNode.play()
  }

  private func startTimer() {
    guard timer == nil else { return }
    let timer = DispatchSource.makeTimerSource(queue: queue)
    timer.schedule(deadline: .now() + 0.25, repeating: 0.25)
    timer.setEventHandler { [weak self] in self?.handleTimer() }
    self.timer = timer
    timer.resume()
  }

  private func handleTimer() {
    guard state == "running", let configuration else { return }
    let elapsed = elapsedRunningMs()
    if elapsed >= configuration.totalDurationMs {
      elapsedBeforeRunMs = configuration.totalDurationMs
      runningSinceMs = nil
      state = "completed"
      stopAudio()
      try? persist(reason: "duration-reached")
      let snapshot = snapshotDictionary()
      onStateChanged?(snapshot)
      return
    }

    let position = phasePosition()
    if position.phase != lastPhase {
      capturePipeline?.flush()
      lastPhase = position.phase
      playerNode?.stop()
      playbackGeneration += 1
      targetPlaying = false
      scheduleTargetPlaybackIfNeeded()
      try? persist(reason: nil)
      onStateChanged?(snapshotDictionary())
    }

    let progressSecond = elapsed / 1000
    if progressSecond != lastProgressSecond {
      lastProgressSecond = progressSecond
      onProgress?(snapshotDictionary())
    }
    if elapsed - lastSavedElapsedMs >= 15_000 {
      try? persist(reason: nil)
    }
  }

  private func foldElapsed() {
    elapsedBeforeRunMs = elapsedRunningMs()
    runningSinceMs = nil
  }

  private func elapsedRunningMs() -> Int64 {
    guard let configuration else { return 0 }
    let activeElapsed = runningSinceMs.map { max(0, monotonicMilliseconds() - $0) } ?? 0
    return min(configuration.totalDurationMs, elapsedBeforeRunMs + activeElapsed)
  }

  private func phasePosition() -> (cycle: Int, phase: String, phaseElapsedMs: Int64) {
    guard let configuration else { return (1, "learning", 0) }
    let cycleDuration = configuration.learningDurationMs + configuration.restDurationMs
    guard cycleDuration > 0 else { return (1, "learning", 0) }
    let elapsed = elapsedRunningMs()
    if elapsed >= configuration.totalDurationMs && elapsed % cycleDuration == 0 {
      return (max(1, Int(elapsed / cycleDuration)), "rest", configuration.restDurationMs)
    }
    let completedCycles = elapsed / cycleDuration
    let insideCycle = elapsed % cycleDuration
    if insideCycle < configuration.learningDurationMs {
      return (Int(completedCycles) + 1, "learning", insideCycle)
    }
    return (Int(completedCycles) + 1, "rest", insideCycle - configuration.learningDurationMs)
  }

  private func snapshotDictionary() -> [String: Any] {
    guard let configuration else { return [:] }
    let position = phasePosition()
    return [
      "sessionId": configuration.sessionId,
      "state": state,
      "elapsedRunningMs": elapsedRunningMs(),
      "cycle": position.cycle,
      "phase": position.phase,
      "phaseElapsedMs": position.phaseElapsedMs,
      "isTargetPlaying": targetPlaying,
      "savedAt": isoNow()
    ]
  }

  private func persist(reason: String?) throws {
    guard let configuration else { return }
    let position = phasePosition()
    let elapsed = elapsedRunningMs()
    let record = PersistedSessionRecord(
      configuration: configuration,
      elapsedRunningMs: elapsed,
      cycle: position.cycle,
      phase: position.phase,
      phaseElapsedMs: position.phaseElapsedMs,
      savedAt: isoNow(),
      reason: reason
    )
    try recoveryStore.save(record)
    lastSavedElapsedMs = elapsed
  }

  private func recoveryDictionary(configuration: NativeSessionConfiguration, reason: String?) -> [String: Any] {
    [
      "snapshot": snapshotDictionary(),
      "recovery": configuration.recovery.dictionary,
      "totalDurationMs": configuration.totalDurationMs,
      "learningDurationMs": configuration.learningDurationMs,
      "restDurationMs": configuration.restDurationMs,
      "reason": reason as Any
    ]
  }

  private func recoveryDictionary(record: PersistedSessionRecord) -> [String: Any] {
    [
      "snapshot": [
        "sessionId": record.configuration.sessionId,
        "state": record.reason == "duration-reached" ? "completed" : "failed",
        "elapsedRunningMs": record.elapsedRunningMs,
        "cycle": record.cycle,
        "phase": record.phase,
        "phaseElapsedMs": record.phaseElapsedMs,
        "isTargetPlaying": false,
        "savedAt": record.savedAt
      ],
      "recovery": record.configuration.recovery.dictionary,
      "totalDurationMs": record.configuration.totalDurationMs,
      "learningDurationMs": record.configuration.learningDurationMs,
      "restDurationMs": record.configuration.restDurationMs,
      "reason": record.reason as Any
    ]
  }

  private func monotonicMilliseconds() -> Int64 {
    var timebase = mach_timebase_info_data_t()
    mach_timebase_info(&timebase)
    let nanos = Double(mach_continuous_time()) * Double(timebase.numer) / Double(timebase.denom)
    return Int64(nanos / 1_000_000)
  }

  private func resampleTo16k(_ samples: [Float], sourceRate: Double) -> [Int16] {
    guard !samples.isEmpty, sourceRate > 0 else { return [] }
    let outputCount = max(1, Int(Double(samples.count) * 16_000 / sourceRate))
    return (0..<outputCount).map { index in
      let sourceIndex = min(samples.count - 1, Int(Double(index) * sourceRate / 16_000))
      let value = max(-1, min(1, samples[sourceIndex]))
      return Int16(value * Float(Int16.max))
    }
  }

  private func failSession(code: String, error: Error) {
    guard configuration != nil, state == "running" || state == "starting" || state == "interrupted" else { return }
    foldElapsed()
    state = "failed"
    stopAudio()
    try? persist(reason: "failure")
    onFailure?([
      "code": code,
      "message": error.localizedDescription,
      "recoverable": false
    ])
    onStateChanged?(snapshotDictionary())
  }

  private func isoNow() -> String {
    ISO8601DateFormatter().string(from: Date())
  }
}
