package com.joynnovate.buddybird.sessionaudio

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.*
import android.media.audiofx.Visualizer
import android.net.Uri
import android.os.*
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import java.io.File
import java.io.IOException
import java.util.concurrent.atomic.AtomicInteger
import kotlin.math.*
import org.json.JSONObject

internal class SessionConfiguration(val input: JSONObject) {
    val sessionId = input.getString("sessionId")

    val targetAudioFile = localFile(input.getString("targetAudioUri"))
    val captureDirectory = localFile(input.getString("captureDirectoryUri"))

    val totalDurationMs = requiredNumber("totalDurationMs")
    val learningDurationMs = requiredNumber("learningDurationMs")
    val restDurationMs = requiredNumber("restDurationMs")
    val stressCareDurationMs = requiredNumber("stressCareDurationMs")

    val maxPendingCaptureBytes: Long

    val recoveryMetadata: JSONObject = input.getJSONObject("recovery")
    val notificationText: JSONObject = input.getJSONObject("notification")

    val careAudioFiles =
        input.getJSONArray("stressCareAudioUris").let { values ->
            (0 until values.length()).map { localFile(values.getString(it)) }
        }
    val vadSettings: VADSettings

    val cycleDurationMs: Double
        get() = learningDurationMs + restDurationMs + stressCareDurationMs

    private fun requiredNumber(key: String): Double =
        (input.get(key) as? Number)?.toDouble()?.takeIf { it.isFinite() }
            ?: throw EngineFailure("audio-engine-failed", "Invalid $key")

    init {
        val maximum = requiredNumber("maxPendingCaptureBytes")
        if (
            !sessionId.matches(Regex("^[A-Za-z0-9_-]{1,200}$")) ||
                !validDurations(
                    totalDurationMs,
                    learningDurationMs,
                    restDurationMs,
                    stressCareDurationMs,
                ) ||
                maximum <= 0 ||
                maximum >= Long.MAX_VALUE.toDouble()
        ) {
            throw EngineFailure("audio-engine-failed", "Invalid session configuration")
        }
        maxPendingCaptureBytes = maximum.toLong()

        if (stressCareDurationMs > 0 && careAudioFiles.isEmpty()) {
            throw EngineFailure(
                "audio-source-unavailable",
                "Stress care requires local audio tracks",
            )
        }

        if (
            recoveryMetadata.getString("wordId").isEmpty() ||
                recoveryMetadata.getString("word").isEmpty() ||
                recoveryMetadata.getString("startedAt").isEmpty() ||
                recoveryMetadata.getString("sourceType") !in listOf("preset", "recording")
        ) {
            throw EngineFailure("audio-engine-failed", "Recovery identity is incomplete")
        }

        listOf("learningSubtitle", "restSubtitle", "stressCareSubtitle", "pausedSubtitle").forEach {
            notificationText.getString(it)
        }

        val calibration = input.getJSONObject("vad")
        vadSettings =
            VADSettings(
                calibration.getDouble("dbFloor"),
                calibration.getDouble("dbCeil"),
                calibration.getDouble("threshold"),
                calibration.getInt("sustainMs"),
                calibration.getInt("releaseMs"),
                calibration.getInt("preRollMs"),
                calibration.getInt("echoTailGuardMs"),
                calibration.getInt("maxSegmentMs"),
            )
        vadSettings.validate()
    }

    private fun localFile(uri: String): File {
        val parsed = Uri.parse(uri)
        if (parsed.scheme != "file" || parsed.path == null) {
            throw EngineFailure("audio-source-unavailable", "Audio paths must be local file URLs")
        }

        return File(parsed.path!!).canonicalFile
    }
}

internal data class SessionNotification(
    val state: String = "idle",
    val title: String = "BuddyBird",
    val subtitle: String = "",
    val totalDurationMs: Long = 0,
    val elapsedRunningMs: Long = 0,
) {
    val active: Boolean get() = state in listOf("starting", "running", "paused", "interrupted", "stopping")
}

