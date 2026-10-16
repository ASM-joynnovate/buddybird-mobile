#import "FrameCaptureState.h"

#import "FrameCaptureParrotChecker.h"
#import "FrameCaptureVideoBuffer.h"

#import <AVFoundation/AVFoundation.h>
#import <WebRTC/RTCCVPixelBuffer.h>
#import <WebRTC/RTCCameraVideoCapturer.h>
#import <WebRTC/RTCVideoFrame.h>
#import <WebRTC/RTCVideoFrameBuffer.h>
#import <react-native-webrtc/ProcessorProvider.h>
#import <react-native-webrtc/VideoFrameProcessor.h>

static __weak RTCCameraVideoCapturer *sCapturer = nil;

/// 카메라 프레임을 모듈로 전달하는 클래스
@interface FrameCaptureProcessor : NSObject <VideoFrameProcessorDelegate>
@end

@implementation FrameCaptureProcessor

- (RTCVideoFrame *)capturer:(RTCVideoCapturer *)capturer didCaptureVideoFrame:(RTCVideoFrame *)frame {
  if ([capturer isKindOfClass:[RTCCameraVideoCapturer class]]) {
    sCapturer = (RTCCameraVideoCapturer *)capturer;
  }

  // iOS 카메라 프레임은 CVPixelBuffer
  if ([frame.buffer isKindOfClass:[RTCCVPixelBuffer class]]) {
    CVPixelBufferRef pixelBuffer = ((RTCCVPixelBuffer *)frame.buffer).pixelBuffer;

    [FrameCaptureParrotChecker handlePixelBuffer:pixelBuffer rotation:frame.rotation];
    [FrameCaptureVideoBuffer handlePixelBuffer:pixelBuffer rotation:frame.rotation timeNs:frame.timeStampNs];
  }

  return frame;
}

@end

@implementation FrameCaptureState

+ (void)registerProcessorWithName:(NSString *)name directory:(NSString *)directory {
  [[NSFileManager defaultManager] createDirectoryAtPath:directory
                            withIntermediateDirectories:YES
                                             attributes:nil
                                                  error:nil];

  [FrameCaptureParrotChecker setDirectory:directory];
  [FrameCaptureVideoBuffer setDirectory:directory];

  [ProcessorProvider addProcessor:[[FrameCaptureProcessor alloc] init] forName:name];
}

+ (void)setLowLight:(BOOL)enabled frameRate:(double)frameRate {
  RTCCameraVideoCapturer *capturer = sCapturer;
  AVCaptureInput *input = capturer.captureSession.inputs.firstObject;

  if (![input isKindOfClass:[AVCaptureDeviceInput class]]) {
    return;
  }

  AVCaptureDevice *device = ((AVCaptureDeviceInput *)input).device;

  if (![device lockForConfiguration:nil]) {
    return;
  }

  @try {
    if (device.isLowLightBoostSupported) {
      device.automaticallyEnablesLowLightBoostWhenAvailable = enabled;
    }

    if (enabled) {
      CMTime shortest = device.activeVideoMinFrameDuration;
      CMTime longest = shortest;

      for (AVFrameRateRange *range in device.activeFormat.videoSupportedFrameRateRanges) {
        longest = CMTimeMaximum(longest, range.maxFrameDuration);
      }

      // 지원 범위 안에서 프레임 시간을 늘림
      CMTime frameDuration = CMTimeMaximum(shortest, CMTimeMinimum(CMTimeMake(1, (int32_t)frameRate), longest));

      device.activeVideoMaxFrameDuration = frameDuration;
      device.activeMaxExposureDuration = CMTimeMinimum(frameDuration, device.activeFormat.maxExposureDuration);
    } else {
      device.activeVideoMaxFrameDuration = kCMTimeInvalid;
      device.activeMaxExposureDuration = kCMTimeInvalid;
    }
  } @catch (NSException *exception) {
    NSLog(@"[FrameCapture] Low light setup failed: %@", exception.reason);
  } @finally {
    [device unlockForConfiguration];
  }
}

@end
