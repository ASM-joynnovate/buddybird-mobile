package com.joynnovate.buddybird.sessionaudio

import android.content.Context
import org.json.JSONObject

class SessionRecoveryStore(context: Context) {
  private val preferences = context.getSharedPreferences("session-audio-engine", Context.MODE_PRIVATE)

  fun save(configuration: NativeSessionConfiguration, snapshot: Map<String, Any?>, reason: String?) {
    val recovery = JSONObject().apply {
      put("wordId", configuration.recovery.wordId)
      put("word", configuration.recovery.word)
      put("sourceType", configuration.recovery.sourceType)
      put("libraryEntryId", configuration.recovery.libraryEntryId)
      put("startedAt", configuration.recovery.startedAt)
    }
    val json = JSONObject().apply {
      put("sessionId", configuration.sessionId)
      put("targetAudioUri", configuration.targetAudioUri)
      put("captureDirectoryUri", configuration.captureDirectoryUri)
      put("totalDurationMs", configuration.totalDurationMs)
      put("learningDurationMs", configuration.learningDurationMs)
      put("restDurationMs", configuration.restDurationMs)
      put("maxPendingCaptureBytes", configuration.maxPendingCaptureBytes)
      put("recovery", recovery)
      put("snapshot", JSONObject(snapshot))
      put("reason", reason)
    }
    check(preferences.edit().putString(KEY, json.toString()).commit()) {
      "Could not persist the session recovery record."
    }
  }

  fun load(): Map<String, Any?>? {
    val raw = preferences.getString(KEY, null) ?: return null
    val json = JSONObject(raw)
    val snapshotJson = json.getJSONObject("snapshot")
    val recoveryJson = json.getJSONObject("recovery")
    val reason = json.optString("reason").takeIf { it.isNotEmpty() && it != "null" }
    val state = if (reason == "duration-reached") "completed" else "failed"
    return mapOf(
      "snapshot" to mapOf(
        "sessionId" to json.getString("sessionId"),
        "state" to state,
        "elapsedRunningMs" to snapshotJson.getLong("elapsedRunningMs"),
        "cycle" to snapshotJson.getInt("cycle"),
        "phase" to snapshotJson.getString("phase"),
        "phaseElapsedMs" to snapshotJson.getLong("phaseElapsedMs"),
        "savedAt" to snapshotJson.getString("savedAt"),
      ),
      "recovery" to mapOf(
        "wordId" to recoveryJson.getString("wordId"),
        "word" to recoveryJson.getString("word"),
        "sourceType" to recoveryJson.getString("sourceType"),
        "libraryEntryId" to recoveryJson.optString("libraryEntryId").takeIf { it.isNotEmpty() && it != "null" },
        "startedAt" to recoveryJson.getString("startedAt"),
      ),
      "totalDurationMs" to json.getLong("totalDurationMs"),
      "learningDurationMs" to json.getLong("learningDurationMs"),
      "restDurationMs" to json.getLong("restDurationMs"),
      "reason" to reason,
    )
  }

  fun clear(sessionId: String) {
    val current = preferences.getString(KEY, null)?.let(::JSONObject) ?: return
    if (current.optString("sessionId") == sessionId) {
      check(preferences.edit().remove(KEY).commit()) { "Could not clear the session recovery record." }
    }
  }

  private companion object {
    const val KEY = "pending-recovery"
  }
}
