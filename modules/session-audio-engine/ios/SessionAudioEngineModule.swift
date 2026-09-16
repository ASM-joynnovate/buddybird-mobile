import AVFoundation
import Darwin
import ExpoModulesCore
import MediaPlayer

extension EngineFailure: CodedError {}

public final class SessionAudioEngineModule: Module {
  private let queue = DispatchQueue(label: "buddybird.session.audio")
  private lazy var engine = SessionEngine(queue: queue) { [weak self] event, body in
    self?.sendEvent(event, body)
  }

  public func definition() -> ModuleDefinition {
    Name("SessionAudioEngine")
    Events("onStateChanged", "onProgress", "onSegmentCaptured", "onFailure", "onPlaybackMetering", "onTargetPlayback")

    AsyncFunction("start") { (input: [String: Any]) in
      try self.engine.start(input)
    }.runOnQueue(queue)
    AsyncFunction("pause") {
      try self.engine.pause()
    }.runOnQueue(queue)
    AsyncFunction("resume") {
      try self.engine.resume()
    }.runOnQueue(queue)
    AsyncFunction("stop") {
      try self.engine.stop()
    }.runOnQueue(queue)
    AsyncFunction("getSnapshot") {
      self.engine.snapshot()
    }.runOnQueue(queue)

    AsyncFunction("getPendingRecovery") {
      try self.engine.pendingRecovery()
    }.runOnQueue(queue)
    AsyncFunction("clearPendingRecovery") { (sessionId: String) in
      try self.engine.clearRecovery(sessionId)
    }.runOnQueue(queue)
    AsyncFunction("getCaptureChanges") {
      try self.engine.persistence.changes()
    }.runOnQueue(queue)
    AsyncFunction("ackCaptureChanges") { (segmentIds: [String], evictedFileNames: [String]) in
      try self.engine.persistence.acknowledge(segmentIds, evictedFileNames: evictedFileNames)
    }.runOnQueue(queue)

    OnDestroy {
      self.queue.async {
        self.engine.shutdown()
      }
    }
  }
}

private func continuousMilliseconds() -> Double {
  var info = mach_timebase_info_data_t()
  mach_timebase_info(&info)
  return Double(mach_continuous_time()) * Double(info.numer) / Double(info.denom) / 1_000_000
}

private final class SessionConfiguration {
  let input: [String: Any]
  let sessionId: String

  let targetAudioFile: URL
  let captureDirectory: URL
  let careAudioFiles: [URL]

  let totalDurationMs: Double
  let learningDurationMs: Double
  let restDurationMs: Double
  let stressCareDurationMs: Double

  let maxPendingCaptureBytes: Int64
  let vadSettings: VADSettings

  let recoveryMetadata: [String: Any]
  let notificationText: [String: String]

  var cycleDurationMs: Double { learningDurationMs + restDurationMs + stressCareDurationMs }

