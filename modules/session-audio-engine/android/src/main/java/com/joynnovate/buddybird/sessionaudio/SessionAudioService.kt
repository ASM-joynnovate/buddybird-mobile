package com.joynnovate.buddybird.sessionaudio

import android.app.*
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.MediaMetadata
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Build
import android.os.IBinder
import android.os.SystemClock

class SessionAudioService : Service() {
    companion object {
        const val START = "com.joynnovate.buddybird.sessionaudio.START"
        const val STOP = "com.joynnovate.buddybird.sessionaudio.STOP"
        const val PAUSE = "com.joynnovate.buddybird.sessionaudio.PAUSE"
        const val RESUME = "com.joynnovate.buddybird.sessionaudio.RESUME"
        private const val CHANNEL = "buddybird-training-session"
        private const val NOTIFICATION_ID = 4021
    }

    private lateinit var engine: SessionEngine
    private lateinit var media: MediaSession

    override fun onCreate() {
        super.onCreate()
        engine = SessionEngine.get(this)

        if (Build.VERSION.SDK_INT >= 26) {
            val channel =
                NotificationChannel(CHANNEL, "BuddyBird", NotificationManager.IMPORTANCE_LOW)
            channel.setSound(null, null)
            channel.enableVibration(false)
            channel.lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
        media =
            MediaSession(this, "BuddyBirdLearning").apply {
                setCallback(
                    object : MediaSession.Callback() {
                        override fun onPlay() {
                            command(RESUME)
                        }

                        override fun onPause() {
                            command(PAUSE)
                        }

                        override fun onStop() {
                            command(STOP)
                        }
                    }
                )
                isActive = true
            }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == START && engine.state == "starting") {
            try {
                if (Build.VERSION.SDK_INT >= 30) {
                    startForeground(
                        NOTIFICATION_ID,
                        notification(),
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or
                            ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK,
                    )
                } else {
                    startForeground(NOTIFICATION_ID, notification())
                }
                engine.serviceStarted(this)
            } catch (error: Exception) {
                engine.serviceFailed(
                    EngineFailure(
                        "service-start-not-allowed",
                        "Cannot start microphone foreground service: ${error.message}",
                    )
                )
                stopSelf()
            }
        } else if (engine.active) {
            command(intent?.action)
        } else {
            stopSelf()
        }

        return START_NOT_STICKY
    }

    private fun command(action: String?) {
        try {
            when (action) {
                STOP -> engine.stop()
                PAUSE -> engine.pause()
                RESUME -> engine.resume()
            }
        } catch (_: Exception) {
            /* Engine reports and persists command failures. */
        }
    }

    private fun actionIntent(action: String, code: Int): PendingIntent =
        PendingIntent.getService(
            this,
            code,
            Intent(this, SessionAudioService::class.java).setAction(action),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    private fun notification(): Notification {
        val running = engine.state == "running" || engine.state == "starting"
        val builder =
            if (Build.VERSION.SDK_INT >= 26) {
                Notification.Builder(this, CHANNEL)
            } else {
                Notification.Builder(this)
            }
        val launch = packageManager.getLaunchIntentForPackage(packageName)
        if (launch != null) {
            builder.setContentIntent(
                PendingIntent.getActivity(
                    this,
                    0,
                    launch,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
                )
            )
        }

        return builder
            .setSmallIcon(android.R.drawable.ic_media_play)
            .setContentTitle(engine.notificationTitle())
            .setContentText(engine.notificationSubtitle())
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .setCategory(Notification.CATEGORY_TRANSPORT)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setOngoing(false)
            .setDeleteIntent(actionIntent(STOP, 4))
            .addAction(
                Notification.Action.Builder(
                        if (running) {
                            android.R.drawable.ic_media_pause
                        } else {
                            android.R.drawable.ic_media_play
                        },
                        if (running) {
                            "Pause"
                        } else {
                            "Play"
                        },
                        actionIntent(
                            if (running) {
                                PAUSE
                            } else {
                                RESUME
                            },
                            1,
                        ),
                    )
                    .build()
            )
            .addAction(
                Notification.Action.Builder(
                        android.R.drawable.ic_menu_close_clear_cancel,
                        "Stop",
                        actionIntent(STOP, 2),
                    )
                    .build()
            )
            .setStyle(
                Notification.MediaStyle()
                    .setMediaSession(media.sessionToken)
                    .setShowActionsInCompactView(0, 1)
            )
            .build()
    }

    fun refresh() {
        val snapshot = engine.snapshot()
        val running = engine.state == "running"
        media.setMetadata(
            MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, engine.notificationTitle())
                .putString(MediaMetadata.METADATA_KEY_ARTIST, engine.notificationSubtitle())
                .putLong(MediaMetadata.METADATA_KEY_DURATION, engine.totalDuration())
                .build()
        )

        media.setPlaybackState(
            PlaybackState.Builder()
                .setActions(
                    PlaybackState.ACTION_PLAY or
                        PlaybackState.ACTION_PAUSE or
                        PlaybackState.ACTION_PLAY_PAUSE or
                        PlaybackState.ACTION_STOP
                )
                .setState(
                    if (running) {
                        PlaybackState.STATE_PLAYING
                    } else {
                        PlaybackState.STATE_PAUSED
                    },
                    (snapshot["elapsedRunningMs"] as Number).toLong(),
                    if (running) {
                        1f
                    } else {
                        0f
                    },
                    SystemClock.elapsedRealtime(),
                )
                .build()
        )

        getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, notification())
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        engine.taskRemoved()
        stopSelf()
        super.onTaskRemoved(rootIntent)
    }

    override fun onDestroy() {
        engine.serviceDestroyed(this)
        media.isActive = false
        media.release()

        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
