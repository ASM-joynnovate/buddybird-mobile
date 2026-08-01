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

// JS `SessionEngineFailureCode` union 과 1:1 — onFailure 이벤트로 나가는 기계 판독용 코드를 나른다.
internal class SessionFailureException(
  val failureCode: String,
  message: String,
  cause: Throwable? = null,
) : CodedException(message, cause)

// 잠금화면 알림과 MediaSession 이 읽는 표시 상태. 엔진 내부 상태를 그대로 노출하지 않고
// 화면에 필요한 값만 추린다.
data class SessionMediaState(
  val sessionId: String,
  val title: String,
  val subtitle: String,
  val isPlaying: Boolean,
  val durationMs: Long,
)

object SessionAudioEngineRuntime {
  var onStateChanged: ((Map<String, Any?>) -> Unit)? = null
  var onProgress: ((Map<String, Any?>) -> Unit)? = null
  var onFailure: ((Map<String, Any?>) -> Unit)? = null
  var onSegmentCaptured: ((Map<String, Any?>) -> Unit)? = null
  // 알림·MediaSession 을 다시 그려야 할 때 호출된다. 서비스가 살아 있는 동안만 설정된다.
  var onMediaStateChanged: (() -> Unit)? = null

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
  // 일시정지 중에도 서비스는 살아 있으므로 "세션 있음"과 별개로 추적해야 한다 — resume이
  // 오디오만 다시 열면 되는지, 서비스부터 새로 띄워야 하는지를 이 값으로 가른다.
  private var serviceRunning = false
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
      try {
        validateFiles(next)
      } catch (error: Throwable) {
        // start rejection에는 code가 실리지 않으므로 onFailure 이벤트로 code를 내보낸다.
        emitFailure(error)
        throw error
      }
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
          val failure = SessionFailureException("service-start-not-allowed", "The audio foreground service is not allowed to start.", error)
          emitFailure(failure)
          throw failure
        }
      }
    }
    if (!latch.await(4, TimeUnit.SECONDS)) {
      synchronized(this) {
        configuration = null
        state = "idle"
      }
      context?.let { it.stopService(Intent(it, AudioForegroundService::class.java)) }
      val failure = SessionFailureException("service-start-not-allowed", "The audio foreground service did not start in time.")
      emitFailure(failure)
      throw failure
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

  // 오디오 자원을 열고 running 으로 진입한다. 최초 시작(onServiceStarted)과
  // 일시정지 해제(resume)가 공유하는 경로다.
  private fun activateRunningState() {
    activateAudio()
    runningSinceMs = SystemClock.elapsedRealtime()
    state = "running"
    startTimer()
    scheduleTargetPlaybackIfNeeded()
    persist(null)
    emitStateChanged()
  }

  @Synchronized
  fun onServiceStarted() {
    serviceRunning = true
    try {
      activateRunningState()
    } catch (error: Throwable) {
      serviceStartError = error
      state = "failed"
      stopAudio()
      runCatching { persist("failure") }
      emitFailure(error)
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
    emitFailure("service-start-not-allowed", error.message)
    serviceReadyLatch?.countDown()
  }

  // 일시정지는 마이크·재생·audio focus 만 놓고 foreground service 는 유지한다.
  // 서비스를 내리면 알림이 사라져 잠금화면의 재생 버튼이 누를 대상을 잃고, 백그라운드에서
  // mic 타입 FGS 를 새로 시작하는 것은 Android 14+ while-in-use 검사에 막혀 재개도 불가능하다.
  // 실제 캡처가 멈추므로 마이크 프라이버시 인디케이터는 꺼진다.
  @Synchronized
  fun pause(): Map<String, Any?> {
    checkSession()
    if (state != "running" && state != "interrupted") return snapshot()
    foldElapsed()
    state = "paused"
    stopAudio()
    persist(null)
    emitStateChanged()
    return snapshot()
  }

  fun resume(): Map<String, Any?> {
    val latch = synchronized(this) {
      checkSession()
      if (state != "paused" && state != "interrupted") return snapshot()
      val appContext = requireNotNull(context)
      // 서비스가 살아 있으면 오디오만 다시 연다 — 백그라운드에서 동작하는 유일한 경로다.
      if (serviceRunning) {
        state = "starting"
        try {
          activateRunningState()
        } catch (error: Throwable) {
          state = "paused"
          stopAudio()
          throw CodedException("Could not resume the training session audio.", error)
        }
        return snapshot()
      }
      // 서비스가 이미 사라진 경우(OS 종료 등)에만 새로 띄운다. 앱 화면이 보이는 상태에서만 성공한다.
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

  @Synchronized
  fun mediaState(): SessionMediaState? {
    val config = configuration ?: return null
    val position = phasePosition()
    val paused = state == "paused" || state == "interrupted"
    return SessionMediaState(
      sessionId = config.sessionId,
      title = config.recovery.word,
      subtitle = if (paused) {
        config.notification.pausedSubtitle
      } else {
        config.notification.subtitle(position.second, position.first, config.totalCycles)
      },
      isPlaying = state == "running",
      durationMs = config.totalDurationMs,
    )
  }

  // MediaSession 의 진행바가 폴링하는 위치. 세션 전체 경과를 쓴다(목표 음원 클립 위치가 아니다).
  @Synchronized
  fun mediaPositionMs(): Long = if (configuration == null) 0 else elapsedRunningMs()
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

  // paused 포함 — 일시정지 중에도 서비스는 유지되므로, 이때 사라졌다면 비정상 종료다.
  @Synchronized
  fun onServiceDestroyed() {
    serviceRunning = false
    if (state !in LIVE_SESSION_STATES) return
    failSession("audio-engine-failed", CodedException("The audio foreground service stopped unexpectedly."))
  }

  private fun validateFiles(config: NativeSessionConfiguration) {
    val source = Uri.parse(config.targetAudioUri)
    if (source.scheme != "file" || !File(requireNotNull(source.path)).isFile) {
      throw SessionFailureException("audio-source-unavailable", "The target audio file is unavailable.")
    }
    val directory = Uri.parse(config.captureDirectoryUri)
    if (directory.scheme != "file" || !File(requireNotNull(directory.path)).let { it.isDirectory || it.mkdirs() }) {
      throw SessionFailureException("storage-unavailable", "The capture directory is unavailable.")
    }
    try {
      requireNotNull(captureStore).reconcile(config.captureDirectoryUri)
    } catch (error: Throwable) {
      throw SessionFailureException("storage-unavailable", "The capture directory is unavailable.", error)
    }
    if (ContextCompat.checkSelfPermission(requireNotNull(context), Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      throw SessionFailureException("permission-denied", "Microphone permission is required.")
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
      throw SessionFailureException("audio-route-unavailable", "The microphone audio source is unavailable.")
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
      throw SessionFailureException("audio-source-unavailable", "The target audio file could not be prepared.", playerFailure)
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
      throw SessionFailureException("audio-route-unavailable", "The microphone did not enter the recording state.")
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
    if (result != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
      throw SessionFailureException("audio-route-unavailable", "The audio output route is unavailable.")
    }
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
          emitStateChanged()
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
              emitStateChanged()
            }
            .onFailure {
              state = "failed"
              persist("failure")
              emitFailure(it)
              emitStateChanged()
            }
        }
      }
    }
  }

  private fun failSession(code: String, error: Throwable) {
    if (configuration == null || state !in LIVE_SESSION_STATES) return
    foldElapsed()
    state = "failed"
    stopAudio()
    persist("failure")
    emitFailure(code, error.message)
    emitStateChanged()
    context?.stopService(Intent(context, AudioForegroundService::class.java))
  }

  // 모든 상태 전이는 이 경로로 나간다 — JS 이벤트와 잠금화면 알림이 어긋나지 않게 한 곳에 묶는다.
  private fun emitStateChanged() {
    onStateChanged?.invoke(snapshot())
    onMediaStateChanged?.invoke()
  }

  private fun emitFailure(error: Throwable) =
    emitFailure((error as? SessionFailureException)?.failureCode ?: "audio-engine-failed", error.message)

  private fun emitFailure(code: String, message: String?) {
    onFailure?.invoke(mapOf("code" to code, "message" to (message ?: "Audio engine failed."), "recoverable" to false))
  }

  private fun scheduleTargetPlaybackIfNeeded() {
    val player = mediaPlayer ?: return
    val handler = playbackHandler ?: return
    if (state != "running" || phasePosition().second != "learning") return
    playbackGeneration += 1
    targetPlaying = true
    capturePipeline?.flush()
    emitStateChanged()
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
      emitStateChanged()
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
      emitStateChanged()
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

  // 세션이 오디오 자원이나 서비스를 아직 붙들고 있는 상태 — 비정상 종료로 판정할 대상.
  private val LIVE_SESSION_STATES = setOf("running", "starting", "interrupted", "paused")
}