  init(_ input: [String: Any]) throws {
    self.input = input

    func requiredNumber(_ key: String) throws -> Double {
      guard let value = input[key] as? NSNumber, CFGetTypeID(value) != CFBooleanGetTypeID(),
        value.doubleValue.isFinite
      else {
        throw EngineFailure("audio-engine-failed", "Invalid \(key)")
      }

      return value.doubleValue
    }

    guard let sessionId = input["sessionId"] as? String,
      sessionId.range(of: "^[A-Za-z0-9_-]{1,200}$", options: .regularExpression) != nil
    else {
      throw EngineFailure("audio-engine-failed", "Invalid session ID")
    }
    self.sessionId = sessionId

    func localURL(_ value: Any?) throws -> URL {
      guard let string = value as? String, let url = URL(string: string), url.isFileURL else {
        throw EngineFailure("audio-source-unavailable", "Audio paths must be local file URLs")
      }

      return url.standardizedFileURL
    }

    targetAudioFile = try localURL(input["targetAudioUri"])
    captureDirectory = try localURL(input["captureDirectoryUri"])

    totalDurationMs = try requiredNumber("totalDurationMs")
    learningDurationMs = try requiredNumber("learningDurationMs")
    restDurationMs = try requiredNumber("restDurationMs")
    stressCareDurationMs = try requiredNumber("stressCareDurationMs")

    let maximum = try requiredNumber("maxPendingCaptureBytes")
    guard validDurations(totalDurationMs, learningDurationMs, restDurationMs, stressCareDurationMs),
      maximum > 0, maximum < Double(Int64.max)
    else {
      throw EngineFailure("audio-engine-failed", "Invalid session duration or storage limit")
    }
    maxPendingCaptureBytes = Int64(maximum)

    careAudioFiles = try (input["stressCareAudioUris"] as? [String] ?? []).map { try localURL($0) }
    guard stressCareDurationMs == 0 || !careAudioFiles.isEmpty else {
      throw EngineFailure("audio-source-unavailable", "Stress care requires local audio tracks")
    }

    guard let identity = input["recovery"] as? [String: Any],
      let wordID = identity["wordId"] as? String, !wordID.isEmpty,
      let word = identity["word"] as? String, !word.isEmpty,
      let source = identity["sourceType"] as? String,
      ["preset", "recording"].contains(source), let started = identity["startedAt"] as? String,
      !started.isEmpty
    else {
      throw EngineFailure("audio-engine-failed", "Recovery identity is incomplete")
    }
    recoveryMetadata = identity

    guard let labels = input["notification"] as? [String: String],
      ["learningSubtitle", "restSubtitle", "stressCareSubtitle", "pausedSubtitle"].allSatisfy({
        labels[$0] != nil
      })
    else {
      throw EngineFailure("audio-engine-failed", "Notification translations are required")
    }
    notificationText = labels

    vadSettings = try JSONDecoder().decode(
      VADSettings.self, from: JSONSerialization.data(withJSONObject: input["vad"] ?? [:]))
    try vadSettings.validate()
  }
}

private final class SessionEngine: NSObject, AVAudioPlayerDelegate {
  let queue: DispatchQueue
  private let sendEvent: (String, [String: Any]) -> Void
  let persistence: SessionPersistence

  private let session = AVAudioSession.sharedInstance()

  private var configuration: SessionConfiguration?
  private var state = "idle"

  private var elapsedBeforeRunMs: Double = 0
  private var runningStartedAtMs: Double = 0
  private var phasePosition = PhasePosition(cycle: 1, phase: "learning", elapsed: 0)
  private var timer: DispatchSourceTimer?

  private var audioEngine: AVAudioEngine?
  private var targetPlayer: AVAudioPlayer?
  private var carePlayer: AVAudioPlayer?
  private var chosenCare: URL?

  private var detector: SpeechDetector?
  private var pendingSamples: [Int16] = []

  private var nextPlaybackElapsedMs: Double = 0
  private var echoGuardUntilMs: Double = 0
  private var lastPlaybackStartDelayMs: Double?
  private var targetPlaybackCount = 0
  private var playbackStartedAtMs: Double?
  private var playbackRemainingMs = 0.0
  private var lastFailure: [String: Any]?

  private var lastProgressSecond = -1
  private var lastCheckpointElapsedMs: Double = 0

  private var observers: [NSObjectProtocol] = []
  private var remoteTargets: [(MPRemoteCommand, Any)] = []

  private var rebuilding = false
  private var resumeAfterInterruption = false
  private var failureInProgress = false

  init(queue: DispatchQueue, emit: @escaping (String, [String: Any]) -> Void) {
    self.queue = queue
    self.sendEvent = emit

    let files = FileManager.default
    persistence = SessionPersistence(
      directory: files.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        .appendingPathComponent("session-audio-engine"),
      captures: files.urls(for: .documentDirectory, in: .userDomainMask)[0].appendingPathComponent(
        "recordings/session-captures"))
    super.init()

    observe(AVAudioSession.interruptionNotification) { engine, note in engine.interruption(note) }
    observe(AVAudioSession.routeChangeNotification) { engine, note in
      guard engine.state == "running",
        let reason = note.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt,
        [AVAudioSession.RouteChangeReason.newDeviceAvailable.rawValue,
         AVAudioSession.RouteChangeReason.oldDeviceUnavailable.rawValue].contains(reason)
      else {
        return
      }
      engine.rebuild()
    }
    observe(AVAudioSession.mediaServicesWereResetNotification) { engine, _ in engine.rebuild() }
  }

