package com.joynnovate.buddybird.sessionaudio

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.AudioRecord
import android.media.MediaPlayer
import android.media.MediaRecorder
import android.net.Uri
import android.os.SystemClock
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.CodedException
import java.io.File
import java.time.Instant
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledFuture
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

object SessionAudioEngineRuntime {
  var onStateChanged: ((Map<String, Any?>) -> Unit)? = null
  var onProgress: ((Map<String, Any?>) -> Unit)? = null
  var onFailure: ((Map<String, Any?>) -> Unit)? = null
  var onSegmentCaptured: ((Map<String, Any?>) -> Unit)? = null

  private val scheduler = Executors.newSingleThreadScheduledExecutor()
  private val captureExecutor = Executors.newSingleThreadExecutor()
  private var context: Context? = null
  private var recoveryStore: SessionRecoveryStore? = null
  private var captureStore: PendingCaptureStore? = null
  private var configuration: NativeSessionConfiguration? = null
  private var state = "idle"
  private var elapsedBeforeRunMs = 0L
  private var runningSinceMs: Long? = null
  private var lastProgressSecond = -1L
  private var lastSavedElapsedMs = 0L
  private var lastPhase = "learning"
  private var timer: ScheduledFuture<*>? = null
  private var serviceReadyLatch: CountDownLatch? = null
  private var serviceStartError: Throwable? = null
  private var audioRecord: AudioRecord? = null
  private var mediaPlayer: MediaPlayer? = null
  private var audioManager: AudioManager? = null
  private var audioFocusRequest: AudioFocusRequest? = null
  private val audioFocusListener = AudioManager.OnAudioFocusChangeListener(::handleAudioFocusChange)
  private var recordingThread: Thread? = null
  private val recording = AtomicBoolean(false)
  private var playbackGeneration = 0
  private var lastStopRecord: Map<String, Any?>? = null
  private var capturePipeline: VoiceCapturePipeline? = null
  private var targetPlaying = false
  private var captureAllowedAfterMs = 0L

  @Synchronized
  fun initialize(applicationContext: Context) {
    context = applicationContext
    recoveryStore = SessionRecoveryStore(applicationContext)
    captureStore = PendingCaptureStore(applicationContext)
  }

  fun start(input: SessionAudioEngineStartInputRecord): Map<String, Any?> {
    val latch = synchronized(this) {
      val current = configuration
      if (current != null) {
        if (current.sessionId != input.sessionId) throw CodedException("A different training session is already running.")
        return snapshot()
      }
      if (input.sessionId.isEmpty() || input.totalDurationMs <= 0 || input.learningDurationMs <= 0 || input.restDurationMs < 0) {
        throw CodedException("Session durations and sessionId are required.")
      }
      val appContext = requireNotNull(context) { "SessionAudioEngine is not initialized." }
      val next = NativeSessionConfiguration.from(input)
      validateFiles(next)
      configuration = next
      elapsedBeforeRunMs = 0
      runningSinceMs = null
      state = "starting"
      lastStopRecord = null
      serviceStartError = null
      CountDownLatch(1).also {
        serviceReadyLatch = it
        val intent = Intent(appContext, AudioForegroundService::class.java).setAction(AudioForegroundService.ACTION_START)
        try {
          ContextCompat.startForegroundService(appContext, intent)
        } catch (error: Throwable) {
          configuration = null
          state = "idle"
          throw CodedException("The audio foreground service is not allowed to start.", error)
        }
      }
    }
    if (!latch.await(4, TimeUnit.SECONDS)) {
      synchronized(this) {
        configuration = null
        state = "idle"
      }
      context?.let { it.stopService(Intent(it, AudioForegroundService::class.java)) }
      throw CodedException("The audio foreground service did not start in time.")
    }
    serviceStartError?.let { throw CodedException("Could not start the audio foreground service.", it) }
    return snapshot()
  }

  @Synchronized
  fun onServiceStarted() {
    try {
      activateAudio()
      runningSinceMs = SystemClock.elapsedRealtime()
      state = "running"
      startTimer()
      scheduleTargetPlaybackIfNeeded()
      persist(null)
      onStateChanged?.invoke(snapshot())
    } catch (error: Throwable) {
      serviceStartError = error
      state = "failed"
      stopAudio()
      runCatching { persist("failure") }
      onFailure?.invoke(mapOf("code" to "audio-engine-failed", "message" to (error.message ?: "Audio engine failed."), "recoverable" to false))
      context?.stopService(Intent(context, AudioForegroundService::class.java))
    } finally {
      serviceReadyLatch?.countDown()
    }
  }

