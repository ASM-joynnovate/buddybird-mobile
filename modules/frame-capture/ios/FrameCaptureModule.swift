import ExpoModulesCore

let processorName = "frameCapture"

public class FrameCaptureModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FrameCapture")

    OnCreate {
      let directory = (NSTemporaryDirectory() as NSString).appendingPathComponent("frame-capture")

      FrameCaptureState.registerProcessor(name: processorName, directory: directory)
    }

    OnDestroy {
      FrameCaptureVideoBuffer.stop()
    }

    AsyncFunction("checkParrot") { (nightCorrectionEnabled: Bool, nightStartBrightness: Double, mergeMs: Double, quality: Double, promise: Promise) in
      FrameCaptureParrotChecker.check(
        nightCorrectionEnabled: nightCorrectionEnabled,
        nightStartBrightness: nightStartBrightness,
        mergeMs: mergeMs,
        quality: quality
      ) { result, error in
        if let error {
          promise.reject(error)
        } else {
          promise.resolve(result as Any?)
        }
      }
    }

    Function("setLowLight") { (enabled: Bool, frameRate: Double) in
      FrameCaptureState.setLowLight(enabled, frameRate: frameRate)
    }

    Function("startVideoBuffer") { (width: Double, height: Double, frameRate: Double, bitrate: Double, beforeMs: Double) in
      FrameCaptureVideoBuffer.start(width: width, height: height, frameRate: frameRate, bitrate: bitrate, beforeMs: beforeMs)
    }

    Function("stopVideoBuffer") {
      FrameCaptureVideoBuffer.stop()
    }

    AsyncFunction("saveVideoClip") { (afterMs: Double, promise: Promise) in
      FrameCaptureVideoBuffer.saveClip(afterMs: afterMs) { uri, error in
        if let error {
          promise.reject(error)
        } else {
          promise.resolve(uri as Any?)
        }
      }
    }

    Function("discardVideoClip") {
      FrameCaptureVideoBuffer.discardClip()
    }
  }
}
