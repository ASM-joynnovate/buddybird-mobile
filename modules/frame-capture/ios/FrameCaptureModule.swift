import ExpoModulesCore

let processorName = "frameCapture"

public class FrameCaptureModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FrameCapture")

    OnCreate {
      let directory = (NSTemporaryDirectory() as NSString).appendingPathComponent("frame-capture")

      FrameCaptureState.registerProcessor(withName: processorName, directory: directory)
    }

    Function("configure") { (enabled: Bool, intervalMs: Double, quality: Double) in
      FrameCaptureState.configureEnabled(enabled, intervalMs: intervalMs, quality: quality)
    }

    Function("getLastCapture") { () -> [String: Any]? in
      FrameCaptureState.lastCapture()
    }
  }
}