class SessionEngine private constructor(private val context: Context) {
    companion object {
        @Volatile private var instance: SessionEngine? = null

        fun get(context: Context): SessionEngine =
            instance
                ?: synchronized(this) {
                    instance ?: SessionEngine(context.applicationContext).also { instance = it }
                }
    }

    val persistence = SessionPersistence(context)
    @Volatile var events: ((String, Map<String, Any?>) -> Unit)? = null
    @Volatile internal var notificationState = SessionNotification()
        private set

    private val worker = HandlerThread("BuddyBirdSession").apply { start() }
    private val handler = Handler(worker.looper)
    private val main = Handler(Looper.getMainLooper())

    internal fun dispatch(block: () -> Unit) {
        handler.post { block() }
    }
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    private val audioAttributes =
        AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build()

    private var configuration: SessionConfiguration? = null
    var state = "idle"
        private set

    private var elapsedBeforeRunMs = 0.0
    private var runningStartedAtMs = 0L
    private var phasePosition = PhasePosition(1, "learning", 0.0)

    private var targetPlayer: ExoPlayer? = null
    private var targetRequestAtMs: Long? = null
    private var carePlayer: MediaPlayer? = null
    private var chosenCare: File? = null

    private var playbackMeter: Visualizer? = null
    private val playbackMeasurement = Visualizer.MeasurementPeakRms()

    private var microphone: AudioRecord? = null
    private val microphoneGeneration = AtomicInteger(0)

    private var detector: SpeechDetector? = null
    private var pendingSamples = ShortArray(0)

    private var focusHeld = false
    private var focusRequest: AudioFocusRequest? = null
    private val focusListener = AudioManager.OnAudioFocusChangeListener { change ->
        handler.post { focusChanged(change) }
    }

    private fun focusChanged(change: Int) {
        if (
            change == AudioManager.AUDIOFOCUS_GAIN &&
                state in listOf("interrupted", "starting", "running")
        ) {
            focusHeld = true
            if (state == "interrupted") {
                try {
                    resume()
                } catch (_: Exception) {
                    // resume() persists and emits its failure.
                }
            }
        } else if (
            change in
                listOf(
                    AudioManager.AUDIOFOCUS_LOSS,
                    AudioManager.AUDIOFOCUS_LOSS_TRANSIENT,
                    AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK,
                )
        ) {
            focusHeld = false
            if (state == "running") {
                interrupt()
            }
        }
    }

    private var wakeLock: PowerManager.WakeLock? = null

    private var nextPlaybackElapsedMs = 0.0
    private var echoGuardUntilMs = 0L
    private var lastPlaybackStartDelayMs: Double? = null
    private var targetPlaybackCount = 0
    private var playbackStartedAtMs: Long? = null
    private var playbackRemainingMs = 0.0
    private var lastFailure: Map<String, Any?>? = null

    private var lastProgressSecond = -1
    private var lastCheckpointElapsedMs = 0.0

    private var service: SessionAudioService? = null
    @Volatile internal var startRequestId = 0L
        private set
    private var pendingStartCallback: ((Map<String, Any?>?, Throwable?) -> Unit)? = null
    private var failing = false

    val active: Boolean
        get() = state in listOf("starting", "running", "paused", "interrupted", "stopping")

    private val tick =
        object : Runnable {
            override fun run() {
                if (active) {
                    advance()
                    if (active) {
                        handler.postDelayed(this, 80)
                    }
                }
            }
        }

    private fun emit(event: String, body: Map<String, Any?>) {
        if (event == "onFailure") lastFailure = body
        if (event == "onStateChanged" || event == "onProgress") {
            val notification = SessionNotification(
                state, notificationTitle(), notificationSubtitle(), totalDuration(),
                (body["elapsedRunningMs"] as? Number)?.toLong() ?: 0,
            )
            notificationState = notification
            service?.let { current -> main.post { current.refresh(notification) } }
        }
        events?.invoke(event, body)
    }

