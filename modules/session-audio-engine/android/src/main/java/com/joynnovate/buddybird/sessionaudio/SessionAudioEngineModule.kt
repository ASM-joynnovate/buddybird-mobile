package com.joynnovate.buddybird.sessionaudio

import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SessionAudioEngineModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SessionAudioEngine")
    Events("onStateChanged", "onProgress", "onSegmentCaptured", "onFailure")

    OnCreate {
      val context = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()
      SessionAudioEngineRuntime.initialize(context)
      SessionAudioEngineRuntime.onStateChanged = { sendEvent("onStateChanged", it) }
      SessionAudioEngineRuntime.onProgress = { sendEvent("onProgress", it) }
      SessionAudioEngineRuntime.onFailure = { sendEvent("onFailure", it) }
      SessionAudioEngineRuntime.onSegmentCaptured = { sendEvent("onSegmentCaptured", it) }
    }

    AsyncFunction("start") { input: SessionAudioEngineStartInputRecord -> SessionAudioEngineRuntime.start(input) }
    AsyncFunction("pause") { SessionAudioEngineRuntime.pause() }
    AsyncFunction("resume") { SessionAudioEngineRuntime.resume() }
    AsyncFunction("stop") { SessionAudioEngineRuntime.stop() }
    AsyncFunction("getSnapshot") { SessionAudioEngineRuntime.getSnapshot() }
    AsyncFunction("getPendingRecovery") { SessionAudioEngineRuntime.getPendingRecovery() }
    AsyncFunction("clearPendingRecovery") { sessionId: String -> SessionAudioEngineRuntime.clearPendingRecovery(sessionId) }
    AsyncFunction("getUnstoredSegments") { SessionAudioEngineRuntime.getUnstoredSegments() }
    AsyncFunction("markSegmentsStored") { ids: List<String> -> SessionAudioEngineRuntime.markSegmentsStored(ids) }

    OnDestroy { SessionAudioEngineRuntime.destroyModule() }
  }
}
