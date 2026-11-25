package expo.modules.framecapture

import com.oney.WebRTCModule.videoEffects.ProcessorProvider
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessor
import com.oney.WebRTCModule.videoEffects.VideoFrameProcessorFactoryInterface
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.webrtc.SurfaceTextureHelper
import org.webrtc.VideoFrame
import java.io.File
import java.util.concurrent.atomic.AtomicBoolean

const val PROCESSOR_NAME = "frameCapture"

// JS를 다시 불러와도 프로세스당 한 번만 정리
private val outputCleaned = AtomicBoolean(false)

/** 카메라 프레임을 모듈로 전달하는 클래스 */
class FrameCaptureProcessor : VideoFrameProcessor {
  override fun process(frame: VideoFrame, textureHelper: SurfaceTextureHelper?): VideoFrame {
    ParrotChecker.onFrame(frame)
    VideoBuffer.onFrame(frame)

    // 호출한 쪽이 반환 프레임을 release함
    frame.retain()

    return frame
  }
}

class FrameCaptureModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FrameCapture")

    OnCreate {
      val context = requireNotNull(appContext.reactContext) { "React context is not ready" }
      val outputDir = File(context.cacheDir, "frame-capture").apply { mkdirs() }

      // 이전 실행에서 남은 사진과 가리기 전 영상 삭제
      if (outputCleaned.compareAndSet(false, true)) {
        outputDir.listFiles()?.forEach { it.delete() }
      }

      ParrotChecker.initialize(context.applicationContext, outputDir)
      PersonMasker.initialize(context.applicationContext)
      VideoBuffer.initialize(outputDir)

      ProcessorProvider.addProcessor(PROCESSOR_NAME, VideoFrameProcessorFactoryInterface { FrameCaptureProcessor() })
    }

    OnDestroy {
      VideoBuffer.stop()
    }

    AsyncFunction("checkParrot") { nightCorrectionEnabled: Boolean, nightStartBrightness: Double, mergeMs: Double, quality: Double, personMask: PersonMaskSettings, promise: Promise ->
      ParrotChecker.request(
        nightCorrectionEnabled,
        nightStartBrightness,
        mergeMs.toLong(),
        quality.toInt(),
        personMask,
        promise,
      )
    }

    Function("startVideoBuffer") { width: Double, height: Double, frameRate: Double, bitrate: Double, beforeMs: Double, personMask: PersonMaskSettings ->
      VideoBuffer.start(
        width.toInt(),
        height.toInt(),
        frameRate.toInt(),
        bitrate.toInt(),
        beforeMs.toLong(),
        personMask,
      )
    }

    Function("stopVideoBuffer") {
      VideoBuffer.stop()
    }

    AsyncFunction("saveVideoClip") { afterMs: Double, promise: Promise ->
      VideoBuffer.saveClip(afterMs.toLong(), promise)
    }

    Function("discardVideoClip") {
      VideoBuffer.discardClip()
    }
  }
}
