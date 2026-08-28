import AVFoundation
import Darwin.Mach
import Foundation
import os

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
  // 스트레스 케어 트랙 전용 노드 (BB-380). 목표 음원과 파일 포맷이 달라 연결 포맷을 공유할 수
  // 없으므로 별도 노드를 쓴다. 트랙 3종은 같은 인코딩이라 디코딩 포맷이 동일하므로 엔진 활성화
  // 시점에 한 번만 연결한다 — 러닝 엔진에 connect 를 반복하면 NSException 크래시 표면이 된다.
  private var carePlayerNode: AVAudioPlayerNode?
  // 스케줄된 파일이 재생 끝까지 해제되지 않게 붙잡는 lifetime anchor — 다른 용도로 읽지 않는다.
  private var careAudioFile: AVAudioFile?
  // 케어 노드가 연결된 포맷. nil 이면 연결 실패 상태라 케어 재생을 건너뛴다 (세션은 유지).
  private var careConnectedFormat: AVAudioFormat?
  // 한 케어 구간(사이클) 안에서는 트랙을 고정한다 — 일시정지·인터럽션 복귀가 재추첨하면
  // 같은 구간에서 다른 트랙의 중간부터 이어지기 때문 (FR-18 "구간마다 랜덤 1개").
  private var careSelectedUri: String?
  private var careSelectedCycle = -1
  private var playbackGeneration = 0
  private var lastStopRecord: [String: Any]?
  private var capturePipeline: VoiceCapturePipeline?
  private var targetPlaying = false
  private var captureAllowedAfterMs: Int64 = 0
  // BB-285 audio_delay: 의도(스케줄 진입)→play() 디스패치 완료까지의 근사 지연. 관찰 전용.
  // AVAudioPlayerNode 첫 render 관측이 번거로워 스케줄 지연 근사로 측정한다 (Android는 실제 시작 관측).
  private var lastPlaybackStartDelayMs: Int64?
  private let nowPlaying = SessionNowPlaying()
  // 인터럽션이 사용자 일시정지 중에 왔는지 기억한다 — 종료 통지에서 재생을 재개하지 않고
  // pause 계약(엔진·마이크 유지)만 복원하기 위해서다. 매 .began 에서 다시 계산된다.
  private var pausedBeforeInterruption = false
  private let log = Logger(subsystem: "com.joynnovate.buddybird", category: "session-audio-engine")

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
            input.restDurationMs >= 0,
            input.stressCareDurationMs >= 0 else {
        throw SessionAudioEngineError.invalidInput("Session durations and sessionId are required.")
      }

      let nextConfiguration = NativeSessionConfiguration(input)
      do {
        try validateFiles(nextConfiguration)
        configuration = nextConfiguration
        state = "starting"
        elapsedBeforeRunMs = 0
        runningSinceMs = nil
        lastStopRecord = nil
        lastPlaybackStartDelayMs = nil
        careSelectedUri = nil
        careSelectedCycle = -1
        try activateAudio()
        runningSinceMs = monotonicMilliseconds()
        state = "running"
        startTimer()
        scheduleTargetPlaybackIfNeeded()
        scheduleStressCarePlaybackIfNeeded()
        try persist(reason: nil)
        activateNowPlaying()
      } catch {
        // start 실패 시 세션은 성립하지 않은 것으로 본다 — configuration을 유지하면
        // 이후 모든 start()가 sessionAlreadyRunning으로 거부돼 엔진이 고착된다.
        // rejection에는 code가 실리지 않으므로 롤백 전에 onFailure로 code를 내보낸다.
        stopAudio()
        try? persist(reason: "failure")
        emitFailure(error)
        configuration = nil
        state = "idle"
        throw error
      }
      emitStateChanged()
      return snapshotDictionary()
    }
  }

  func pause() throws -> [String: Any] { try queue.sync { try pauseLocked() } }

  func resume() throws -> [String: Any] { try queue.sync { try resumeLocked() } }

  func stop() throws -> [String: Any] { try queue.sync { try stopLocked() } }

  // *Locked 는 이미 queue 위에서 실행 중일 때 쓴다. 잠금화면 원격 커맨드가 queue.async 로
  // 들어오는데 거기서 queue.sync 를 부르면 같은 직렬 큐에서 자기 자신을 기다려 교착된다.
  private func pauseLocked() throws -> [String: Any] {
    guard configuration != nil else { throw SessionAudioEngineError.noSession }
    guard state == "running" || state == "interrupted" else { return snapshotDictionary() }
    foldElapsed()
    state = "paused"
    // 마이크를 놓지 않는다 — 놓았다가 잠긴 화면에서 다시 잡으면 iOS(TCC)가 마이크 identity
    // 재구성을 막아(kTCCServiceMicrophone) 재개가 실패한다. 목표 재생만 멈추고 세션·엔진·
    // 마이크는 살려 둔다(일시정지 중 주황 인디케이터는 유지). 녹음은 캡처 탭의 running 가드로 막는다.
    playbackGeneration += 1
    targetPlaying = false
    playerNode?.stop()
    carePlayerNode?.stop()
    try persist(reason: nil)
    emitStateChanged()
    return snapshotDictionary()
  }

  private func resumeLocked() throws -> [String: Any] {
    guard configuration != nil else { throw SessionAudioEngineError.noSession }
    guard state == "paused" || state == "interrupted" else { return snapshotDictionary() }
    state = "starting"
    do {
      // 마이크를 놓지 않은 일시정지는 엔진이 살아 있어 재획득이 필요 없다 — 잠긴 화면에서
      // .playAndRecord 재활성화는 TCC가 막으므로 살아 있으면 건드리지 않는다. 인터럽션 등으로
      // 엔진이 내려간(멈춘) 경우에만 다시 활성화한다.
      if audioEngine?.isRunning != true {
        try activateAudio()
      }
      runningSinceMs = monotonicMilliseconds()
      state = "running"
      startTimer()
      scheduleTargetPlaybackIfNeeded()
      scheduleStressCarePlaybackIfNeeded()
      try persist(reason: nil)
    } catch {
      // 재개 실패는 복구 가능한 상황이다 — 잠긴 화면에서 TCC가 마이크 재획득을 막으면
      // 앱을 열어 다시 시도하면 된다. 세션을 죽이지 않고 paused로 되돌린다.
      // stopAudio()는 부르지 않는다 — 엔진이 살아 있는 일시정지(예: persist 실패)에서
      // 마이크·세션까지 내리면 pause 계약이 깨져 이후 잠금화면 재개가 전부 TCC에 막힌다.
      // activateAudio() 실패는 부분 생성물이 지역 변수라 별도 정리가 필요 없다.
      state = "paused"
      runningSinceMs = nil
      emitStateChanged()
      throw error
    }
    emitStateChanged()
    return snapshotDictionary()
  }

  private func stopLocked() throws -> [String: Any] {
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
    // 세션이 끝났으므로 잠금화면 위젯과 원격 커맨드를 걷어낸다.
    nowPlaying.deactivate()
    return result
  }

  func snapshot() -> [String: Any]? {
    queue.sync { configuration == nil ? nil : snapshotDictionary() }
  }

  // 두 스토어는 내부 동기화가 없다. 캡처 파이프라인(coordinator 큐)과 Expo AsyncFunction
  // 스레드가 동시에 접근하면 배열 경합으로 크래시하므로 이 경계에서 큐로 직렬화한다.
  func pendingRecovery() -> [String: Any]? {
    queue.sync {
      guard let record = recoveryStore.load() else { return nil }
      return recoveryDictionary(record: record)
    }
  }

  func clearPendingRecovery(sessionId: String) throws {
    try queue.sync { try recoveryStore.clear(sessionId: sessionId) }
  }

  func unstoredSegments() -> [[String: Any]] {
    queue.sync { captureStore.all().map(\.dictionary) }
  }

  func markSegmentsStored(ids: [String]) throws {
    try queue.sync { try captureStore.markStored(ids: Set(ids)) }
  }

  func destroy() {
    queue.sync {
      timer?.cancel()
      timer = nil
      stopAudio()
      nowPlaying.deactivate()
    }
    NotificationCenter.default.removeObserver(self)
  }

  @objc private func handleInterruption(_ notification: Notification) {
    guard let rawType = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
          let type = AVAudioSession.InterruptionType(rawValue: rawType) else { return }
    queue.async {
      if type == .began {
        // paused 포함 — 일시정지도 엔진·마이크를 잡고 있으므로(활성 세션) 인터럽션이 오면
        // OS 가 엔진을 내린다. 무시하면 엔진만 죽은 paused 가 남아 이후 잠금화면 재개가
        // 전부 TCC 재획득에 막힌다.
        guard self.state == "running" || self.state == "paused" else { return }
        self.pausedBeforeInterruption = self.state == "paused"
        self.foldElapsed()
        self.state = "interrupted"
        self.stopAudio()
        try? self.persist(reason: nil)
        self.emitStateChanged()
        return
      }
      let rawOptions = notification.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0
      let options = AVAudioSession.InterruptionOptions(rawValue: rawOptions)
      guard self.state == "interrupted" else { return }
      if self.pausedBeforeInterruption {
        // 일시정지 중이던 세션은 재생을 재개하지 않는다 — 인터럽션 종료 통지는 백그라운드
        // 재활성화가 허용되는 창이므로, 여기서 엔진·마이크만 되살려 pause 계약을 복원해야
        // 이후 잠금화면 재개가 TCC 에 막히지 않는다.
        self.pausedBeforeInterruption = false
        if options.contains(.shouldResume) {
          do {
            try self.activateAudio()
          } catch {
            // 복원 실패: 엔진 없는 paused 로 강등 — 재개는 앱 화면에서만 가능해진다.
            self.logFailure("restore-paused-audio", error)
          }
        }
        self.state = "paused"
        try? self.persist(reason: nil)
        self.emitStateChanged()
        return
      }
      guard options.contains(.shouldResume) else { return }
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
      guard self.configuration != nil,
            self.state == "running" || self.state == "interrupted" || self.state == "paused" else { return }
      let wasPaused = self.state == "paused"
      self.foldElapsed()
      self.stopAudio()
      if wasPaused {
        // 일시정지 중 미디어 데몬 리셋: 엔진 객체가 전부 무효화되므로 재생은 재개하지 않고
        // 엔진·마이크만 다시 세워 pause 계약을 복원한다.
        do {
          try self.activateAudio()
        } catch {
          self.logFailure("rebuild-paused-audio", error)
        }
        try? self.persist(reason: nil)
        self.emitStateChanged()
        return
      }
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
      scheduleStressCarePlaybackIfNeeded()
      try persist(reason: nil)
      emitStateChanged()
    } catch {
      markFailed(error)
    }
  }

  private func validateFiles(_ configuration: NativeSessionConfiguration) throws {
    guard let audioURL = URL(string: configuration.targetAudioUri),
          audioURL.isFileURL,
          FileManager.default.fileExists(atPath: audioURL.path) else {
      throw SessionAudioEngineError.audioSourceUnavailable
    }
    if configuration.careDurationMs > 0 {
      guard !configuration.careAudioUris.isEmpty else {
        throw SessionAudioEngineError.invalidInput("Stress care audio URIs are required.")
      }
      for uriString in configuration.careAudioUris {
        guard let url = URL(string: uriString), url.isFileURL, FileManager.default.fileExists(atPath: url.path) else {
          throw SessionAudioEngineError.audioSourceUnavailable
        }
      }
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
      // 케어 노드는 여기서 한 번만 연결한다. 트랙 3종의 디코딩 포맷이 동일하므로 첫 트랙의
      // 포맷을 대표로 쓴다. 연결 실패는 케어만 무음으로 강등하고 세션은 살린다 (NFR-01).
      let carePlayer = AVAudioPlayerNode()
      engine.attach(carePlayer)
      careConnectedFormat = nil
      if configuration.careDurationMs > 0,
         let firstCareUri = configuration.careAudioUris.first,
         let firstCareURL = URL(string: firstCareUri) {
        do {
          let careFormat = try AVAudioFile(forReading: firstCareURL).processingFormat
          engine.connect(carePlayer, to: engine.mainMixerNode, format: careFormat)
          careConnectedFormat = careFormat
        } catch {
          logFailure("stress-care-connect", error)
        }
      }
      let input = engine.inputNode
      let inputFormat = input.inputFormat(forBus: 0)
      guard inputFormat.sampleRate > 0, inputFormat.channelCount > 0 else {
        throw SessionAudioEngineError.audioRouteUnavailable
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
          // 일시정지 중에는 마이크를 살려 두지만 녹음은 하지 않는다 — running 일 때만 캡처한다.
          guard self.state == "running" else { return }
          let samples = self.resampleTo16k(mono, sourceRate: sampleRate)
          let position = self.phasePosition()
          // 스트레스 케어 구간은 스피커에서 트랙이 연속 재생돼 echo tail guard 로 배제할 수 없으므로
          // 구간 전체를 캡처 판정에서 제외한다 (BB-380).
          let allowed = !self.targetPlaying
            && position.phase != "stress-care"
            && self.monotonicMilliseconds() >= self.captureAllowedAfterMs
          self.capturePipeline?.process(samples: samples, captureAllowed: allowed, phase: position.phase, cycle: position.cycle)
        }
      }
      engine.prepare()
      try engine.start()
      audioEngine = engine
      playerNode = player
      carePlayerNode = carePlayer
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
    carePlayerNode?.stop()
    audioEngine?.inputNode.removeTap(onBus: 0)
    audioEngine?.stop()
    playerNode = nil
    carePlayerNode = nil
    audioFile = nil
    careAudioFile = nil
    careConnectedFormat = nil
    audioEngine = nil
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
  }

  private func scheduleTargetPlaybackIfNeeded() {
    guard state == "running", phasePosition().phase == "learning",
          let playerNode, let audioFile else { return }
    let generation = playbackGeneration
    targetPlaying = true
    let playbackIntentAtMs = monotonicMilliseconds()
    lastPlaybackStartDelayMs = nil
    capturePipeline?.flush()
    emitStateChanged()
    playerNode.scheduleFile(audioFile, at: nil, completionCallbackType: .dataPlayedBack) { [weak self] _ in
      guard let self else { return }
      let durationSeconds = Double(audioFile.length) / audioFile.processingFormat.sampleRate
      self.queue.async {
        guard self.playbackGeneration == generation else { return }
        self.targetPlaying = false
        self.captureAllowedAfterMs = self.monotonicMilliseconds() + (self.configuration?.vad.echoTailGuardMs ?? 0)
        self.emitStateChanged()
      }
      self.queue.asyncAfter(deadline: .now() + durationSeconds) {
        guard self.playbackGeneration == generation,
              self.state == "running",
              self.phasePosition().phase == "learning" else { return }
        self.scheduleTargetPlaybackIfNeeded()
      }
    }
    playerNode.play()
    // 스케줄 지연 확정 — 확정 시점에 기존 이벤트로만 내보낸다 (신규 이벤트 없음).
    lastPlaybackStartDelayMs = monotonicMilliseconds() - playbackIntentAtMs
    emitStateChanged()
  }

  // 스트레스 케어 구간 진입 시 번들 트랙 중 하나를 랜덤 재생한다 (BB-380, FR-18).
  // 트랙 길이 = 구간 길이(5분)라 1회 스케줄로 충분하고, 구간 종료 시 handleTimer 가 노드를 멈춘다.
  // 재생 실패는 세션을 죽이지 않는다 — 학습·감지가 본체이므로 구간만 무음으로 넘긴다 (NFR-01).
  private func scheduleStressCarePlaybackIfNeeded() {
    guard state == "running", let configuration, configuration.careDurationMs > 0 else { return }
    let position = phasePosition()
    guard position.phase == "stress-care",
          let audioEngine, audioEngine.isRunning,
          let carePlayerNode, let careConnectedFormat else { return }
    // 같은 케어 구간(사이클) 재진입(일시정지·인터럽션 복귀)에는 처음 뽑은 트랙을 유지한다.
    if careSelectedCycle != position.cycle {
      careSelectedCycle = position.cycle
      careSelectedUri = configuration.careAudioUris.randomElement()
    }
    guard let uriString = careSelectedUri, let url = URL(string: uriString) else { return }
    do {
      let file = try AVAudioFile(forReading: url)
      // 연결 포맷과 다른 파일은 재생하지 않는다 — 러닝 엔진 재연결(NSException 표면) 대신 무음.
      // 트랙 3종은 같은 인코딩이라 실전에서는 도달하지 않는 경로다.
      guard file.processingFormat.isEqual(careConnectedFormat) else {
        log.warning("Stress care track format mismatch — skipping playback")
        return
      }
      // 재개로 구간 중간에 들어오면 그 지점부터 이어 재생한다.
      let startFrame = AVAudioFramePosition(Double(position.phaseElapsedMs) / 1000 * file.processingFormat.sampleRate)
      guard startFrame < file.length else { return }
      careAudioFile = file
      carePlayerNode.scheduleSegment(file, startingFrame: startFrame, frameCount: AVAudioFrameCount(file.length - startFrame), at: nil)
      carePlayerNode.play()
    } catch {
      logFailure("stress-care-playback", error)
    }
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
      emitStateChanged()
      return
    }

    let position = phasePosition()
    if position.phase != lastPhase {
      capturePipeline?.flush()
      lastPhase = position.phase
      playerNode?.stop()
      carePlayerNode?.stop()
      playbackGeneration += 1
      targetPlaying = false
      scheduleTargetPlaybackIfNeeded()
      scheduleStressCarePlaybackIfNeeded()
      try? persist(reason: nil)
      emitStateChanged()
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
    let careMs = configuration.careDurationMs
    let cycleDuration = configuration.learningDurationMs + configuration.restDurationMs + careMs
    guard cycleDuration > 0 else { return (1, "learning", 0) }
    let elapsed = elapsedRunningMs()
    if elapsed >= configuration.totalDurationMs && elapsed % cycleDuration == 0 {
      let lastPhase = careMs > 0 ? "stress-care" : "rest"
      let lastPhaseMs = careMs > 0 ? careMs : configuration.restDurationMs
      return (max(1, Int(elapsed / cycleDuration)), lastPhase, lastPhaseMs)
    }
    let completedCycles = elapsed / cycleDuration
    let insideCycle = elapsed % cycleDuration
    let cycle = Int(completedCycles) + 1
    if insideCycle < configuration.learningDurationMs {
      return (cycle, "learning", insideCycle)
    }
    let insideRest = insideCycle - configuration.learningDurationMs
    if insideRest < configuration.restDurationMs || careMs == 0 {
      return (cycle, "rest", insideRest)
    }
    return (cycle, "stress-care", insideRest - configuration.restDurationMs)
  }

  private func snapshotDictionary() -> [String: Any] {
    guard let configuration else { return [:] }
    let position = phasePosition()
    var dictionary: [String: Any] = [
      "sessionId": configuration.sessionId,
      "state": state,
      "elapsedRunningMs": elapsedRunningMs(),
      "cycle": position.cycle,
      "phase": position.phase,
      "phaseElapsedMs": position.phaseElapsedMs,
      "isTargetPlaying": targetPlaying,
      "savedAt": isoNow()
    ]
    if let delayMs = lastPlaybackStartDelayMs { dictionary["lastPlaybackStartDelayMs"] = delayMs }
    return dictionary
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
      "stressCareDurationMs": configuration.careDurationMs,
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
      "stressCareDurationMs": record.configuration.careDurationMs,
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
    stopAudio()
    markFailed(error, code: code)
  }

  // 실패 종단 공통 전이 — code 미지정 시 throw된 에러에서 파생한다.
  private func markFailed(_ error: Error, code: String? = nil) {
    state = "failed"
    try? persist(reason: "failure")
    emitFailure(error, code: code)
    emitStateChanged()
  }

  // 모든 상태 전이는 이 경로로 나간다 — JS 이벤트와 잠금화면 위젯이 어긋나지 않게 한 곳에 묶는다.
  private func emitStateChanged() {
    onStateChanged?(snapshotDictionary())
    refreshNowPlaying()
  }

  // 원격 커맨드는 메인 스레드로 도착한다. 엔진 명령은 오디오 장치를 열고 닫느라 시간이 걸리므로
  // coordinator 직렬 큐로 넘긴다 — 여기서 동기 호출하면 UI 스레드가 막힌다.
  private func activateNowPlaying() {
    nowPlaying.activate(
      SessionNowPlaying.Handlers(
        // 잠금화면 조작 실패는 세션을 깨지 않고 무시하되, 잠금화면·백그라운드에서 일어나
        // 재현이 어려우므로 최소한 로그 단서는 남긴다 (Android AudioForegroundService.runCommand
        // 와 같은 처리).
        play: { [weak self] in self?.queue.async { self?.runRemoteCommand("play") { try self?.resumeLocked() } } },
        pause: { [weak self] in self?.queue.async { self?.runRemoteCommand("pause") { try self?.pauseLocked() } } },
        stop: { [weak self] in self?.queue.async { self?.runRemoteCommand("stop") { try self?.stopLocked() } } }
      )
    )
    refreshNowPlaying()
  }

  private func runRemoteCommand(_ name: String, _ action: () throws -> Any?) {
    do { _ = try action() } catch { logFailure(name, error) }
  }

  private func logFailure(_ name: String, _ error: Error) {
    log.warning("Session \(name, privacy: .public) command failed: \(String(describing: error), privacy: .public)")
  }

  private func refreshNowPlaying() {
    guard let configuration else {
      nowPlaying.deactivate()
      return
    }
    let position = phasePosition()
    let paused = state == "paused" || state == "interrupted"
    // 이 앱 버전 이전에 저장된 복구 기록으로 복원한 세션에는 문구가 없다.
    let copy = configuration.notification
    let subtitle = paused
      ? (copy?.pausedSubtitle ?? "")
      : (copy?.subtitle(phase: position.phase, cycle: position.cycle, totalCycles: configuration.totalCycles) ?? "")
    nowPlaying.update(
      title: configuration.recovery.word,
      subtitle: subtitle,
      isPlaying: state == "running",
      elapsedMs: elapsedRunningMs(),
      durationMs: configuration.totalDurationMs
    )
  }

  private func emitFailure(_ error: Error, code: String? = nil) {
    let resolvedCode = code ?? (error as? SessionAudioEngineError)?.failureCode ?? "audio-engine-failed"
    onFailure?([
      "code": resolvedCode,
      "message": error.localizedDescription,
      "recoverable": false
    ])
  }

  private func isoNow() -> String {
    ISO8601DateFormatter().string(from: Date())
  }
}
