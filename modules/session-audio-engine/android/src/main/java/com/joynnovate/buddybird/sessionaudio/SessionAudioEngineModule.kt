package com.joynnovate.buddybird.sessionaudio

import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SessionAudioEngineModule : Module() {
    private val engine by lazy {
        SessionEngine.get(appContext.reactContext ?: throw Exceptions.ReactContextLost())
    }

    private fun reject(promise: Promise, error: Throwable) {
        promise.reject(
            (error as? EngineFailure)?.code
                ?: if (error is java.io.IOException || error is org.json.JSONException) {
                    "storage-unavailable"
                } else {
                    "audio-engine-failed"
                },
            error.message,
            error,
        )
    }

    private fun command(promise: Promise, block: (SessionEngine) -> Any?) {
        val owner = engine
        owner.dispatch {
            try {
                promise.resolve(block(owner))
            } catch (error: Exception) {
                reject(promise, error)
            }
        }
    }

    override fun definition() = ModuleDefinition {
        Name("SessionAudioEngine")
        Events("onStateChanged", "onProgress", "onSegmentCaptured", "onFailure", "onPlaybackMetering", "onTargetPlayback")

        OnCreate { engine.events = { event, body -> sendEvent(event, body) } }
        OnDestroy { engine.events = null }

        AsyncFunction("start") { input: Map<String, Any?>, promise: Promise ->
            val owner = engine
            owner.dispatch {
                owner.requestStart(input) { result, failure ->
                    if (failure != null) reject(promise, failure) else promise.resolve(result)
                }
            }
        }
        AsyncFunction("pause") { promise: Promise -> command(promise) { it.pause() } }
        AsyncFunction("resume") { promise: Promise -> command(promise) { it.resume() } }
        AsyncFunction("stop") { promise: Promise -> command(promise) { it.stop() } }
        AsyncFunction("getSnapshot") { promise: Promise -> command(promise) { it.snapshot() } }
        AsyncFunction("getPendingRecovery") { promise: Promise -> command(promise) { it.pendingRecovery() } }
        AsyncFunction("clearPendingRecovery") { id: String, promise: Promise ->
            command(promise) { it.clearRecovery(id); null }
        }
        AsyncFunction("getCaptureChanges") { promise: Promise -> command(promise) { it.persistence.changes() } }
        AsyncFunction("ackCaptureChanges") { ids: List<String>, names: List<String>, promise: Promise ->
            command(promise) { it.persistence.acknowledge(ids, names); null }
        }
    }
}
