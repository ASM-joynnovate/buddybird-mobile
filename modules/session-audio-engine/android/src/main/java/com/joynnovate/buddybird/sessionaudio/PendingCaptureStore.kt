package com.joynnovate.buddybird.sessionaudio

import android.content.Context
import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedOutputStream
import java.io.DataOutputStream
import java.io.File
import java.io.FileOutputStream
import java.time.Instant
import java.util.UUID

class PendingCaptureStore(context: Context) {
  private val directory = File(context.filesDir, "session-audio-engine").apply { mkdirs() }
  private val manifest = File(directory, "pending-captures.json")
  private val segments = load().toMutableList()

  @Synchronized
  fun reconcile(captureDirectoryUri: String) {
    val captureDirectory = File(requireNotNull(Uri.parse(captureDirectoryUri).path)).apply { mkdirs() }
    val registeredTemporaryFiles = segments.mapTo(mutableSetOf()) { ".${it.fileName}.tmp" }
    captureDirectory.listFiles()
      ?.filter { it.isFile && it.name.startsWith(".") && it.name.endsWith(".wav.tmp") }
      ?.filterNot { it.name in registeredTemporaryFiles }
      ?.forEach(File::delete)
  }

  @Synchronized
  fun store(
    samples: ShortArray,
    configuration: NativeSessionConfiguration,
    phase: String,
    cycle: Int,
    speechStartMs: Long,
    speechEndMs: Long,
  ): NativeCapturedSegment {
    val captureDirectory = File(requireNotNull(Uri.parse(configuration.captureDirectoryUri).path)).apply { mkdirs() }
    val segmentId = UUID.randomUUID().toString().lowercase()
    val fileName = "session-${configuration.sessionId}-$segmentId.wav"
    val temporary = File(captureDirectory, ".$fileName.tmp")
    val final = File(captureDirectory, fileName)
    val durationMs = samples.size.toLong() * 1_000 / 16_000
    val segment = NativeCapturedSegment(
      segmentId = segmentId,
      sessionId = configuration.sessionId,
      uri = Uri.fromFile(final).toString(),
      fileName = fileName,
      phase = phase,
      cycle = cycle,
      capturedAt = Instant.now().toString(),
      durationMs = durationMs,
      speechStartMs = speechStartMs.coerceIn(0, durationMs),
      speechEndMs = speechEndMs.coerceIn(0, durationMs),
    )
    writeWav(temporary, samples)
    segments += segment
    persist()
    check(temporary.renameTo(final)) { "Could not finalize captured WAV file." }
    evictOverLimit(configuration.maxPendingCaptureBytes)
    persist()
    return segment
  }

  @Synchronized fun all(): List<NativeCapturedSegment> = segments.filter { File(requireNotNull(Uri.parse(it.uri).path)).isFile }

  @Synchronized
  fun markStored(ids: Set<String>) {
    segments.removeAll { ids.contains(it.segmentId) }
    persist()
  }

  private fun load(): List<NativeCapturedSegment> {
    if (!manifest.isFile) return emptyList()
    return runCatching {
      val array = JSONArray(manifest.readText())
      buildList {
        for (index in 0 until array.length()) {
          val value = array.getJSONObject(index)
          val segment = NativeCapturedSegment(
            segmentId = value.getString("segmentId"),
            sessionId = value.getString("sessionId"),
            uri = value.getString("uri"),
            fileName = value.getString("fileName"),
            phase = value.getString("phase"),
            cycle = value.getInt("cycle"),
            capturedAt = value.getString("capturedAt"),
            durationMs = value.getLong("durationMs"),
            speechStartMs = value.getLong("speechStartMs"),
            speechEndMs = value.getLong("speechEndMs"),
          )
          val final = File(requireNotNull(Uri.parse(segment.uri).path))
          val temporary = File(final.parentFile, ".${segment.fileName}.tmp")
          if (!final.exists() && temporary.exists()) temporary.renameTo(final)
          if (final.isFile) add(segment)
        }
      }
    }.getOrDefault(emptyList())
  }

  private fun persist() {
    val array = JSONArray()
    segments.forEach { array.put(JSONObject(it.toMap())) }
    val temporary = File(directory, ".pending-captures.json.tmp")
    temporary.writeText(array.toString())
    check(temporary.renameTo(manifest)) { "Could not finalize pending capture manifest." }
  }

  private fun evictOverLimit(limit: Long) {
    if (limit <= 0) return
    var total = segments.sumOf { File(requireNotNull(Uri.parse(it.uri).path)).length() }
    while (total > limit && segments.isNotEmpty()) {
      val oldest = segments.removeAt(0)
      val file = File(requireNotNull(Uri.parse(oldest.uri).path))
      total -= file.length()
      file.delete()
    }
  }

  private fun writeWav(file: File, samples: ShortArray) {
    DataOutputStream(BufferedOutputStream(FileOutputStream(file))).use { output ->
      val dataSize = samples.size * 2
      output.writeBytes("RIFF")
      output.writeIntLE(36 + dataSize)
      output.writeBytes("WAVEfmt ")
      output.writeIntLE(16)
      output.writeShortLE(1)
      output.writeShortLE(1)
      output.writeIntLE(16_000)
      output.writeIntLE(32_000)
      output.writeShortLE(2)
      output.writeShortLE(16)
      output.writeBytes("data")
      output.writeIntLE(dataSize)
      samples.forEach { output.writeShortLE(it.toInt()) }
    }
  }
}

private fun DataOutputStream.writeIntLE(value: Int) {
  writeByte(value)
  writeByte(value ushr 8)
  writeByte(value ushr 16)
  writeByte(value ushr 24)
}

private fun DataOutputStream.writeShortLE(value: Int) {
  writeByte(value)
  writeByte(value ushr 8)
}