  private func observe(
    _ name: Notification.Name, _ block: @escaping (SessionEngine, Notification) -> Void
  ) {
    observers.append(
      NotificationCenter.default.addObserver(forName: name, object: nil, queue: nil) {
        [weak self] note in
        self?.queue.async { [weak self] in
          guard let self else {
            return
          }
          block(self, note)
        }
      })
  }

  private var active: Bool {
    ["starting", "running", "paused", "interrupted", "stopping"].contains(state)
  }

  private func currentElapsedRunningMs() -> Double {
    guard let config = configuration else {
      return 0
    }

    var elapsedRunningMs = elapsedBeforeRunMs
    if state == "running" {
      elapsedRunningMs += max(0, continuousMilliseconds() - runningStartedAtMs)
    }

    return min(config.totalDurationMs, elapsedRunningMs)
  }

  private func emit(_ event: String, _ body: [String: Any]) {
    if event == "onFailure" { lastFailure = body }
    sendEvent(event, body)
  }

  private func startTargetPlayback() throws {
    let requestedAt = continuousMilliseconds()
    guard let player = targetPlayer else {
      throw EngineFailure("audio-engine-failed", "Target player is unavailable")
    }
    player.currentTime = 0
    playbackRemainingMs = player.duration * 1000
    guard player.play() else {
      throw EngineFailure("audio-engine-failed", "Target playback failed")
    }
    lastPlaybackStartDelayMs = max(0, continuousMilliseconds() - requestedAt)
    targetPlaybackCount += 1
    playbackStartedAtMs = continuousMilliseconds()
    nextPlaybackElapsedMs = .infinity
  }

  private func finishTargetPlayback() {
    guard let started = playbackStartedAtMs else { return }
    playbackStartedAtMs = nil
    guard let id = configuration?.sessionId else { return }
    emit("onTargetPlayback", [
      "sessionId": id,
      "sequence": targetPlaybackCount,
      "durationMs": min(playbackRemainingMs, max(0, continuousMilliseconds() - started)),
      "startDelayMs": lastPlaybackStartDelayMs as Any? ?? NSNull(),
    ])
  }

  func snapshot() -> [String: Any] {
    let elapsedRunningMs = currentElapsedRunningMs()
    let currentPhase =
      configuration.map { config in
        sessionPosition(
          elapsed: elapsedRunningMs, total: config.totalDurationMs,
          learning: config.learningDurationMs, rest: config.restDurationMs,
          care: config.stressCareDurationMs)
      } ?? phasePosition

    return [
      "sessionId": configuration?.sessionId as Any? ?? NSNull(),
      "state": state,
      "elapsedRunningMs": elapsedRunningMs,
      "cycle": currentPhase.cycle,
      "phase": currentPhase.phase,
      "phaseElapsedMs": currentPhase.elapsed,
      "isTargetPlaying": state == "running" && (targetPlayer?.isPlaying ?? false),
      "savedAt": isoNow(),
      "lastPlaybackStartDelayMs": lastPlaybackStartDelayMs as Any? ?? NSNull(),
      "targetPlaybackCount": targetPlaybackCount,
      "failure": lastFailure as Any? ?? NSNull(),
    ]
  }

