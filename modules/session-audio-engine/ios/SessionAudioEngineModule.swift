import ExpoModulesCore

public final class SessionAudioEngineModule: Module {
  private let engine = SessionAudioEngineCoordinator()

  public func definition() -> ModuleDefinition {
    Name("SessionAudioEngine")

    Events("onStateChanged", "onProgress", "onSegmentCaptured", "onFailure")

    OnCreate {
      engine.onStateChanged = { [weak self] snapshot in self?.sendEvent("onStateChanged", snapshot) }
      engine.onProgress = { [weak self] snapshot in self?.sendEvent("onProgress", snapshot) }
      engine.onFailure = { [weak self] failure in self?.sendEvent("onFailure", failure) }
      engine.onSegmentCaptured = { [weak self] segment in self?.sendEvent("onSegmentCaptured", segment) }
    }

    AsyncFunction("start") { (input: SessionAudioEngineStartInputRecord) in
      try engine.start(input)
    }

    AsyncFunction("pause") { try engine.pause() }
    AsyncFunction("resume") { try engine.resume() }
    AsyncFunction("stop") { try engine.stop() }
    AsyncFunction("getSnapshot") { engine.snapshot() }
    AsyncFunction("getPendingRecovery") { engine.pendingRecovery() }
    AsyncFunction("clearPendingRecovery") { (sessionId: String) in
      try engine.clearPendingRecovery(sessionId: sessionId)
    }
    AsyncFunction("getUnstoredSegments") { engine.unstoredSegments() }
    AsyncFunction("markSegmentsStored") { (ids: [String]) in try engine.markSegmentsStored(ids: ids) }

    OnDestroy { engine.destroy() }
  }
}
