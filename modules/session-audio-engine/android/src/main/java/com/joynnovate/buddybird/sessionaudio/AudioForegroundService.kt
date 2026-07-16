package com.joynnovate.buddybird.sessionaudio

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat

class AudioForegroundService : Service() {
  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      runCatching { SessionAudioEngineRuntime.stop() }
      stopSelf()
      return START_NOT_STICKY
    }

    val notification = createNotification()
    val foregroundTypes = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
    } else {
      0
    }
    try {
      ServiceCompat.startForeground(this, NOTIFICATION_ID, notification, foregroundTypes)
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

  override fun onDestroy() {
    SessionAudioEngineRuntime.onServiceDestroyed()
    super.onDestroy()
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(
      NotificationChannel(CHANNEL_ID, "학습 세션", NotificationManager.IMPORTANCE_LOW).apply {
        description = "진행 중인 버디버드 음성 학습"
      },
    )
  }

  private fun createNotification() = NotificationCompat.Builder(this, CHANNEL_ID)
    .setSmallIcon(android.R.drawable.ic_media_play)
    .setContentTitle("버디버드 학습 중")
    .setContentText("목표 단어 재생과 발화 녹음을 진행하고 있어요.")
    .setOngoing(true)
    .setContentIntent(openAppIntent())
    .addAction(0, "학습 종료", stopIntent())
    .build()

  private fun openAppIntent(): PendingIntent? {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName) ?: return null
    return PendingIntent.getActivity(this, 0, launchIntent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  private fun stopIntent(): PendingIntent {
    val intent = Intent(this, AudioForegroundService::class.java).setAction(ACTION_STOP)
    return PendingIntent.getService(this, 1, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  companion object {
    const val ACTION_START = "com.joynnovate.buddybird.sessionaudio.START"
    const val ACTION_STOP = "com.joynnovate.buddybird.sessionaudio.STOP"
    private const val CHANNEL_ID = "buddybird-training-session"
    private const val NOTIFICATION_ID = 4021
  }
}
