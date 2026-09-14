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
    private var destroyed = false

    override fun onCreate() {
        super.onCreate()
        engine = SessionEngine.get(this)

        if (Build.VERSION.SDK_INT >= 26) {
            val channel =
                NotificationChannel(CHANNEL, getString(R.string.buddybird_session_channel), NotificationManager.IMPORTANCE_LOW)
            channel.description = getString(R.string.buddybird_session_channel_description)
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
        val snapshot = engine.notificationState
        if (intent?.action == START && snapshot.state == "starting") {
            try {
                if (Build.VERSION.SDK_INT >= 30) {
                    startForeground(
                        NOTIFICATION_ID,
                        notification(snapshot),
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or
                            ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK,
                    )
                } else {
                    startForeground(NOTIFICATION_ID, notification(snapshot))
                }
                engine.dispatch { engine.serviceStarted(this) }
            } catch (error: Exception) {
                engine.dispatch {
                    engine.serviceFailed(EngineFailure("service-start-not-allowed", "Cannot start microphone foreground service: ${error.message}"))
                }
                stopSelf()
            }
        } else if (snapshot.active) {
            command(intent?.action)
        } else {
            stopSelf()
        }

        return START_NOT_STICKY
    }

    private fun command(action: String?) {
        engine.dispatch {
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
    }

    private fun actionIntent(action: String, code: Int): PendingIntent =
        PendingIntent.getService(
            this,
            code,
            Intent(this, SessionAudioService::class.java).setAction(action),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    private fun notification(snapshot: SessionNotification): Notification {
        val running = snapshot.state == "running" || snapshot.state == "starting"
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
            .setContentTitle(snapshot.title)
            .setContentText(snapshot.subtitle)
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
                            getString(R.string.buddybird_session_pause)
                        } else {
                            getString(R.string.buddybird_session_resume)
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
                        getString(R.string.buddybird_session_stop),
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

    internal fun refresh(snapshot: SessionNotification) {
        if (destroyed) return
        val running = snapshot.state == "running"
        media.setMetadata(
            MediaMetadata.Builder()
                .putString(MediaMetadata.METADATA_KEY_TITLE, snapshot.title)
                .putString(MediaMetadata.METADATA_KEY_ARTIST, snapshot.subtitle)
                .putLong(MediaMetadata.METADATA_KEY_DURATION, snapshot.totalDurationMs)
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
                    snapshot.elapsedRunningMs,
                    if (running) {
                        1f
                    } else {
                        0f
                    },
                    SystemClock.elapsedRealtime(),
                )
                .build()
        )

        getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, notification(snapshot))
    }

    override fun onTaskRemoved(rootIntent: Intent?) {
        engine.dispatch { engine.taskRemoved() }
        stopSelf()
        super.onTaskRemoved(rootIntent)
    }

    override fun onDestroy() {
        destroyed = true
        engine.dispatch { engine.serviceDestroyed(this) }
        media.isActive = false
        media.release()

        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
