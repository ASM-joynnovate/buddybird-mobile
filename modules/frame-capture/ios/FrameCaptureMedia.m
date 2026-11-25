#import "FrameCaptureMedia.h"

#import <CoreImage/CoreImage.h>
#import <MediaPipeTasksVision/MediaPipeTasksVision.h>

static NSString *const kModelExtension = @"tflite";
static const NSTimeInterval kWriterWaitSeconds = 0.005;

const int32_t FrameCaptureKeyframeIntervalSeconds = 2;
const uint8_t FrameCaptureLumaBlack = 16;
const uint8_t FrameCaptureChromaCenter = 128;
const float FrameCaptureLumaRange = 219;
const float FrameCaptureMaxBrightness = 255;

/// 렌더링 context 반환 함수
static CIContext *FrameCaptureImageContext(void) {
  static CIContext *context = nil;
  static dispatch_once_t createOnce;

  dispatch_once(&createOnce, ^{
    // background에서는 GPU 렌더링이 막히므로 CPU로 변환
    context = [CIContext contextWithOptions:@{kCIContextUseSoftwareRenderer : @YES}];
  });

  return context;
}

/// 모듈 오류 생성 함수
NSError *FrameCaptureError(FrameCaptureErrorCode code, NSString *message) {
  return [NSError errorWithDomain:FrameCaptureErrorDomain code:code userInfo:@{NSLocalizedDescriptionKey : message}];
}

/// video range 밝기의 0~255 변환 함수
double FrameCaptureVideoRangeBrightness(double luma) {
  return (luma - FrameCaptureLumaBlack) * FrameCaptureMaxBrightness / FrameCaptureLumaRange;
}

/// 방향을 바로잡은 이미지 생성 함수
UIImage *FrameCaptureUprightImage(CVPixelBufferRef pixelBuffer, NSInteger rotation) {
  CGImagePropertyOrientation orientation = kCGImagePropertyOrientationUp;

  if (rotation == 90) {
    orientation = kCGImagePropertyOrientationRight;
  } else if (rotation == 180) {
    orientation = kCGImagePropertyOrientationDown;
  } else if (rotation == 270) {
    orientation = kCGImagePropertyOrientationLeft;
  }

  CIImage *image = [[CIImage imageWithCVPixelBuffer:pixelBuffer] imageByApplyingCGOrientation:orientation];
  CGImageRef renderedImage = [FrameCaptureImageContext() createCGImage:image fromRect:image.extent];

  if (renderedImage == NULL) {
    return nil;
  }

  UIImage *uprightImage = [UIImage imageWithCGImage:renderedImage];

  CGImageRelease(renderedImage);

  return uprightImage;
}

/// 검출 모델 생성 함수
MPPObjectDetector *FrameCaptureCreateDetector(NSString *modelName,
                                              NSString *category,
                                              float scoreThreshold,
                                              NSInteger maxResults,
                                              FrameCaptureErrorCode errorCode,
                                              NSError **error) {
  NSString *modelPath = [[NSBundle bundleForClass:[FrameCaptureCamera class]] pathForResource:modelName
                                                                                     ofType:kModelExtension]
                            ?: [[NSBundle mainBundle] pathForResource:modelName ofType:kModelExtension];

  if (modelPath == nil) {
    if (error != NULL) {
      *error = FrameCaptureError(errorCode, [NSString stringWithFormat:@"Detection model %@ is missing", modelName]);
    }

    return nil;
  }

  MPPObjectDetectorOptions *options = [[MPPObjectDetectorOptions alloc] init];

  options.baseOptions.modelAssetPath = modelPath;
  options.runningMode = MPPRunningModeImage;
  options.categoryAllowlist = @[ category ];
  options.scoreThreshold = scoreThreshold;
  options.maxResults = maxResults;

  return [[MPPObjectDetector alloc] initWithOptions:options error:error];
}

/// 인코더 입력 대기 함수
void FrameCaptureWaitForInput(AVAssetWriter *writer, AVAssetWriterInput *input) {
  while (!input.isReadyForMoreMediaData && writer.status == AVAssetWriterStatusWriting) {
    [NSThread sleepForTimeInterval:kWriterWaitSeconds];
  }
}

/// 파일 쓰기 완료 함수
BOOL FrameCaptureFinishWriting(AVAssetWriter *writer, AVAssetWriterInput *input) {
  [input markAsFinished];

  dispatch_semaphore_t finishedSemaphore = dispatch_semaphore_create(0);

  [writer finishWritingWithCompletionHandler:^{
    dispatch_semaphore_signal(finishedSemaphore);
  }];
  dispatch_semaphore_wait(finishedSemaphore, DISPATCH_TIME_FOREVER);

  return writer.status == AVAssetWriterStatusCompleted;
}
