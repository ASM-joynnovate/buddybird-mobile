package com.joynnovate.buddybird.sessionaudio

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaStyleNotificationHelper
import java.util.concurrent.Executors

@UnstableApi
class AudioForegroundService : Service() {
  private val mainHandler = Handler(Looper.getMainLooper())
  // 알림 액션과 MediaSession 명령이 같은 스레드를 타야 pause/resume 이 뒤섞이지 않는다.
  // 메인 스레드에서 부르면 안 된다 — resume 은 ExoPlayer 준비를 4초까지 기다린다.
  private val commandExecutor = Executors.newSingleThreadExecutor()
  private var mediaSession: MediaSession? = null
  private var mediaPlayer: SessionMediaPlayer? = null
  // 목표 음원 재생이 몇 초마다 시작·종료되며 상태 이벤트를 쏟아내지만 알림 내용은 그대로다.
  // 마지막으로 그린 값과 같으면 다시 그리지 않아 깜빡임과 불필요한 갱신을 막는다.
  private var lastRenderedState: SessionMediaState? = null

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
    val player = SessionMediaPlayer(commandExecutor)
    mediaPlayer = player
    // 명시적 id — 같은 프로세스에 다른 MediaSession(expo-audio 등)이 생기면 기본 id 가 충돌한다.
    val sessionBuilder = MediaSession.Builder(this, player).setId(CHANNEL_ID)
    // 잠금화면 미디어 위젯을 탭하면 앱으로 들어온다.
    openAppIntent()?.let { sessionBuilder.setSessionActivity(it) }
    mediaSession = sessionBuilder.build()
    SessionAudioEngineRuntime.onMediaStateChanged = { mainHandler.post(::refreshNotification) }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> {
        // 알림을 밀어서 없애는 것도(deleteIntent) 이 경로다 — 일시정지 중에는 알림이 dismiss
        // 가능해지는데, 서비스만 남겨 두면 화면에도 알림에도 없는 세션이 마이크를 붙든다.
        commandExecutor.execute { runCatching { SessionAudioEngineRuntime.stop() } }
        stopSelf()
        return START_NOT_STICKY
      }
      ACTION_PAUSE -> {
        commandExecutor.execute { runCatching { SessionAudioEngineRuntime.pause() } }
        return START_NOT_STICKY
      }
      ACTION_RESUME -> {
        commandExecutor.execute { runCatching { SessionAudioEngineRuntime.resume() } }
        return START_NOT_STICKY
      }
    }

    val foregroundTypes = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
    } else {
      0
    }
    try {
      ServiceCompat.startForeground(this, NOTIFICATION_ID, buildNotification(), foregroundTypes)
    } catch (error: Exception) {
      // Android 14+는 mic 타입 FGS의 while-in-use 조건을 startForeground 시점에 검사해
      // SecurityException을 던진다 (시작 직후 백그라운드 전환 레이스). uncaught면 앱 전체
      // 크래시이므로 세션 실패로 강등한다. stopSelf 없이 5초가 지나면
      // ForegroundServiceDidNotStartInTimeException으로 역시 크래시라 즉시 중지한다.
      SessionAudioEngineRuntime.onServiceStartFailed(error)
      stopSelf()
      return START_NOT_STICKY
    }
    SessionAudioEngineRuntime.onServiceStarted()
    return START_NOT_STICKY
  }

  override fun onBind(intent: Intent?): IBinder? = null

  // 최근 앱에서 태스크 제거 = 명시적 종료 의도. 세션을 중단해 복구 기록을 남기고
  // (5분 이상 진행분은 다음 실행에서 적립) 서비스를 내린다.
  override fun onTaskRemoved(rootIntent: Intent?) {
    runCatching { SessionAudioEngineRuntime.stop("task-removed") }
    stopSelf()
    super.onTaskRemoved(rootIntent)
  }

  override fun onDestroy() {
    SessionAudioEngineRuntime.onMediaStateChanged = null
    mediaSession?.release()
    mediaSession = null
    mediaPlayer = null
    commandExecutor.shutdown()
    SessionAudioEngineRuntime.onServiceDestroyed()
    super.onDestroy()
  }

  // 엔진 상태가 바뀔 때마다 알림을 다시 발행한다. MediaSession 쪽은 플레이어 상태를 다시 읽게
  // 하고(invalidateState) 잠금화면 위젯이 따라오게 한다.
  private fun refreshNotification() {
    // 세션이 끝난 뒤에도 플레이어는 무효화해야 잠금화면 위젯이 남지 않는다.
    mediaPlayer?.refreshState()
    val media = SessionAudioEngineRuntime.mediaState() ?: return
    if (media == lastRenderedState) return
    getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, buildNotification())
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(
      NotificationChannel(CHANNEL_ID, getString(R.string.session_audio_channel_name), NotificationManager.IMPORTANCE_LOW).apply {
        description = getString(R.string.session_audio_channel_description)
      },
    )
  }

  private fun buildNotification(): Notification {
    val media = SessionAudioEngineRuntime.mediaState()
    lastRenderedState = media
    // 세션 설정이 아직 없는 시점(startForeground 직전)에는 리소스 문구로 대체한다.
    val title = media?.title?.takeIf { it.isNotBlank() } ?: getString(R.string.session_audio_notification_title)
    val text = media?.subtitle?.takeIf { it.isNotBlank() } ?: getString(R.string.session_audio_notification_text)
    val playing = media?.isPlaying ?: true

    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_session_notification)
      .setContentTitle(title)
      .setContentText(text)
      .setOngoing(true)
      // 상태가 바뀔 때마다 다시 발행하므로 알림음·진동이 반복되면 안 된다.
      .setSilent(true)
      .setContentIntent(openAppIntent())
      .setDeleteIntent(stopIntent())
      // 단어 이름만 노출된다 — 보호자 PII 가 아니므로 잠금화면에서 그대로 보여 준다.
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .addAction(
        if (playing) androidx.media3.session.R.drawable.media3_icon_pause else androidx.media3.session.R.drawable.media3_icon_play,
        getString(if (playing) R.string.session_audio_pause_action else R.string.session_audio_resume_action),
        if (playing) pauseIntent() else resumeIntent(),
      )
      .addAction(
        androidx.media3.session.R.drawable.media3_icon_stop,
        getString(R.string.session_audio_stop_action),
        stopIntent(),
      )

    // MediaStyle 은 세션 토큰이 있어야 잠금화면·빠른설정의 미디어 영역에 뜬다.
    mediaSession?.let { session ->
      builder.setStyle(MediaStyleNotificationHelper.MediaStyle(session).setShowActionsInCompactView(0, 1))
    }
    return builder.build()
  }

  private fun openAppIntent(): PendingIntent? {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName) ?: return null
    return PendingIntent.getActivity(this, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun stopIntent(): PendingIntent = serviceIntent(ACTION_STOP, requestCode = 1)

  private fun pauseIntent(): PendingIntent = serviceIntent(ACTION_PAUSE, requestCode = 2)

  private fun resumeIntent(): PendingIntent = serviceIntent(ACTION_RESUME, requestCode = 3)

  private fun serviceIntent(action: String, requestCode: Int): PendingIntent {
    val intent = Intent(this, AudioForegroundService::class.java).setAction(action)
    return PendingIntent.getService(this, requestCode, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  companion object {
    const val ACTION_START = "com.joynnovate.buddybird.sessionaudio.START"
    const val ACTION_STOP = "com.joynnovate.buddybird.sessionaudio.STOP"
    const val ACTION_PAUSE = "com.joynnovate.buddybird.sessionaudio.PAUSE"
    const val ACTION_RESUME = "com.joynnovate.buddybird.sessionaudio.RESUME"
    private const val CHANNEL_ID = "buddybird-training-session"
    private const val NOTIFICATION_ID = 4021
  }
}
