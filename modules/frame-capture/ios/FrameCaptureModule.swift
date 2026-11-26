import ExpoModulesCore

let processorName = "frameCapture"

/// 오류 코드를 붙여 reject하는 함수
func rejectWithErrorCode(_ promise: Promise, _ error: Error, defaultCode: String) {
  let nsError = error as NSError
  let errorCode = nsError.domain == FrameCaptureErrorDomain ? FrameCaptureErrorCode(rawValue: nsError.code) : nil

  switch errorCode {
  case .personMask:
    promise.reject("ERR_PERSON_MASK", nsError.localizedDescription)
  case .clipMaskDetect:
    promise.reject("ERR_CLIP_MASK_DETECT", nsError.localizedDescription)
  case .clipMaskWrite:
    promise.reject("ERR_CLIP_MASK_WRITE", nsError.localizedDescription)
  default:
    // Android와 같은 코드로 보고
    promise.reject(defaultCode, nsError.localizedDescription)
  }
}

/// JS에서 받는 사람 가림 설정
struct PersonMaskSettings: Record {
  @Field(.required) var scoreThreshold: Double
  @Field(.required) var margin: Double
  @Field(.required) var intervalMs: Double
  @Field(.required) var mergeMs: Double

  /// Objective-C 설정 객체
  var settings: FrameCapturePersonMaskSettings {
    FrameCapturePersonMaskSettings(
      scoreThreshold: scoreThreshold,
      margin: margin,
      intervalMs: intervalMs,
      mergeMs: mergeMs
    )
  }
}

public class FrameCaptureModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FrameCapture")

    OnCreate {
      let directory = (NSTemporaryDirectory() as NSString).appendingPathComponent("frame-capture")

      // 이전 실행에서 남은 사진과 가리기 전 영상 삭제
      FrameCaptureCamera.removeLeftoverFiles(directory: directory)
      FrameCaptureCamera.registerProcessor(name: processorName, directory: directory)
    }

    OnDestroy {
      FrameCaptureVideoBuffer.stop()
    }

    AsyncFunction("checkParrot") { (nightCorrectionEnabled: Bool, nightStartBrightness: Double, mergeMs: Double, quality: Double, personMask: PersonMaskSettings, promise: Promise) in
      FrameCaptureParrotChecker.check(
        nightCorrectionEnabled: nightCorrectionEnabled,
        nightStartBrightness: nightStartBrightness,
        mergeMs: mergeMs,
        quality: quality,
        personMask: personMask.settings
      ) { result, error in
        if let error {
          rejectWithErrorCode(promise, error, defaultCode: "ERR_PARROT_CHECK")
        } else {
          promise.resolve(result as Any?)
        }
      }
    }

    Function("setLowLight") { (enabled: Bool, frameRate: Double) in
      FrameCaptureCamera.setLowLight(enabled, frameRate: frameRate)
    }

    Function("startVideoBuffer") { (width: Double, height: Double, frameRate: Double, bitrate: Double, beforeMs: Double, personMask: PersonMaskSettings) in
      FrameCaptureVideoBuffer.start(
        width: width,
        height: height,
        frameRate: frameRate,
        bitrate: bitrate,
        beforeMs: beforeMs,
        personMask: personMask.settings
      )
    }

    Function("stopVideoBuffer") {
      FrameCaptureVideoBuffer.stop()
    }

    AsyncFunction("saveVideoClip") { (afterMs: Double, promise: Promise) in
      FrameCaptureVideoBuffer.saveClip(afterMs: afterMs) { uri, error in
        if let error {
          rejectWithErrorCode(promise, error, defaultCode: "ERR_VIDEO_CLIP")
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
