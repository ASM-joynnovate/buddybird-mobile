package com.joynnovate.buddybird.sessionaudio

import android.content.Context
import android.net.Uri
import android.util.AtomicFile
import java.io.File
import java.util.UUID
import org.json.JSONArray
import org.json.JSONObject

fun JSONObject.toMap(): Map<String, Any?> =
    keys().asSequence().associateWith { key ->
        when (val value = get(key)) {
            JSONObject.NULL -> null
            is JSONObject -> value.toMap()
            is JSONArray ->
                (0 until value.length()).map { index ->
                    when (val item = value.get(index)) {
                        is JSONObject -> item.toMap()
                        JSONObject.NULL -> null
                        else -> item
                    }
                }
            else -> value
        }
    }

class SessionPersistence(context: Context) {
    private val directory = File(context.filesDir, "session-audio-engine")
    val captures = File(context.filesDir, "recordings/session-captures")
    private val manifest = File(directory, "pending-captures.json")

    private val preferences =
        context.getSharedPreferences("session-audio-engine", Context.MODE_PRIVATE)

    fun prepare() {
        if (
            (!directory.isDirectory && !directory.mkdirs()) ||
                (!captures.isDirectory && !captures.mkdirs())
        ) {
            throw EngineFailure("storage-unavailable", "Cannot create capture storage")
        }
    }

    private fun atomicWrite(file: File, bytes: ByteArray) {
        val atomic = AtomicFile(file)
        val stream = atomic.startWrite()

        try {
            stream.write(bytes)
            atomic.finishWrite(stream)
        } catch (error: Exception) {
            atomic.failWrite(stream)
            throw error
        }

        if (!atomic.readFully().contentEquals(bytes)) {
            throw EngineFailure("storage-unavailable", "Native storage write verification failed")
        }
    }

    fun readRecovery(): JSONObject? {
        val encodedRecord = preferences.getString("pending-recovery", null) ?: return null
        return JSONObject(encodedRecord)
    }

    fun writeRecovery(record: JSONObject) {
        val encodedRecord = record.toString()
        if (
            !preferences.edit().putString("pending-recovery", encodedRecord).commit() ||
                preferences.getString("pending-recovery", null) != encodedRecord
        ) {
            throw EngineFailure("storage-unavailable", "Recovery write verification failed")
        }
    }

    fun clearRecovery(sessionId: String) {
        val pending = readRecovery() ?: return

        if (pending.getString("sessionId") != sessionId) {
            throw EngineFailure("storage-unavailable", "Recovery session ID mismatch")
        }

        if (!preferences.edit().remove("pending-recovery").commit()) {
            throw EngineFailure("storage-unavailable", "Could not clear saved recovery")
        }
    }

    private fun validate(capture: JSONObject) {
        UUID.fromString(capture.getString("segmentId"))
        val fileName = capture.getString("fileName")
        val speechStartMs = capture.getInt("speechStartMs")
        val speechEndMs = capture.getInt("speechEndMs")
        val durationMs = capture.getInt("durationMs")
        if (
            fileName != File(fileName).name ||
                !fileName.endsWith(".wav") ||
                capture.getString("sessionId").isEmpty() ||
                capture.getString("phase") !in listOf("learning", "rest") ||
                capture.getInt("cycle") < 1 ||
                durationMs <= 0 ||
                speechStartMs < 0 ||
                speechStartMs > speechEndMs ||
                speechEndMs > durationMs
        ) {
            throw EngineFailure(
                "storage-unavailable",
                "Malformed pending capture; original manifest retained",
            )
        }
        capture.getString("capturedAt")
    }

    private fun writeManifest(pendingCaptures: List<JSONObject>) {
        prepare()
        atomicWrite(manifest, JSONArray(pendingCaptures).toString().toByteArray(Charsets.UTF_8))
    }