    private fun startTargetPlayback() {
        val player = targetPlayer ?: throw EngineFailure("audio-engine-failed", "Target player is unavailable")
        targetRequestAtMs = SystemClock.elapsedRealtime()
        player.seekTo(0)
        player.play()
        nextPlaybackElapsedMs = Double.POSITIVE_INFINITY
    }

    private fun finishTargetPlayback() {
        targetRequestAtMs = null
        val started = playbackStartedAtMs ?: return
        playbackStartedAtMs = null
        val id = configuration?.sessionId ?: return
        emit("onTargetPlayback", mapOf(
            "sessionId" to id,
            "sequence" to targetPlaybackCount,
            "durationMs" to min(playbackRemainingMs, max(0L, SystemClock.elapsedRealtime() - started).toDouble()),
            "startDelayMs" to lastPlaybackStartDelayMs,
        ))
    }

    private fun currentElapsedRunningMs(): Double {
        val config = configuration ?: return 0.0

        var elapsedRunningMs = elapsedBeforeRunMs
        if (state == "running") {
            elapsedRunningMs += max(0L, SystemClock.elapsedRealtime() - runningStartedAtMs)
        }

        return min(config.totalDurationMs, elapsedRunningMs)
    }

    fun snapshot(): Map<String, Any?> {
        val elapsedRunningMs = currentElapsedRunningMs()
        val currentPhase =
            configuration?.let { config ->
                sessionPosition(
                    elapsedRunningMs,
                    config.totalDurationMs,
                    config.learningDurationMs,
                    config.restDurationMs,
                    config.stressCareDurationMs,
                )
            } ?: phasePosition

        return mapOf(
            "sessionId" to configuration?.sessionId,
            "state" to state,
            "elapsedRunningMs" to elapsedRunningMs,
            "cycle" to currentPhase.cycle,
            "phase" to currentPhase.phase,
            "phaseElapsedMs" to currentPhase.elapsed,
            "isTargetPlaying" to (state == "running" && targetPlayer?.isPlaying == true),
            "savedAt" to isoNow(),
            "lastPlaybackStartDelayMs" to lastPlaybackStartDelayMs,
            "targetPlaybackCount" to targetPlaybackCount,
            "failure" to lastFailure,
        )
    }

    fun requestStart(input: Map<String, Any?>, callback: (Map<String, Any?>?, Throwable?) -> Unit) {
        var requestId: Long? = null
        try {
            if (active) {
                if (input["sessionId"] != configuration?.sessionId) {
                    throw EngineFailure("audio-engine-failed", "Another session is active")
                }
                callback(snapshot(), null)
                return
            }

            if (persistence.readRecovery() != null) {
                throw EngineFailure(
                    "storage-unavailable",
                    "Commit pending session recovery before starting",
                )
            }

            val config = SessionConfiguration(JSONObject(input))
            if (
                context.checkSelfPermission(Manifest.permission.RECORD_AUDIO) !=
                    PackageManager.PERMISSION_GRANTED
            ) {
                throw EngineFailure("permission-denied", "Microphone permission is required")
            }

            if (config.captureDirectory != persistence.captures.canonicalFile) {
                throw EngineFailure(
                    "storage-unavailable",
                    "Capture directory must be files/recordings/session-captures",
                )
            }
            (listOf(config.targetAudioFile) + config.careAudioFiles).forEach {
                if (!it.isFile || !it.canRead()) {
                    throw EngineFailure("audio-source-unavailable", "Cannot read audio: ${it.name}")
                }
            }
            persistence.prepare()
            persistence.pending()

            configuration = config
            elapsedBeforeRunMs = 0.0
            phasePosition = PhasePosition(1, "learning", 0.0)
            state = "starting"

            nextPlaybackElapsedMs = 0.0
            lastPlaybackStartDelayMs = null
            targetPlaybackCount = 0
            playbackStartedAtMs = null
            lastFailure = null
            lastProgressSecond = -1
            lastCheckpointElapsedMs = 0.0

            detector = SpeechDetector(config.vadSettings)
            startRequestId++
            requestId = startRequestId
            pendingStartCallback = callback
            emit("onStateChanged", snapshot())

            try {
                val serviceIntent =
                    Intent(context, SessionAudioService::class.java)
                        .setAction(SessionAudioService.START)
                        .putExtra("requestId", requestId)
                if (Build.VERSION.SDK_INT >= 26) {
                    context.startForegroundService(serviceIntent)
                } else {
                    context.startService(serviceIntent)
                }
            } catch (error: Exception) {
                throw EngineFailure(
                    "service-start-not-allowed",
                    "Cannot start microphone foreground service: ${error.message}",
                )
            }
            handler.postDelayed(
                {
                    if (state == "starting" && requestId == startRequestId) {
                        startFailed(
                            requestId,
                            EngineFailure(
                                "service-start-not-allowed",
                                "Microphone service did not start",
                            )
                        )
                    }
                },
                4000,
            )
        } catch (error: Throwable) {
            if (requestId != null) {
                startFailed(requestId, error)
            } else {
                callback(null, error)
            }
        }
    }