  func start(_ input: [String: Any]) throws -> [String: Any] {
    if active {
      guard input["sessionId"] as? String == configuration?.sessionId else {
        throw EngineFailure("audio-engine-failed", "Another session is active")
      }

      return snapshot()
    }

    guard try persistence.readRecovery() == nil else {
      throw EngineFailure("storage-unavailable", "Commit pending session recovery before starting")
    }

    let config = try SessionConfiguration(input)
    guard session.recordPermission == .granted else {
      throw EngineFailure("permission-denied", "Microphone permission is required")
    }

    guard config.captureDirectory.path == persistence.captures.standardizedFileURL.path else {
      throw EngineFailure(
        "storage-unavailable", "Capture directory must be Documents/recordings/session-captures")
    }

    for source in [config.targetAudioFile] + config.careAudioFiles
    where !FileManager.default.isReadableFile(atPath: source.path) {
      throw EngineFailure(
        "audio-source-unavailable", "Cannot read audio: \(source.lastPathComponent)")
    }

    do {
      try persistence.prepare()
      _ = try persistence.pending()

      configuration = config
      elapsedBeforeRunMs = 0
      phasePosition = PhasePosition(cycle: 1, phase: "learning", elapsed: 0)
      state = "starting"

      lastProgressSecond = -1
      lastCheckpointElapsedMs = 0
      nextPlaybackElapsedMs = 0
      lastPlaybackStartDelayMs = nil
      targetPlaybackCount = 0
      playbackStartedAtMs = nil
      lastFailure = nil
      emit("onStateChanged", snapshot())

      detector = SpeechDetector(config.vadSettings)
      try acquireAudio()

      targetPlayer = try AVAudioPlayer(contentsOf: config.targetAudioFile)
      guard let target = targetPlayer, target.duration.isFinite, target.duration > 0,
        target.prepareToPlay()
      else {
        throw EngineFailure("audio-source-unavailable", "Target audio cannot be decoded")
      }
      target.delegate = self
      target.isMeteringEnabled = true

      runningStartedAtMs = continuousMilliseconds()
      state = "running"
      try checkpoint()

      installRemoteControls()

      let source = DispatchSource.makeTimerSource(queue: queue)
      source.schedule(deadline: .now(), repeating: .milliseconds(80), leeway: .milliseconds(10))
      source.setEventHandler { [weak self] in self?.tick() }
      timer = source
      source.resume()

      emit("onStateChanged", snapshot())
      return snapshot()
    } catch {
      state = "failed"
      cleanupAudio()

      do {
        if let saved = try persistence.readRecovery(),
          let stored = saved["configuration"] as? [String: Any],
          stored["sessionId"] as? String == config.sessionId
        {
          try persistence.clearRecovery(config.sessionId)
        }
      } catch {
        emit("onFailure", failure(error, recoverable: true))
      }

      emit("onFailure", failure(error, recoverable: true))
      emit("onStateChanged", snapshot())
      throw error
    }
  }

  private func acquireAudio() throws {
    rebuilding = true
    defer { rebuilding = false }

    try session.setCategory(
      .playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetoothHFP])
    try session.setActive(true)

    let engine = AVAudioEngine()
    let input = engine.inputNode
    let format = input.outputFormat(forBus: 0)
    guard format.sampleRate > 0, format.channelCount > 0,
      let destination = AVAudioFormat(
        commonFormat: .pcmFormatInt16, sampleRate: 16000, channels: 1, interleaved: false),
      let converter = AVAudioConverter(from: format, to: destination)
    else {
      throw EngineFailure("audio-route-unavailable", "No supported microphone route")
    }

    input.installTap(
      onBus: 0, bufferSize: AVAudioFrameCount(format.sampleRate / 10), format: format
    ) { [weak self] buffer, _ in
      let capacity =
        AVAudioFrameCount(ceil(Double(buffer.frameLength) * 16000 / format.sampleRate)) + 32
      guard let output = AVAudioPCMBuffer(pcmFormat: destination, frameCapacity: capacity) else {
        return
      }

      var supplied = false
      var conversionError: NSError?

      converter.convert(to: output, error: &conversionError) { _, status in
        if supplied {
          status.pointee = .noDataNow
          return nil
        }
        supplied = true
        status.pointee = .haveData
        return buffer
      }

      if let conversionError {
        self?.queue.async { [weak self] in self?.fail(conversionError) }
      } else if let channel = output.int16ChannelData?[0] {
        let samples = Array(UnsafeBufferPointer(start: channel, count: Int(output.frameLength)))
        self?.queue.async { [weak self] in self?.consume(samples) }
      }
    }