    fun pending(): MutableList<JSONObject> {
        prepare()

        val encodedRecord =
            if (manifest.exists() || File(manifest.path + ".bak").exists()) {
                JSONArray(String(AtomicFile(manifest).readFully(), Charsets.UTF_8))
            } else {
                JSONArray()
            }
        val pendingCaptures =
            (0 until encodedRecord.length()).map { encodedRecord.getJSONObject(it) }.toMutableList()

        val metadataFiles =
            captures.listFiles()?.filter { it.name.endsWith(".metadata.json") }
                ?: throw EngineFailure("storage-unavailable", "Cannot read capture directory")

        for (metadataFile in metadataFiles) {
            val capture = JSONObject(String(AtomicFile(metadataFile).readFully(), Charsets.UTF_8))
            validate(capture)

            val finalFile = File(captures, capture.getString("fileName"))
            val temporaryFile = File(captures, ".${finalFile.name}.tmp")

            if (
                pendingCaptures.none {
                    it.getString("segmentId") == capture.getString("segmentId")
                } && (finalFile.exists() || temporaryFile.exists())
            ) {
                pendingCaptures.add(capture)
            }
        }

        pendingCaptures.forEach { validate(it) }
        if (
            pendingCaptures.map { it.getString("segmentId") }.toSet().size != pendingCaptures.size
        ) {
            throw EngineFailure("storage-unavailable", "Duplicate pending capture identity")
        }

        writeManifest(pendingCaptures)

        for (capture in pendingCaptures) {
            // Historical Android URIs remain valid when their sandbox path survives; otherwise use
            // the known recordings lineage.
            val historicalUri = Uri.parse(capture.getString("uri"))
            val historicalFile =
                if (historicalUri.scheme == "file") {
                    historicalUri.path?.let(::File)
                } else {
                    null
                }
            val currentFile = File(captures, capture.getString("fileName"))
            val finalFile =
                if (historicalFile?.isFile == true) {
                    historicalFile
                } else {
                    currentFile
                }
            val temporaryFile = File(captures, ".${currentFile.name}.tmp")

            if (
                !finalFile.exists() && temporaryFile.exists() && !temporaryFile.renameTo(finalFile)
            ) {
                throw EngineFailure("storage-unavailable", "Cannot finalize interrupted capture")
            }

            if (!finalFile.isFile) {
                throw EngineFailure(
                    "storage-unavailable",
                    "Pending capture file unavailable: ${finalFile.name}",
                )
            }
            capture.put("uri", Uri.fromFile(finalFile).toString())
        }

        writeManifest(pendingCaptures)

        for (metadataFile in metadataFiles) {
            val capture = JSONObject(metadataFile.readText())
            if (
                pendingCaptures.any {
                    it.getString("segmentId") == capture.getString("segmentId")
                } && !metadataFile.delete()
            ) {
                throw EngineFailure("storage-unavailable", "Cannot finalize capture metadata")
            }
        }

        return pendingCaptures
    }

    fun save(
        audio: SpeechAudio,
        sessionId: String,
        phase: String,
        cycle: Int,
        maxBytes: Long,
    ): JSONObject {
        val pendingCaptures = pending()

        val segmentId = UUID.randomUUID().toString().lowercase()
        val fileName = "session-$sessionId-$segmentId.wav"
        val finalFile = File(captures, fileName)
        val capture =
            JSONObject()
                .put("segmentId", segmentId)
                .put("sessionId", sessionId)
                .put("uri", Uri.fromFile(finalFile).toString())
                .put("fileName", fileName)
                .put("phase", phase)
                .put("cycle", cycle)
                .put("capturedAt", isoNow())
                .put("durationMs", audio.durationMs)
                .put("speechStartMs", audio.speechStartMs)
                .put("speechEndMs", audio.speechEndMs)

        val storedBytes =
            captures.listFiles()?.sumOf { it.length() }
                ?: throw EngineFailure("storage-unavailable", "Cannot measure capture storage")
        if (storedBytes + audio.samples.size * 2 + 44 > maxBytes) {
            throw EngineFailure(
                "storage-unavailable",
                "Capture storage limit reached; existing recordings retained",
            )
        }

        val metadataFile = File(captures, ".$fileName.metadata.json")
        atomicWrite(metadataFile, capture.toString().toByteArray(Charsets.UTF_8))

        val temporaryFile = File(captures, ".$fileName.tmp")
        atomicWrite(temporaryFile, waveData(audio.samples))

        pendingCaptures.add(capture)
        writeManifest(pendingCaptures)

        if (!temporaryFile.renameTo(finalFile)) {
            throw EngineFailure("storage-unavailable", "Cannot finalize recorded WAV")
        }

        if (!metadataFile.delete()) {
            throw EngineFailure("storage-unavailable", "Cannot finalize capture metadata")
        }

        return capture
    }

    fun acknowledge(ids: List<String>) {
        val acknowledgedIds = ids.toSet()
        writeManifest(pending().filter { it.getString("segmentId") !in acknowledgedIds })
    }
}
