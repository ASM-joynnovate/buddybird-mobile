package expo.modules.audiomode

import android.content.Context
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AudioModeModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AudioMode")

    // 통화 모드에서만 기기 에코 제거와 소음 억제가 동작함
    Function("setCommunicationMode") { enabled: Boolean ->
      // 예외가 발생하면 JS의 연결 정리가 중단됨
      val context = appContext.reactContext ?: return@Function
      val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

      audioManager.mode = if (enabled) AudioManager.MODE_IN_COMMUNICATION else AudioManager.MODE_NORMAL

      setSpeaker(audioManager, enabled)
    }
  }

  /** 통화 모드 출력을 스피커로 변경하는 함수 */
  @Suppress("DEPRECATION")
  private fun setSpeaker(audioManager: AudioManager, enabled: Boolean) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      audioManager.isSpeakerphoneOn = enabled

      return
    }

    if (!enabled) {
      audioManager.clearCommunicationDevice()

      return
    }

    audioManager.availableCommunicationDevices
      .firstOrNull { device -> device.type == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER }
      ?.let { speaker -> audioManager.setCommunicationDevice(speaker) }
  }
}
