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
import android.media.MediaRecorder
import android.net.Uri
import android.os.Handler
import android.os.HandlerThread
import android.os.SystemClock
import androidx.core.content.ContextCompat
import androidx.media3.common.AudioAttributes as Media3AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
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
  private var mediaPlayer: ExoPlayer? = null
  private var playbackThread: HandlerThread? = null
  private var playbackHandler: Handler? = null
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
    serviceStartError?.let {
      // start 실패 시 세션은 성립하지 않은 것으로 본다 — configuration을 유지하면 이후 모든
      // start()가 "already running"으로 거부돼 엔진이 고착된다. onServiceStarted는 resume과
      // 공용이므로 start 경로인 여기에서만 해제한다.
      synchronized(this) {
        configuration = null
        state = "idle"
      }
      throw CodedException("Could not start the audio foreground service.", it)
    }
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

  // startForeground 자체가 실패하면 onServiceStarted가 호출되지 않아 latch가 영원히 안 풀린다.
  // 서비스가 stopSelf하기 전에 state를 "failed"로 만들어 onServiceDestroyed의 failSession
  // 중복 발동도 함께 차단한다. 오디오 자원은 아직 활성화 전이므로 해제할 것이 없다.
  @Synchronized
  fun onServiceStartFailed(error: Throwable) {
    serviceStartError = error
    state = "failed"
    runCatching { persist("failure") }
    serviceReadyLatch?.countDown()
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
    requireNotNull(captureStore).reconcile(config.captureDirectoryUri)
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
      MediaRecorder.AudioSource.MIC,
      16_000,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT,
      maxOf(minimumBuffer, 3_200),
    )
    if (recorder.state != AudioRecord.STATE_INITIALIZED) {
      recorder.release()
      throw CodedException("The microphone audio source is unavailable.")
    }
    audioRecord = recorder
    val thread = HandlerThread("SessionAudioPlayback").apply { start() }
    val handler = Handler(thread.looper)
    val playerReady = CountDownLatch(1)
    var playerFailure: Throwable? = null
    handler.post {
      val player = ExoPlayer.Builder(appContext)
        .setLooper(thread.looper)
        .setAudioAttributes(
          Media3AudioAttributes.Builder()
            .setUsage(C.USAGE_MEDIA)
            .setContentType(C.AUDIO_CONTENT_TYPE_SPEECH)
            .build(),
          false,
        )
        .build()
      player.addListener(object : Player.Listener {
        override fun onPlaybackStateChanged(playbackState: Int) {
          if (playbackState == Player.STATE_READY) playerReady.countDown()
          if (playbackState == Player.STATE_ENDED) handlePlaybackCompleted(player.duration.coerceAtLeast(0))
        }

        override fun onPlayerError(error: PlaybackException) {
          playerFailure = error
          playerReady.countDown()
          scheduler.execute {
            synchronized(this@SessionAudioEngineRuntime) {
              failSession("audio-engine-failed", error)
            }
          }
        }
      })
      player.setMediaItem(MediaItem.fromUri(config.targetAudioUri))
      player.prepare()
      mediaPlayer = player
    }
    if (!playerReady.await(4, TimeUnit.SECONDS) || playerFailure != null) {
      handler.post { mediaPlayer?.release() }
      thread.quitSafely()
      throw CodedException("The target audio file could not be prepared.", playerFailure)
    }
    playbackThread = thread
    playbackHandler = handler
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
    if (recorder.recordingState != AudioRecord.RECORDSTATE_RECORDING) {
      throw CodedException("The microphone did not enter the recording state.")
    }
    recording.set(true)
    recordingThread = Thread({
      android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_AUDIO)
      val buffer = ShortArray(1_600)
      while (recording.get()) {
        val count = recorder.read(buffer, 0, buffer.size, AudioRecord.READ_BLOCKING)
        if (count > 0) {
          val copied = buffer.copyOf(count)
          captureExecutor.execute {
            val capture = synchronized(this@SessionAudioEngineRuntime) {
              val position = phasePosition()
              val allowed = state == "running" && !targetPlaying && SystemClock.elapsedRealtime() >= captureAllowedAfterMs
              CaptureWork(capturePipeline, allowed, position.second, position.first)
            }
            capture.pipeline?.process(copied, copied.size, capture.allowed, capture.phase, capture.cycle)
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
    val player = mediaPlayer
    playbackHandler?.post {
      player?.stop()
      player?.release()
    }
    mediaPlayer = null
    playbackThread?.quitSafely()
    playbackThread = null
    playbackHandler = null
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
    val handler = playbackHandler ?: return
    if (state != "running" || phasePosition().second != "learning") return
    playbackGeneration += 1
    targetPlaying = true
    capturePipeline?.flush()
    onStateChanged?.invoke(snapshot())
    handler.post {
      player.seekTo(0)
      player.play()
    }
  }

  private fun handlePlaybackCompleted(followGapMs: Long) {
    val generation = synchronized(this) {
      if (!targetPlaying || state != "running") return
      targetPlaying = false
      captureAllowedAfterMs = SystemClock.elapsedRealtime() + (configuration?.vad?.echoTailGuardMs ?: 0)
      onStateChanged?.invoke(snapshot())
      playbackGeneration
    }
    scheduler.schedule({
      synchronized(this) {
        if (generation != playbackGeneration || state != "running" || phasePosition().second != "learning") return@synchronized
        scheduleTargetPlaybackIfNeeded()
      }
    }, followGapMs, TimeUnit.MILLISECONDS)
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
      val player = mediaPlayer
      playbackHandler?.post { player?.pause() }
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
      "isTargetPlaying" to targetPlaying,
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

  private data class CaptureWork(
    val pipeline: VoiceCapturePipeline?,
    val allowed: Boolean,
    val phase: String,
    val cycle: Int,
  )
}