  @Synchronized
  fun pause(): Map<String, Any?> {
    checkSession()
    if (state != "running" && state != "interrupted") return snapshot()
    foldElapsed()
    state = "paused"
    stopAudio()
    persist(null)
    val result = snapshot()
    onStateChanged?.invoke(result)
    context?.stopService(Intent(context, AudioForegroundService::class.java))
    return result
  }

  fun resume(): Map<String, Any?> {
    val latch = synchronized(this) {
      checkSession()
      if (state != "paused" && state != "interrupted") return snapshot()
      val appContext = requireNotNull(context)
      state = "starting"
      serviceStartError = null
      CountDownLatch(1).also {
        serviceReadyLatch = it
        try {
          ContextCompat.startForegroundService(
            appContext,
            Intent(appContext, AudioForegroundService::class.java).setAction(AudioForegroundService.ACTION_START),
          )
        } catch (error: Throwable) {
          state = "paused"
          throw CodedException("The audio foreground service is not allowed to resume.", error)
        }
      }
    }
    if (!latch.await(4, TimeUnit.SECONDS)) {
      synchronized(this) { state = "paused" }
      context?.stopService(Intent(context, AudioForegroundService::class.java))
      throw CodedException("The audio foreground service did not resume in time.")
    }
    serviceStartError?.let { throw CodedException("Could not resume the audio foreground service.", it) }
    return snapshot()
  }

  @Synchronized
  fun stop(reason: String = "user-stopped"): Map<String, Any?> {
    if (configuration == null) return lastStopRecord ?: throw CodedException("There is no active training session.")
    val resolvedReason = when (state) {
      "completed" -> "duration-reached"
      "failed" -> "failure"
      else -> reason
    }
    foldElapsed()
    state = "stopping"
    stopAudio()
    persist(resolvedReason)
    val result = recoveryRecord(resolvedReason)
    lastStopRecord = result
    capturePipeline = null
    configuration = null
    state = "idle"
    context?.stopService(Intent(context, AudioForegroundService::class.java))
    return result
  }

  @Synchronized fun getSnapshot(): Map<String, Any?>? = if (configuration == null) null else snapshot()
  fun getPendingRecovery(): Map<String, Any?>? = recoveryStore?.load()
  fun clearPendingRecovery(sessionId: String) = requireNotNull(recoveryStore).clear(sessionId)
  fun getUnstoredSegments(): List<Map<String, Any?>> = requireNotNull(captureStore).all().map { it.toMap() }
  fun markSegmentsStored(ids: List<String>) = requireNotNull(captureStore).markStored(ids.toSet())

  @Synchronized
  fun destroyModule() {
    onStateChanged = null
    onProgress = null
    onFailure = null
    onSegmentCaptured = null
  }

  @Synchronized
  fun onServiceDestroyed() {
    if (state !in setOf("running", "starting", "interrupted")) return
    failSession("audio-engine-failed", CodedException("The audio foreground service stopped unexpectedly."))
  }

