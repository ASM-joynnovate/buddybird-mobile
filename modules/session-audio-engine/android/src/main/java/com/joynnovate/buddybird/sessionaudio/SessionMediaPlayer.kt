package com.joynnovate.buddybird.sessionaudio

import android.os.Looper
import android.util.Log
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.common.SimpleBasePlayer
import androidx.media3.common.util.UnstableApi
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture
import java.util.concurrent.Executor

// MediaSession 에 붙이는 플레이어는 목표 음원을 재생하는 ExoPlayer 가 아니라 "학습 세션 전체"를
// 한 곡처럼 표현하는 가상 플레이어다. 이유는 두 가지다.
//
// 1. 실제 재생은 몇 초짜리 클립을 따라하기 공백을 두고 반복하고 휴식 구간에는 아예 멈춘다.
//    ExoPlayer 를 그대로 노출하면 잠금화면의 재생 상태가 몇 초마다 깜빡이고 진행바가
//    세션 진행률이 아니라 클립 안의 위치를 가리킨다.
// 2. ExoPlayer 는 activateAudio 마다 전용 HandlerThread 위에서 새로 만들어지고 stopAudio 에서
//    해제된다. 일시정지를 오가는 동안 살아 있어야 하는 MediaSession 의 수명주기와 맞지 않는다.
//
// 대신 duration 은 세션 전체 길이, position 은 세션 경과 시간으로 노출한다.
@UnstableApi
class SessionMediaPlayer(private val commandExecutor: Executor) : SimpleBasePlayer(Looper.getMainLooper()) {
  override fun getState(): State {
    val media = SessionAudioEngineRuntime.mediaState()
      ?: return State.Builder().setAvailableCommands(Player.Commands.EMPTY).build()

    val metadata = MediaMetadata.Builder()
      .setTitle(media.title)
      .setArtist(media.subtitle)
      .build()
    val item = MediaItemData.Builder(media.sessionId)
      .setMediaItem(MediaItem.Builder().setMediaId(media.sessionId).setMediaMetadata(metadata).build())
      .setMediaMetadata(metadata)
      .setDurationUs(media.durationMs * 1_000)
      // 세션 시간을 사용자가 스크럽하면 안 된다 — 경과 시간은 학습 기록의 근거다.
      .setIsSeekable(false)
      .build()

    return State.Builder()
      .setAvailableCommands(COMMANDS)
      .setPlaybackState(Player.STATE_READY)
      .setPlayWhenReady(media.isPlaying, Player.PLAY_WHEN_READY_CHANGE_REASON_USER_REQUEST)
      .setPlaylist(listOf(item))
      .setCurrentMediaItemIndex(0)
      // 위치는 media3 가 폴링한다 — 1초마다 알림을 다시 그릴 필요가 없다.
      .setContentPositionMs(PositionSupplier { SessionAudioEngineRuntime.mediaPositionMs() })
      .build()
  }

  override fun handleSetPlayWhenReady(playWhenReady: Boolean): ListenableFuture<*> = dispatch {
    if (playWhenReady) SessionAudioEngineRuntime.resume() else SessionAudioEngineRuntime.pause()
  }

  override fun handleStop(): ListenableFuture<*> = dispatch { SessionAudioEngineRuntime.stop() }

  override fun handleRelease(): ListenableFuture<*> = Futures.immediateVoidFuture()

  // SimpleBasePlayer.invalidateState 는 protected 라 서비스가 직접 부를 수 없다.
  // 엔진 상태가 바뀌었을 때 getState 를 다시 읽게 하는 유일한 통로다.
  fun refreshState() = invalidateState()

  // 엔진 명령은 오디오 장치를 열고 닫느라 최대 수 초가 걸린다(resume 은 ExoPlayer 준비를 4초까지
  // 기다린다). 메인 스레드에서 그대로 부르면 ANR 이므로 전용 스레드로 넘기고 즉시 완료된 future 를
  // 돌려준다. 실제 상태는 엔진의 onMediaStateChanged → invalidateState 로 반영된다.
  private fun dispatch(action: () -> Unit): ListenableFuture<*> {
    commandExecutor.execute {
      try {
        action()
      } catch (error: Throwable) {
        Log.w(TAG, "Media control command failed", error)
      }
    }
    return Futures.immediateVoidFuture()
  }

  private companion object {
    const val TAG = "SessionMediaPlayer"

    // 트랙 이동·탐색은 노출하지 않는다 — 세션은 단어 하나짜리이고 시간을 건너뛸 수 없다.
    val COMMANDS: Player.Commands = Player.Commands.Builder()
      .addAll(
        Player.COMMAND_PLAY_PAUSE,
        Player.COMMAND_STOP,
        Player.COMMAND_GET_CURRENT_MEDIA_ITEM,
        Player.COMMAND_GET_TIMELINE,
        Player.COMMAND_GET_METADATA,
      )
      .build()
  }
}
