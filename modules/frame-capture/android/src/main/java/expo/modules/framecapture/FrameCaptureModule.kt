package expo.modules.framecapture

import android.graphics.ImageFormat
import android.graphics.Rect
import android.graphics.YuvImage
import com.oney.WebRTCModule.videoEffects.ProcessorProvider
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessorFactoryInterface
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.webrtc.SurfaceTextureHelper
import org.webrtc.VideoFrame
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.concurrent.Executors

const val PROCESSOR_NAME = "frameCapture"

/** 송출 중인 카메라 프레임을 일정 간격으로 JPEG 파일로 저장하는 처리기 */
class FrameCaptureProcessor(private val outputDir: File) : VideoFrameProcessor {
  private val encoder = Executors.newSingleThreadExecutor()
  private var lastCaptureAt = 0L

  override fun process(frame: VideoFrame, textureHelper: SurfaceTextureHelper?): VideoFrame {
    val now = System.currentTimeMillis()

    if (FrameCaptureState.enabled && now - lastCaptureAt >= FrameCaptureState.intervalMs) {
      lastCaptureAt = now

      // 프레임을 I420으로 바꾼 뒤 인코딩은 다른 스레드에서 처리해 송출이 막히지 않게 함
      val i420 = frame.buffer.toI420()
      val rotation = frame.rotation

      if (i420 != null) {
        encoder.execute {
          try {
            val started = System.nanoTime()
            val jpeg = encodeJpeg(i420)
            val file = File(outputDir, "frame-$now.jpg")
            file.writeBytes(jpeg)
            FrameCaptureState.record(file.absolutePath, now, i420.width, i420.height, rotation, jpeg.size, (System.nanoTime() - started) / 1_000_000)
          } finally {
            i420.release()
          }
        }
      }
    }

    // 원본 프레임을 그대로 송출, 호출한 쪽이 반환 프레임을 release하므로 참조를 하나 더 잡음
    frame.retain()

    return frame
  }

  private fun encodeJpeg(i420: VideoFrame.I420Buffer): ByteArray {
    val width = i420.width
    val height = i420.height
    val nv21 = ByteArray(width * height * 3 / 2)

    // Y 평면 복사
    val y = i420.dataY
    for (row in 0 until height) {
      y.position(row * i420.strideY)
      y.get(nv21, row * width, width)
    }

    // U, V 평면을 VU 순서로 섞어 NV21로 변환
    val u = i420.dataU
    val v = i420.dataV
    val chromaHeight = (height + 1) / 2
    val chromaWidth = (width + 1) / 2
    var offset = width * height
    for (row in 0 until chromaHeight) {
      for (col in 0 until chromaWidth) {
        nv21[offset++] = v.get(row * i420.strideV + col)
        nv21[offset++] = u.get(row * i420.strideU + col)
      }
    }

    val out = ByteArrayOutputStream()
    YuvImage(nv21, ImageFormat.NV21, width, height, null).compressToJpeg(Rect(0, 0, width, height), FrameCaptureState.quality, out)

    return out.toByteArray()
  }
}

/** JS와 처리기가 함께 쓰는 캡처 설정과 최근 결과 */
object FrameCaptureState {
  @Volatile var enabled = false
  @Volatile var intervalMs = 5000L
  @Volatile var quality = 70
  @Volatile var last: Map<String, Any>? = null
  @Volatile var count = 0

  fun record(path: String, capturedAt: Long, width: Int, height: Int, rotation: Int, bytes: Int, encodeMs: Long) {
    count += 1
    last = mapOf(
      "path" to path,
      "capturedAt" to capturedAt.toDouble(),
      "width" to width,
      "height" to height,
      "rotation" to rotation,
      "bytes" to bytes,
      "encodeMs" to encodeMs.toDouble(),
      "count" to count,
    )
  }
}

class FrameCaptureModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FrameCapture")

    OnCreate {
      val dir = File(requireNotNull(appContext.reactContext) { "React context is not ready" }.cacheDir, "frame-capture").apply { mkdirs() }

      ProcessorProvider.addProcessor(PROCESSOR_NAME, VideoFrameProcessorFactoryInterface { FrameCaptureProcessor(dir) })
    }

    Function("configure") { enabled: Boolean, intervalMs: Double, quality: Int ->
      FrameCaptureState.enabled = enabled
      FrameCaptureState.intervalMs = intervalMs.toLong()
      FrameCaptureState.quality = quality
    }

    Function("getLastCapture") {
      FrameCaptureState.last
    }
  }
}