  private fun validateFiles(config: NativeSessionConfiguration) {
    val source = Uri.parse(config.targetAudioUri)
    if (source.scheme != "file" || !File(requireNotNull(source.path)).isFile) {
      throw CodedException("The target audio file is unavailable.")
    }
    val directory = Uri.parse(config.captureDirectoryUri)
    if (directory.scheme != "file" || !File(requireNotNull(directory.path)).let { it.isDirectory || it.mkdirs() }) {
      throw CodedException("The capture directory is unavailable.")
    }
    if (ContextCompat.checkSelfPermission(requireNotNull(context), Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      throw CodedException("Microphone permission is required.")
    }
  }

  private fun activateAudio(requestFocus: Boolean = true) {
    val appContext = requireNotNull(context)
    val config = requireNotNull(configuration)
    if (requestFocus) requestAudioFocus(appContext)
    val minimumBuffer = AudioRecord.getMinBufferSize(16_000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
    val recorder = AudioRecord(
      MediaRecorder.AudioSource.VOICE_RECOGNITION,
      16_000,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT,
      maxOf(minimumBuffer, 3_200),
    )
    if (recorder.state != AudioRecord.STATE_INITIALIZED) {
      recorder.release()
      throw CodedException("The microphone audio source is unavailable.")
    }
    val player = MediaPlayer().apply {
      setAudioAttributes(
        AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build(),
      )
      setDataSource(appContext, Uri.parse(config.targetAudioUri))
      setOnErrorListener { _, what, extra ->
        scheduler.execute {
          synchronized(this@SessionAudioEngineRuntime) {
            failSession("audio-engine-failed", CodedException("MediaPlayer failed: what=$what extra=$extra"))
          }
        }
        true
      }
      prepare()
    }
    audioRecord = recorder
    mediaPlayer = player
    if (capturePipeline == null) {
      capturePipeline = VoiceCapturePipeline(config, requireNotNull(captureStore)).apply {
        onCaptured = { onSegmentCaptured?.invoke(it.toMap()) }
        onFailure = {
          scheduler.execute {
            synchronized(this@SessionAudioEngineRuntime) {
              failSession("storage-unavailable", it)
            }
          }
        }
      }
    }
    recorder.startRecording()
    recording.set(true)
    recordingThread = Thread({
      val buffer = ShortArray(1_600)
      while (recording.get()) {
        val count = recorder.read(buffer, 0, buffer.size, AudioRecord.READ_BLOCKING)
        if (count > 0) {
          val copied = buffer.copyOf(count)
          captureExecutor.execute {
            synchronized(this@SessionAudioEngineRuntime) {
              val position = phasePosition()
              val allowed = state == "running" && !targetPlaying && SystemClock.elapsedRealtime() >= captureAllowedAfterMs
              capturePipeline?.process(copied, copied.size, allowed, position.second, position.first)
            }
          }
        } else if (count < 0 && recording.compareAndSet(true, false)) {
          captureExecutor.execute {
            synchronized(this@SessionAudioEngineRuntime) {
              failSession("audio-route-unavailable", CodedException("AudioRecord read failed with code $count."))
            }
          }
        }
      }
    }, "SessionAudioCapture").apply { start() }
  }

  private fun stopAudio(abandonFocus: Boolean = true) {
    capturePipeline?.flush()
    playbackGeneration += 1
    targetPlaying = false
    mediaPlayer?.runCatching { stop() }
    mediaPlayer?.release()
    mediaPlayer = null
    recording.set(false)
    audioRecord?.runCatching { stop() }
    recordingThread?.join(500)
    recordingThread = null
    audioRecord?.release()
    audioRecord = null
    if (abandonFocus) abandonAudioFocus()
  }

  private fun requestAudioFocus(appContext: Context) {
    val manager = appContext.getSystemService(AudioManager::class.java)
    val attributes = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_MEDIA)
      .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
      .build()
    val result = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
        .setAudioAttributes(attributes)
        .setOnAudioFocusChangeListener(audioFocusListener)
        .build()
      audioFocusRequest = request
      manager.requestAudioFocus(request)
    } else {
      @Suppress("DEPRECATION")
      manager.requestAudioFocus(audioFocusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN)
    }
    if (result != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) throw CodedException("The audio output route is unavailable.")
    audioManager = manager
  }