    internal fun serviceStarted(value: SessionAudioService, requestId: Long, serviceStartId: Int) {
        if (state != "starting" || requestId != startRequestId || pendingStartCallback == null) {
            if (!active) main.post { value.stopSelf(serviceStartId) }
            return
        }
        service = value
        try {
            acquireAudio()
            val config = configuration!!
            val player = ExoPlayer.Builder(context).setLooper(handler.looper).build()
            targetPlayer = player
            player.setAudioAttributes(
                androidx.media3.common.AudioAttributes.Builder()
                    .setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_SPEECH).build(),
                false,
            )
            player.addListener(object : Player.Listener {
                override fun onIsPlayingChanged(isPlaying: Boolean) {
                    if (targetPlayer !== player || state != "running" || !isPlaying) return
                    val requested = targetRequestAtMs ?: return
                    targetRequestAtMs = null
                    lastPlaybackStartDelayMs = max(0L, SystemClock.elapsedRealtime() - requested).toDouble()
                    targetPlaybackCount++
                    playbackStartedAtMs = SystemClock.elapsedRealtime()
                    playbackRemainingMs = max(0L, player.duration).toDouble()
                    emit("onStateChanged", snapshot())
                }

                override fun onPlaybackStateChanged(playbackState: Int) {
                    if (targetPlayer !== player || state != "running" || playbackState != Player.STATE_ENDED) return
                    finishTargetPlayback()
                    nextPlaybackElapsedMs = currentElapsedRunningMs() + max(0L, player.duration)
                    echoGuardUntilMs = SystemClock.elapsedRealtime() + config.vadSettings.echoTailGuardMs
                    emit("onStateChanged", snapshot())
                }

                override fun onPlayerError(error: PlaybackException) {
                    if (targetPlayer === player && active) fail(EngineFailure("audio-engine-failed", error.message ?: "Target playback failed"))
                }

                override fun onAudioSessionIdChanged(audioSessionId: Int) {
                    if (targetPlayer !== player) return
                    playbackMeter?.release()
                    playbackMeter = null
                    if (audioSessionId == C.AUDIO_SESSION_ID_UNSET) return
                    try {
                        playbackMeter = Visualizer(audioSessionId).apply {
                            measurementMode = Visualizer.MEASUREMENT_MODE_PEAK_RMS
                            enabled = true
                        }
                    } catch (_: RuntimeException) {
                        playbackMeter?.release()
                        playbackMeter = null
                    }
                }
            })
            player.setMediaItem(MediaItem.fromUri(Uri.fromFile(config.targetAudioFile)))
            player.prepare()
            runningStartedAtMs = SystemClock.elapsedRealtime()
            state = "running"
            checkpoint()

            handler.post(tick)

            emit("onStateChanged", snapshot())

            completeStart(requestId, snapshot(), null)
        } catch (error: Throwable) {
            startFailed(requestId, error)
        }
    }

    private fun completeStart(requestId: Long, result: Map<String, Any?>?, error: Throwable?) {
        if (requestId != startRequestId) return
        val callback = pendingStartCallback ?: return
        pendingStartCallback = null
        callback(result, error)
    }

    private fun startFailed(requestId: Long, error: Throwable) {
        if (requestId != startRequestId || pendingStartCallback == null) return
        lastFailure = failure(error)
        state = "failed"
        cleanupAudio()

        // No clip or capture is started before start's checkpoint succeeds.
        try {
            configuration?.sessionId?.let { id ->
                if (persistence.readRecovery()?.optString("sessionId") == id) {
                    persistence.clearRecovery(id)
                }
            }
        } catch (storageError: Exception) {
            emit("onFailure", failure(storageError))
        }

        emit("onFailure", failure(error))
        emit("onStateChanged", snapshot())

        completeStart(requestId, null, error)
    }

    private fun newPlayer(file: File): MediaPlayer {
        val player = MediaPlayer()
        try {
            player.setAudioAttributes(audioAttributes)
            player.setDataSource(file.path)
            player.prepare()
            return player
        } catch (error: Exception) {
            player.release()
            throw EngineFailure(
                "audio-source-unavailable",
                "Cannot decode ${file.name}: ${error.message}",
            )
        }
    }

    private fun acquireAudio() {
        if (!focusHeld) {
            val result =
                if (Build.VERSION.SDK_INT >= 26) {
                    val request =
                        focusRequest
                            ?: AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                                .setAudioAttributes(audioAttributes)
                                .setWillPauseWhenDucked(true)
                                .setAcceptsDelayedFocusGain(false)
                                .setOnAudioFocusChangeListener(focusListener, handler)
                                .build()
                                .also { focusRequest = it }
                    audioManager.requestAudioFocus(request)
                } else {
                    audioManager.requestAudioFocus(
                        focusListener,
                        AudioManager.STREAM_MUSIC,
                        AudioManager.AUDIOFOCUS_GAIN,
                    )
                }
            if (result != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
                throw EngineFailure("audio-route-unavailable", "Audio focus is unavailable")
            }
            focusHeld = true
        }

        val minimumBufferBytes =
            AudioRecord.getMinBufferSize(
                16000,
                AudioFormat.CHANNEL_IN_MONO,
                AudioFormat.ENCODING_PCM_16BIT,
            )
        if (minimumBufferBytes <= 0) {
            throw EngineFailure(
                "audio-route-unavailable",
                "16 kHz microphone recording is unavailable",
            )
        }

        val input =
            AudioRecord.Builder()
                .setAudioSource(MediaRecorder.AudioSource.MIC)
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(16000)
                        .setChannelMask(AudioFormat.CHANNEL_IN_MONO)
                        .build()
                )
                .setBufferSizeInBytes(max(minimumBufferBytes * 2, 6400))
                .build()
        if (input.state != AudioRecord.STATE_INITIALIZED) {
            input.release()
            throw EngineFailure("audio-route-unavailable", "Microphone initialization failed")
        }
        microphone = input

        input.startRecording()
        if (input.recordingState != AudioRecord.RECORDSTATE_RECORDING) {
            throw EngineFailure("audio-engine-failed", "Microphone did not start recording")
        }

        val generation = microphoneGeneration.incrementAndGet()
        Thread(
                {
                    Process.setThreadPriority(Process.THREAD_PRIORITY_AUDIO)
                    val frame = ShortArray(1600)
                    while (microphoneGeneration.get() == generation) {
                        val count =
                            try {
                                input.read(frame, 0, frame.size, AudioRecord.READ_BLOCKING)
                            } catch (error: Exception) {
                                handler.post {
                                    if (microphoneGeneration.get() == generation) {
                                        fail(error)
                                    }
                                }
                                break
                            }
                        if (count < 0) {
                            handler.post {
                                if (microphoneGeneration.get() == generation) {
                                    fail(
                                        EngineFailure(
                                            "audio-engine-failed",
                                            "Microphone read failed ($count)",
                                        )
                                    )
                                }
                            }
                            break
                        }

                        if (count > 0) {
                            val copy = frame.copyOf(count)
                            handler.post {
                                if (microphoneGeneration.get() == generation) {
                                    consume(copy)
                                }
                            }
                        }
                    }
                },
                "BuddyBirdMicrophone",
            )
            .start()

        val power = context.getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock =
            power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "BuddyBird:learning").also {
                it.setReferenceCounted(false)
                it.acquire()
            }
    }

    private fun releaseAudio(releaseFocus: Boolean) {
        microphoneGeneration.incrementAndGet()
        microphone?.let {
            try {
                it.stop()
            } catch (_: IllegalStateException) {
                // A route change may have already stopped the microphone.
            }
            it.release()
        }
        microphone = null

        try {
            targetPlayer?.pause()
        } catch (_: IllegalStateException) {
            // Cleanup can run after the player has entered an error state.
        }

        finishTargetPlayback()

        try {
            carePlayer?.pause()
        } catch (_: IllegalStateException) {
            // Cleanup can run after the player has entered an error state.
        }

        pendingSamples = ShortArray(0)

        wakeLock?.let {
            if (it.isHeld) {
                it.release()
            }
        }
        wakeLock = null

        if (releaseFocus) {
            if (Build.VERSION.SDK_INT >= 26) {
                focusRequest?.let { audioManager.abandonAudioFocusRequest(it) }
            } else {
                audioManager.abandonAudioFocus(focusListener)
            }
            focusHeld = false
        }
    }

    private fun consume(samples: ShortArray) {
        if (
            state != "running" ||
                phasePosition.phase == "stress-care" ||
                targetPlayer?.isPlaying == true ||
                SystemClock.elapsedRealtime() < echoGuardUntilMs
        ) {
            pendingSamples = ShortArray(0)
            detector?.reset()
            return
        }

        pendingSamples += samples
        while (pendingSamples.size >= 1600) {
            val frame = pendingSamples.copyOfRange(0, 1600)
            pendingSamples = pendingSamples.copyOfRange(1600, pendingSamples.size)

            detector?.consume(frame)?.let {
                try {
                    save(it)
                } catch (error: Exception) {
                    fail(error)
                    return
                }
            }
        }
    }

    private fun save(audio: SpeechAudio) {
        val config = configuration ?: return
        val capture =
            persistence.save(
                audio,
                config.sessionId,
                phasePosition.phase,
                phasePosition.cycle,
                config.maxPendingCaptureBytes,
            )
        emit("onSegmentCaptured", capture.toMap())
    }

    private fun flush() {
        detector?.flush()?.let(::save)
        pendingSamples = ShortArray(0)
    }

    private fun advance() {
        if (state != "running") {
            return
        }

        val config = configuration ?: return
        try {
            val elapsedRunningMs = currentElapsedRunningMs()
            val nextPhase =
                sessionPosition(
                    elapsedRunningMs,
                    config.totalDurationMs,
                    config.learningDurationMs,
                    config.restDurationMs,
                    config.stressCareDurationMs,
                )
            if (nextPhase.phase != phasePosition.phase) {
                flush()

                targetPlayer?.pause()
                finishTargetPlayback()
                targetPlayer?.seekTo(0)
                carePlayer?.release()
                carePlayer = null
                chosenCare = null

                phasePosition = nextPhase
                nextPlaybackElapsedMs = elapsedRunningMs
                echoGuardUntilMs =
                    SystemClock.elapsedRealtime() + config.vadSettings.echoTailGuardMs

                checkpoint()

                emit("onStateChanged", snapshot())
            } else {
                phasePosition = nextPhase
            }

            if (elapsedRunningMs >= config.totalDurationMs) {
                finish("duration-reached")
                return
            }

            if (
                phasePosition.phase == "learning" &&
                    targetPlayer?.isPlaying != true &&
                    elapsedRunningMs >= nextPlaybackElapsedMs
            ) {
                flush()

                startTargetPlayback()
                emit("onStateChanged", snapshot())
                nextPlaybackElapsedMs = Double.POSITIVE_INFINITY
            } else if (phasePosition.phase == "stress-care" && chosenCare == null) {
                chosenCare = config.careAudioFiles.random()
                try {
                    val player = newPlayer(chosenCare!!)
                    carePlayer = player

                    player.setOnErrorListener { _, what, extra ->
                        emit(
                            "onFailure",
                            failure(
                                EngineFailure(
                                    "audio-source-unavailable",
                                    "Stress care playback failed ($what/$extra)",
                                )
                            ),
                        )
                        true
                    }

                    if (phasePosition.elapsed < player.duration) {
                        player.seekTo(phasePosition.elapsed.toInt())
                        player.start()
                    }
                } catch (error: Exception) {
                    emit("onFailure", failure(error))
                }
            }

            if (phasePosition.phase == "learning" && targetPlayer?.isPlaying == true) {
                val decibels = try {
                    if (playbackMeter?.getMeasurementPeakRms(playbackMeasurement) == Visualizer.SUCCESS) {
                        playbackMeasurement.mRms / 100.0
                    } else -160.0
                } catch (_: IllegalStateException) {
                    -160.0
                }
                emit("onPlaybackMetering", mapOf("decibels" to decibels))
            }

            if (elapsedRunningMs - lastCheckpointElapsedMs >= 15000) {
                checkpoint()
            }

            if ((elapsedRunningMs / 1000).toInt() != lastProgressSecond) {
                lastProgressSecond = (elapsedRunningMs / 1000).toInt()
                emit("onProgress", snapshot())
            }
        } catch (error: Exception) {
            fail(error)
        }
    }

    fun pause(): Map<String, Any?> {
        if (state != "running" && state != "interrupted") {
            return snapshot()
        }
        elapsedBeforeRunMs = currentElapsedRunningMs()
        state = "paused"

        try {
            flush()
            releaseAudio(true)

            checkpoint()

            emit("onStateChanged", snapshot())
            return snapshot()
        } catch (error: Exception) {
            fail(error)
            throw error
        }
    }

    fun resume(): Map<String, Any?> {
        if (state != "paused" && state != "interrupted") {
            return snapshot()
        }

        try {
            acquireAudio()
            runningStartedAtMs = SystemClock.elapsedRealtime()
            state = "running"

            if (phasePosition.phase == "stress-care") {
                carePlayer?.let {
                    if (phasePosition.elapsed < it.duration) {
                        it.seekTo(phasePosition.elapsed.toInt())
                        it.start()
                    }
                }
            } else if (phasePosition.phase == "learning") {
                startTargetPlayback()
            }
            lastFailure = null

            echoGuardUntilMs =
                SystemClock.elapsedRealtime() + (configuration?.vadSettings?.echoTailGuardMs ?: 200)

            checkpoint()

            emit("onStateChanged", snapshot())
            return snapshot()
        } catch (error: Exception) {
            elapsedBeforeRunMs = currentElapsedRunningMs()
            state = "interrupted"
            releaseAudio(true)
            emit("onFailure", failure(error))
            emit("onStateChanged", snapshot())
            throw error
        }
    }

    private fun interrupt() {
        elapsedBeforeRunMs = currentElapsedRunningMs()
        state = "interrupted"

        try {
            flush()
            releaseAudio(false)

            checkpoint()

            emit("onStateChanged", snapshot())
        } catch (error: Exception) {
            fail(error)
        }
    }

    fun stop(): Map<String, Any?> {
        if (state == "starting") {
            val requestId = startRequestId
            state = "idle"
            cleanupAudio()
            val cancelled = snapshot()
            emit("onStateChanged", cancelled)
            completeStart(requestId, cancelled, null)
            return cancelled
        }
        return if (active) finish("user-stopped") else snapshot()
    }

    private fun finish(reason: String): Map<String, Any?> {
        elapsedBeforeRunMs = currentElapsedRunningMs()
        state = "stopping"

        try {
            flush()
            cleanupAudio()
            lastFailure = null
            state =
                if (reason == "duration-reached") {
                    "completed"
                } else {
                    "idle"
                }
            checkpoint(reason)

            emit("onStateChanged", snapshot())
            return snapshot()
        } catch (error: Exception) {
            fail(error)
            throw error
        }
    }

    internal fun taskRemoved() {
        if (active) {
            try {
                if (state == "starting") stop() else finish("task-removed")
            } catch (_: Exception) {
                // finish() persists and emits its failure before the service stops.
            }
        }
    }

    internal fun serviceDestroyed(value: SessionAudioService) {
        if (service !== value) {
            return
        }
        service = null
        if (active) {
            fail(
                EngineFailure(
                    "audio-engine-failed",
                    "Audio foreground service stopped unexpectedly",
                )
            )
        }
    }

    internal fun serviceFailed(requestId: Long, error: Throwable) {
        if (requestId == startRequestId && state == "starting") startFailed(requestId, error)
    }

    private fun checkpoint(reason: String? = null) {
        val config = configuration ?: return
        val record = JSONObject(config.input.toString()).put("snapshot", JSONObject(snapshot()))
        if (reason != null) {
            record.put("reason", reason)
        }
        persistence.writeRecovery(record)
        lastCheckpointElapsedMs = currentElapsedRunningMs()
    }

    private fun failure(error: Throwable): Map<String, Any?> =
        mapOf(
            "code" to
                ((error as? EngineFailure)?.code
                    ?: if (error is IOException || error is org.json.JSONException) {
                        "storage-unavailable"
                    } else {
                        "audio-engine-failed"
                    }),
            "message" to (error.message ?: error.javaClass.simpleName),
            "recoverable" to true,
        )

    private fun fail(error: Throwable) {
        if (pendingStartCallback != null) {
            startFailed(startRequestId, error)
            return
        }
        if (failing) {
            return
        }
        failing = true
        elapsedBeforeRunMs = currentElapsedRunningMs()
        state = "failed"

        try {
            flush()
        } catch (storageError: Exception) {
            emit("onFailure", failure(storageError))
        }

        cleanupAudio()
        lastFailure = failure(error)
        try {
            checkpoint("failure")
        } catch (storageError: Exception) {
            emit("onFailure", failure(storageError))
        }

        emit("onFailure", failure(error))
        emit("onStateChanged", snapshot())
        failing = false
    }

    private fun cleanupAudio() {
        handler.removeCallbacks(tick)

        releaseAudio(true)
        playbackMeter?.release()
        playbackMeter = null
        targetPlayer?.release()
        targetPlayer = null
        carePlayer?.release()
        carePlayer = null
        chosenCare = null

        val stopping = service
        service = null
        val stoppedRequestId = startRequestId
        main.post {
            if (startRequestId != stoppedRequestId) return@post
            stopping?.stopForeground(android.app.Service.STOP_FOREGROUND_REMOVE)
            stopping?.stopSelf()
        }
    }

    internal fun notificationTitle(): String =
        configuration?.recoveryMetadata?.optString("word") ?: "BuddyBird"

    internal fun notificationSubtitle(): String {
        val config = configuration ?: return ""
        val subtitleKey =
            if (state == "paused" || state == "interrupted") {
                "pausedSubtitle"
            } else {
                when (phasePosition.phase) {
                    "learning" -> "learningSubtitle"
                    "rest" -> "restSubtitle"
                    else -> "stressCareSubtitle"
                }
            }
        return config.notificationText
            .getString(subtitleKey)
            .replace("%{cycle}", phasePosition.cycle.toString())
            .replace(
                "%{total}",
                ceil(config.totalDurationMs / config.cycleDurationMs).toInt().toString(),
            )
    }

    internal fun totalDuration(): Long = configuration?.totalDurationMs?.toLong() ?: 0

    fun clearRecovery(sessionId: String) {
        if (active) {
            throw EngineFailure("storage-unavailable", "Cannot clear an active session")
        }
        persistence.clearRecovery(sessionId)
    }

    fun pendingRecovery(): Map<String, Any?>? =
        persistence.readRecovery()?.toMap()?.let(::recoveredSession)
}
