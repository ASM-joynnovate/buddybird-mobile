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

const val PROCESSOR_NAME = "frameCapture"

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

      ParrotChecker.initialize(context.applicationContext, outputDir)
      VideoBuffer.initialize(outputDir)

      ProcessorProvider.addProcessor(PROCESSOR_NAME, VideoFrameProcessorFactoryInterface { FrameCaptureProcessor() })
    }

    OnDestroy {
      VideoBuffer.stop()
    }

    AsyncFunction("checkParrot") { nightCorrectionEnabled: Boolean, nightStartBrightness: Double, mergeMs: Double, quality: Double, promise: Promise ->
      ParrotChecker.request(nightCorrectionEnabled, nightStartBrightness, mergeMs.toLong(), quality.toInt(), promise)
    }

    Function("startVideoBuffer") { width: Double, height: Double, frameRate: Double, bitrate: Double, beforeMs: Double ->
      VideoBuffer.start(width.toInt(), height.toInt(), frameRate.toInt(), bitrate.toInt(), beforeMs.toLong())
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