  private fun abandonAudioFocus() {
    val manager = audioManager ?: return
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
      audioFocusRequest?.let(manager::abandonAudioFocusRequest)
    } else {
      @Suppress("DEPRECATION")
      manager.abandonAudioFocus(audioFocusListener)
    }
    audioFocusRequest = null
    audioManager = null
  }

  private fun handleAudioFocusChange(change: Int) {
    synchronized(this) {
      when (change) {
        AudioManager.AUDIOFOCUS_LOSS,
        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT,
        AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
          if (state != "running") return
          foldElapsed()
          state = "interrupted"
          stopAudio(abandonFocus = false)
          persist(null)
          onStateChanged?.invoke(snapshot())
        }
        AudioManager.AUDIOFOCUS_GAIN -> {
          if (state != "interrupted") return
          state = "starting"
          runCatching { activateAudio(requestFocus = false) }
            .onSuccess {
              runningSinceMs = SystemClock.elapsedRealtime()
              state = "running"
              scheduleTargetPlaybackIfNeeded()
              persist(null)
              onStateChanged?.invoke(snapshot())
            }
            .onFailure {
              state = "failed"
              persist("failure")
              onFailure?.invoke(mapOf("code" to "audio-engine-failed", "message" to (it.message ?: "Audio engine failed."), "recoverable" to false))
              onStateChanged?.invoke(snapshot())
            }
        }
      }
    }
  }

  private fun failSession(code: String, error: Throwable) {
    if (configuration == null || state !in setOf("running", "starting", "interrupted")) return
    foldElapsed()
    state = "failed"
    stopAudio()
    persist("failure")
    onFailure?.invoke(mapOf("code" to code, "message" to (error.message ?: "Audio engine failed."), "recoverable" to false))
    onStateChanged?.invoke(snapshot())
    context?.stopService(Intent(context, AudioForegroundService::class.java))
  }

  private fun scheduleTargetPlaybackIfNeeded() {
    val player = mediaPlayer ?: return
    if (state != "running" || phasePosition().second != "learning") return
    val generation = ++playbackGeneration
    targetPlaying = true
    capturePipeline?.flush()
    player.seekTo(0)
    player.setOnCompletionListener {
      val followGapMs = player.duration.toLong()
      synchronized(this) {
        if (generation == playbackGeneration) {
          targetPlaying = false
          captureAllowedAfterMs = SystemClock.elapsedRealtime() + (configuration?.vad?.echoTailGuardMs ?: 0)
        }
      }
      scheduler.schedule({
        synchronized(this) {
          if (generation != playbackGeneration || state != "running" || phasePosition().second != "learning") return@synchronized
          scheduleTargetPlaybackIfNeeded()
        }
      }, followGapMs, TimeUnit.MILLISECONDS)
    }
    player.start()
  }

  private fun startTimer() {
    if (timer != null) return
    timer = scheduler.scheduleAtFixedRate({ synchronized(this) { handleTimer() } }, 250, 250, TimeUnit.MILLISECONDS)
  }

  private fun handleTimer() {
    val config = configuration ?: return
    if (state != "running") return
    val elapsed = elapsedRunningMs()
    if (elapsed >= config.totalDurationMs) {
      elapsedBeforeRunMs = config.totalDurationMs
      runningSinceMs = null
      state = "completed"
      stopAudio()
      persist("duration-reached")
      onStateChanged?.invoke(snapshot())
      context?.stopService(Intent(context, AudioForegroundService::class.java))
      return
    }
    val phase = phasePosition().second
    if (phase != lastPhase) {
      capturePipeline?.flush()
      lastPhase = phase
      mediaPlayer?.pause()
      playbackGeneration += 1
      targetPlaying = false
      scheduleTargetPlaybackIfNeeded()
      persist(null)
    }
    val second = elapsed / 1_000
    if (second != lastProgressSecond) {
      lastProgressSecond = second
      onProgress?.invoke(snapshot())
    }
    if (elapsed - lastSavedElapsedMs >= 15_000) persist(null)
  }

  private fun checkSession() {
    if (configuration == null) throw CodedException("There is no active training session.")
  }

  private fun foldElapsed() {
    elapsedBeforeRunMs = elapsedRunningMs()
    runningSinceMs = null
  }

  private fun elapsedRunningMs(): Long {
    val config = configuration ?: return 0
    val active = runningSinceMs?.let { maxOf(0, SystemClock.elapsedRealtime() - it) } ?: 0
    return minOf(config.totalDurationMs, elapsedBeforeRunMs + active)
  }

  private fun phasePosition(): Triple<Int, String, Long> {
    val config = configuration ?: return Triple(1, "learning", 0)
    val cycleDuration = config.learningDurationMs + config.restDurationMs
    if (cycleDuration <= 0) return Triple(1, "learning", 0)
    val elapsed = elapsedRunningMs()
    if (elapsed >= config.totalDurationMs && elapsed % cycleDuration == 0L) {
      return Triple((elapsed / cycleDuration).toInt().coerceAtLeast(1), "rest", config.restDurationMs)
    }
    val completeCycles = elapsed / cycleDuration
    val insideCycle = elapsed % cycleDuration
    return if (insideCycle < config.learningDurationMs) {
      Triple(completeCycles.toInt() + 1, "learning", insideCycle)
    } else {
      Triple(completeCycles.toInt() + 1, "rest", insideCycle - config.learningDurationMs)
    }
  }

  private fun snapshot(): Map<String, Any?> {
    val config = requireNotNull(configuration)
    val position = phasePosition()
    return mapOf(
      "sessionId" to config.sessionId,
      "state" to state,
      "elapsedRunningMs" to elapsedRunningMs(),
      "cycle" to position.first,
      "phase" to position.second,
      "phaseElapsedMs" to position.third,
      "savedAt" to Instant.now().toString(),
    )
  }

  private fun persist(reason: String?) {
    val config = configuration ?: return
    val current = snapshot()
    requireNotNull(recoveryStore).save(config, current, reason)
    lastSavedElapsedMs = current["elapsedRunningMs"] as Long
  }

  private fun recoveryRecord(reason: String?): Map<String, Any?> {
    val config = requireNotNull(configuration)
    return mapOf(
      "snapshot" to snapshot(),
      "recovery" to config.recovery.toMap(),
      "totalDurationMs" to config.totalDurationMs,
      "learningDurationMs" to config.learningDurationMs,
      "restDurationMs" to config.restDurationMs,
      "reason" to reason,
    )
  }
}
