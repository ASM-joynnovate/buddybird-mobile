package expo.modules.framecapture

import android.content.Context
import android.media.MediaCodecInfo
import android.media.MediaFormat
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.objectdetector.ObjectDetector

internal const val MICROS_PER_MILLI = 1000L
private const val KEYFRAME_INTERVAL_SECONDS = 2

/** Surface 입력 H.264 설정 함수 */
internal fun avcEncoderFormat(width: Int, height: Int, bitrate: Int, frameRate: Int): MediaFormat {
  return MediaFormat.createVideoFormat(MediaFormat.MIMETYPE_VIDEO_AVC, width, height).apply {
    setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
    setInteger(MediaFormat.KEY_BIT_RATE, bitrate)
    setInteger(MediaFormat.KEY_FRAME_RATE, frameRate)
    setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, KEYFRAME_INTERVAL_SECONDS)
  }
}

/** 검출 모델 생성 함수 */
internal fun createObjectDetector(
  context: Context,
  modelFile: String,
  category: String,
  scoreThreshold: Float,
  maxResults: Int?,
): ObjectDetector {
  val builder = ObjectDetector.ObjectDetectorOptions.builder()
    .setBaseOptions(BaseOptions.builder().setModelAssetPath(modelFile).build())
    .setRunningMode(RunningMode.IMAGE)
    .setCategoryAllowlist(listOf(category))
    .setScoreThreshold(scoreThreshold)

  maxResults?.let { builder.setMaxResults(it) }

  return ObjectDetector.createFromOptions(context, builder.build())
}