    engine.prepare()
    do {
      try engine.start()
      guard engine.isRunning else {
        throw EngineFailure("audio-engine-failed", "Microphone engine did not start")
      }
      audioEngine = engine
    } catch {
      input.removeTap(onBus: 0)
      throw error
    }
  }

  private func releaseAudio(deactivate: Bool) {
    if let audioEngine {
      audioEngine.inputNode.removeTap(onBus: 0)
      audioEngine.stop()
    }
    audioEngine = nil

    targetPlayer?.pause()
    finishTargetPlayback()
    carePlayer?.pause()
    pendingSamples.removeAll(keepingCapacity: true)

    if deactivate {
      try? session.setActive(false, options: .notifyOthersOnDeactivation)
    }
  }

  private func consume(_ samples: [Int16]) {
    guard state == "running", phasePosition.phase != "stress-care",
      !(targetPlayer?.isPlaying ?? false),
      continuousMilliseconds() >= echoGuardUntilMs
    else {
      pendingSamples.removeAll(keepingCapacity: true)
      detector?.reset()
      return
    }

    pendingSamples += samples
    while pendingSamples.count >= 1600 {
      let frame = Array(pendingSamples.prefix(1600))
      pendingSamples.removeFirst(1600)

      if let audio = detector?.consume(frame) {
        do {
          try save(audio)
        } catch {
          fail(error)
          return
        }
      }
    }
  }

  private func save(_ audio: SpeechAudio) throws {
    guard let config = configuration else {
      return
    }

    let capture = try persistence.save(
      audio, sessionId: config.sessionId, phase: phasePosition.phase, cycle: phasePosition.cycle,
      maxBytes: config.maxPendingCaptureBytes)
    emit("onSegmentCaptured", capture.dictionary)
  }

  private func flush() throws {
    if let audio = detector?.flush() {
      try save(audio)
    }
    pendingSamples.removeAll(keepingCapacity: true)
  }

  private func tick() {
    guard state == "running", let config = configuration else {
      return
    }

    do {
      let elapsedRunningMs = currentElapsedRunningMs()
      let nextPhase = sessionPosition(
        elapsed: elapsedRunningMs, total: config.totalDurationMs,
        learning: config.learningDurationMs, rest: config.restDurationMs,
        care: config.stressCareDurationMs)
      if nextPhase.phase != phasePosition.phase {
        try flush()

        targetPlayer?.stop()
        finishTargetPlayback()
        targetPlayer?.currentTime = 0
        carePlayer?.stop()
        carePlayer = nil
        chosenCare = nil

        phasePosition = nextPhase
        nextPlaybackElapsedMs = elapsedRunningMs
        echoGuardUntilMs = continuousMilliseconds() + Double(config.vadSettings.echoTailGuardMs)

        try checkpoint()

        emit("onStateChanged", snapshot())
      } else {
        phasePosition = nextPhase
      }

      if elapsedRunningMs >= config.totalDurationMs {
        _ = try finish("duration-reached")
        return
      }

      if phasePosition.phase == "learning", !(targetPlayer?.isPlaying ?? false),
        elapsedRunningMs >= nextPlaybackElapsedMs
      {
        try flush()

        try startTargetPlayback()
        nextPlaybackElapsedMs = .infinity
        emit("onStateChanged", snapshot())
      } else if phasePosition.phase == "stress-care", chosenCare == nil {
        chosenCare = config.careAudioFiles.randomElement()
        if let track = chosenCare {
          do {
            let player = try AVAudioPlayer(contentsOf: track)
            carePlayer = player
            player.currentTime = min(phasePosition.elapsed / 1000, player.duration)
            if player.currentTime < player.duration {
              player.play()
            }
          } catch {
            emit(
              "onFailure",
              [
                "code": "audio-source-unavailable",
                "message": "Stress care audio is unavailable: \(error.localizedDescription)",
                "recoverable": true,
              ])
          }
        }
      }

      if let player = targetPlayer, player.isPlaying, phasePosition.phase == "learning" {
        player.updateMeters()
        emit("onPlaybackMetering", ["decibels": player.averagePower(forChannel: 0)])
      }

      if elapsedRunningMs - lastCheckpointElapsedMs >= 15000 {
        try checkpoint()
      }

      if Int(elapsedRunningMs / 1000) != lastProgressSecond {
        lastProgressSecond = Int(elapsedRunningMs / 1000)
        emit("onProgress", snapshot())
        updateNowPlaying()
      }
    } catch {
      fail(error)
    }
  }

  func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
    queue.async { [weak self] in
      guard let self, player === self.targetPlayer, self.active, !player.isPlaying else {
        return
      }

      guard flag else {
        self.fail(EngineFailure("audio-engine-failed", "Target playback stopped unexpectedly"))
        return
      }
      self.finishTargetPlayback()
      self.nextPlaybackElapsedMs = self.currentElapsedRunningMs() + player.duration * 1000
      self.echoGuardUntilMs =
        continuousMilliseconds() + Double(self.configuration?.vadSettings.echoTailGuardMs ?? 200)
      self.emit("onStateChanged", self.snapshot())
    }
  }

  func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
    queue.async { [weak self] in
      guard let self, player === self.targetPlayer else {
        return
      }
      self.fail(error ?? EngineFailure("audio-source-unavailable", "Audio decode failed"))
    }
  }

  func pause() throws -> [String: Any] {
    guard state == "running" || state == "interrupted" else {
      return snapshot()
    }
    elapsedBeforeRunMs = currentElapsedRunningMs()
    state = "paused"
    resumeAfterInterruption = false

    do {
      try flush()
      targetPlayer?.pause()
      finishTargetPlayback()
      carePlayer?.pause()

      try checkpoint()

      emit("onStateChanged", snapshot())
      updateNowPlaying()
      return snapshot()
    } catch {
      fail(error)
      throw error
    }
  }

  func resume(automatically: Bool = false) throws -> [String: Any] {
    guard state == "paused" || state == "interrupted" else {
      return snapshot()
    }

    do {
      if audioEngine?.isRunning != true {
        releaseAudio(deactivate: false)
        try acquireAudio()
      }

      runningStartedAtMs = continuousMilliseconds()
      state = "running"

      if phasePosition.phase == "stress-care", let player = carePlayer {
        player.currentTime = min(phasePosition.elapsed / 1000, player.duration)
        if player.currentTime < player.duration {
          player.play()
        }
      } else if phasePosition.phase == "learning" {
        try startTargetPlayback()
      }
      lastFailure = nil

      echoGuardUntilMs =
        continuousMilliseconds() + Double(configuration?.vadSettings.echoTailGuardMs ?? 200)

      try checkpoint()

      emit("onStateChanged", snapshot())
      updateNowPlaying()
      return snapshot()
    } catch {
      elapsedBeforeRunMs = currentElapsedRunningMs()
      if automatically {
        fail(error)
      } else {
        state = "paused"
        releaseAudio(deactivate: true)
        emit("onFailure", failure(error, recoverable: true))
        emit("onStateChanged", snapshot())
      }
      throw error
    }
  }

  func stop() throws -> [String: Any] {
    guard active else {
      return snapshot()
    }

    return try finish("user-stopped")
  }
  private func finish(_ reason: String) throws -> [String: Any] {
    elapsedBeforeRunMs = currentElapsedRunningMs()
    state = "stopping"

    do {
      try flush()
    } catch {
      fail(error)
      throw error
    }

    cleanupAudio()
    lastFailure = nil
    state = reason == "duration-reached" ? "completed" : "idle"

    do {
      try checkpoint(reason: reason)
    } catch {
      fail(error)
      throw error
    }

    emit("onStateChanged", snapshot())
    return snapshot()
  }

  private func checkpoint(reason: String? = nil) throws {
    guard let config = configuration else {
      return
    }

    let currentSnapshot = snapshot()
    var record: [String: Any] = [
      "configuration": config.input, "elapsedRunningMs": currentSnapshot["elapsedRunningMs"]!,
      "cycle": currentSnapshot["cycle"]!, "phase": currentSnapshot["phase"]!,
      "phaseElapsedMs": currentSnapshot["phaseElapsedMs"]!,
      "savedAt": currentSnapshot["savedAt"]!,
      "targetPlaybackCount": targetPlaybackCount,
      "failure": lastFailure as Any? ?? NSNull(),
    ]
    if let reason {
      record["reason"] = reason
    }

    try persistence.writeRecovery(record)
    lastCheckpointElapsedMs = currentElapsedRunningMs()
  }

  private func failure(_ error: Error, recoverable: Bool) -> [String: Any] {
    let code: String
    if let knownFailure = error as? EngineFailure {
      code = knownFailure.code
    } else if (error as NSError).domain == NSCocoaErrorDomain {
      code = "storage-unavailable"
    } else {
      code = "audio-engine-failed"
    }

    return [
      "code": code,
      "message": error.localizedDescription,
      "recoverable": recoverable,
    ]
  }

  private func fail(_ error: Error) {
    guard !failureInProgress else {
      return
    }
    failureInProgress = true
    elapsedBeforeRunMs = currentElapsedRunningMs()
    state = "failed"

    if let audio = detector?.flush() {
      do {
        try save(audio)
      } catch {
        emit("onFailure", failure(error, recoverable: true))
      }
    }

    cleanupAudio()
    lastFailure = failure(error, recoverable: true)
    do {
      try checkpoint(reason: "failure")
    } catch {
      emit("onFailure", failure(error, recoverable: true))
    }

    emit("onFailure", failure(error, recoverable: true))
    emit("onStateChanged", snapshot())
    failureInProgress = false
  }

  private func cleanupAudio() {
    timer?.cancel()
    timer = nil

    releaseAudio(deactivate: true)
    targetPlayer?.stop()
    targetPlayer = nil
    carePlayer?.stop()
    carePlayer = nil
    chosenCare = nil

    DispatchQueue.main.async {
      for (command, target) in self.remoteTargets {
        command.removeTarget(target)
        command.isEnabled = false
      }
      self.remoteTargets.removeAll()
      MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    }
  }

  private func interruption(_ note: Notification) {
    guard active, let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
      let type = AVAudioSession.InterruptionType(rawValue: raw)
    else {
      return
    }

    if type == .began {
      resumeAfterInterruption = state == "running"
      elapsedBeforeRunMs = currentElapsedRunningMs()
      if state == "running" {
        state = "interrupted"
      }

      do {
        try flush()
        releaseAudio(deactivate: false)
        try checkpoint()

        emit("onStateChanged", snapshot())
        updateNowPlaying()
      } catch {
        fail(error)
      }
    } else {
      let options = AVAudioSession.InterruptionOptions(
        rawValue: note.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0)
      if resumeAfterInterruption && options.contains(.shouldResume) {
        _ = try? resume(automatically: true)
      } else if state == "paused", options.contains(.shouldResume) {
        do {
          releaseAudio(deactivate: false)
          try acquireAudio()
        } catch {
          releaseAudio(deactivate: true)
          emit("onFailure", failure(error, recoverable: true))
        }
      }
      resumeAfterInterruption = false
    }
  }

  private func rebuild() {
    guard active, !rebuilding else {
      return
    }

    let wasRunning = state == "running"
    elapsedBeforeRunMs = currentElapsedRunningMs()
    if wasRunning {
      state = "interrupted"
    }

    do {
      try flush()
      releaseAudio(deactivate: false)

      if let config = configuration {
        targetPlayer = try AVAudioPlayer(contentsOf: config.targetAudioFile)
        targetPlayer?.delegate = self
        targetPlayer?.isMeteringEnabled = true
        if let chosenCare {
          carePlayer = try AVAudioPlayer(contentsOf: chosenCare)
          carePlayer?.currentTime = min(phasePosition.elapsed / 1000, carePlayer?.duration ?? 0)
        }
      }

      try acquireAudio()
      if wasRunning {
        _ = try resume(automatically: true)
      } else {
        try checkpoint()
        updateNowPlaying()
      }
    } catch {
      if wasRunning {
        if state != "failed" { fail(error) }
      } else {
        state = "paused"
        releaseAudio(deactivate: true)
        emit("onFailure", failure(error, recoverable: true))
        emit("onStateChanged", snapshot())
      }
    }
  }

  private func installRemoteControls() {
    guard let sessionId = configuration?.sessionId else { return }
    DispatchQueue.main.async {
      let center = MPRemoteCommandCenter.shared()
      for (command, action) in [
        (center.playCommand, "resume"), (center.pauseCommand, "pause"), (center.stopCommand, "stop"),
        (center.togglePlayPauseCommand, "toggle"),
      ] {
        command.isEnabled = true
        let target = command.addTarget { [weak self] _ in
          guard let self else { return .commandFailed }
          self.queue.async {
            guard self.configuration?.sessionId == sessionId else { return }
            do {
              if action == "stop" {
                _ = try self.stop()
              } else if action == "pause" || (action == "toggle" && self.state == "running") {
                _ = try self.pause()
              } else {
                _ = try self.resume()
              }
            } catch {
              self.emit("onFailure", self.failure(error, recoverable: true))
            }
          }
          return .success
        }
        self.remoteTargets.append((command, target))
      }
      center.changePlaybackPositionCommand.isEnabled = false
      center.nextTrackCommand.isEnabled = false
      center.previousTrackCommand.isEnabled = false
      center.seekForwardCommand.isEnabled = false
      center.seekBackwardCommand.isEnabled = false
      center.skipForwardCommand.isEnabled = false
      center.skipBackwardCommand.isEnabled = false
    }
    updateNowPlaying()
  }

  private func updateNowPlaying() {
    guard let config = configuration, active else {
      return
    }

    let subtitleKey: String
    if state == "paused" || state == "interrupted" {
      subtitleKey = "pausedSubtitle"
    } else {
      switch phasePosition.phase {
      case "learning":
        subtitleKey = "learningSubtitle"
      case "rest":
        subtitleKey = "restSubtitle"
      default:
        subtitleKey = "stressCareSubtitle"
      }
    }

    let totalCycles = Int(ceil(config.totalDurationMs / config.cycleDurationMs))
    let subtitle = (config.notificationText[subtitleKey] ?? "")
      .replacingOccurrences(of: "%{cycle}", with: String(phasePosition.cycle))
      .replacingOccurrences(of: "%{total}", with: String(totalCycles))

    let information: [String: Any] = [
      MPMediaItemPropertyTitle: config.recoveryMetadata["word"] ?? "",
      MPMediaItemPropertyArtist: subtitle,
      MPMediaItemPropertyPlaybackDuration: config.totalDurationMs / 1000,
      MPNowPlayingInfoPropertyElapsedPlaybackTime: currentElapsedRunningMs() / 1000,
      MPNowPlayingInfoPropertyPlaybackRate: state == "running" ? 1.0 : 0.0,
      MPNowPlayingInfoPropertyDefaultPlaybackRate: 1.0,
    ]
    DispatchQueue.main.async {
      MPNowPlayingInfoCenter.default().nowPlayingInfo = information
    }
  }

  func pendingRecovery() throws -> [String: Any]? {
    guard let record = try persistence.readRecovery() else {
      return nil
    }

    return try recoveredSession(record)
  }

  func clearRecovery(_ sessionId: String) throws {
    guard !active else {
      throw EngineFailure("storage-unavailable", "Cannot clear an active session")
    }

    try persistence.clearRecovery(sessionId)
  }

  func shutdown() {
    if active {
      fail(EngineFailure("audio-engine-failed", "Native module detached during session"))
    }

    cleanupAudio()
    observers.forEach { NotificationCenter.default.removeObserver($0) }
    observers.removeAll()
  }
}
