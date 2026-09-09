package com.joynnovate.buddybird.sessionaudio

import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SessionAudioEngineModule : Module() {
    private val engine: SessionEngine
        get() = SessionEngine.get(appContext.reactContext ?: throw Exceptions.ReactContextLost())

    private fun <T> command(block: () -> T): T =
        try {
            block()
        } catch (error: Exception) {
            throw CodedException(
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

    override fun definition() = ModuleDefinition {
        Name("SessionAudioEngine")
        Events("onStateChanged", "onProgress", "onSegmentCaptured", "onFailure")

        OnCreate { engine.events = { event, body -> sendEvent(event, body) } }
        OnDestroy { engine.events = null }

        AsyncFunction("start") { input: Map<String, Any?>, promise: Promise ->
                engine.requestStart(input) { result, failure ->
                    if (failure != null) {
                        promise.reject(
                            (failure as? EngineFailure)?.code ?: "audio-engine-failed",
                            failure.message,
                            failure,
                        )
                    } else {
                        promise.resolve(result)
                    }
                }
            }
            .runOnQueue(Queues.MAIN)
        AsyncFunction("pause") { command { engine.pause() } }.runOnQueue(Queues.MAIN)
        AsyncFunction("resume") { command { engine.resume() } }.runOnQueue(Queues.MAIN)
        AsyncFunction("stop") { command { engine.stop() } }.runOnQueue(Queues.MAIN)
        AsyncFunction("getSnapshot") { engine.snapshot() }.runOnQueue(Queues.MAIN)

        AsyncFunction("getPendingRecovery") { command { engine.pendingRecovery() } }
            .runOnQueue(Queues.MAIN)
        AsyncFunction("clearPendingRecovery") { id: String -> command { engine.clearRecovery(id) } }
            .runOnQueue(Queues.MAIN)
        AsyncFunction("getUnstoredSegments") {
                command { engine.persistence.pending().map { it.toMap() } }
            }
            .runOnQueue(Queues.MAIN)
        AsyncFunction("markSegmentsStored") { ids: List<String> ->
                command { engine.persistence.acknowledge(ids) }
            }
            .runOnQueue(Queues.MAIN)
    }
}
