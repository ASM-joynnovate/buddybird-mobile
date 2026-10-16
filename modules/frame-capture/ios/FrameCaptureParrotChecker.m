#import "FrameCaptureParrotChecker.h"

#import <CoreImage/CoreImage.h>
#import <MediaPipeTasksVision/MediaPipeTasksVision.h>
#import <UIKit/UIKit.h>
#import <stdatomic.h>

static NSString *const kErrorDomain = @"FrameCapture";
static NSString *const kModelName = @"efficientdet_lite2";
static NSString *const kModelExtension = @"tflite";
static NSString *const kBirdCategory = @"bird";
static const double kFrameWaitMs = 5000;
static const float kLumaBlack = 16;
static const float kLumaRange = 219;
static const float kChromaCenter = 128;
static const float kMaxBrightness = 255;

/// 진행 중인 앵무새 확인 한 번
@interface FrameCaptureParrotCheck : NSObject
@property(nonatomic, assign) BOOL nightCorrectionEnabled;
@property(nonatomic, assign) double nightStartBrightness;
@property(nonatomic, assign) double mergeMs;
@property(nonatomic, assign) double quality;
@property(nonatomic, copy) void (^completion)(NSDictionary<NSString *, id> *, NSError *);
@property(nonatomic, assign) size_t width;
@property(nonatomic, assign) size_t height;
@property(nonatomic, assign) size_t chromaWidth;
@property(nonatomic, assign) size_t chromaHeight;
@property(nonatomic, assign) OSType pixelFormat;
@property(nonatomic, assign) NSInteger rotation;
@property(nonatomic, assign) NSUInteger frameCount;
@property(nonatomic, assign) double firstFrameAt;
@property(nonatomic, assign) BOOL framesMerging;
@property(nonatomic, assign) uint32_t *lumaSum;
@property(nonatomic, assign) uint32_t *chromaSum;
@property(nonatomic, strong) NSDictionary *attachments;
@end

@implementation FrameCaptureParrotCheck

- (void)dealloc {
  free(_lumaSum);
  free(_chromaSum);
}

- (BOOL)fullRange {
  return self.pixelFormat == kCVPixelFormatType_420YpCbCr8BiPlanarFullRange;
}

/// 프레임 한 장을 누적하는 메서드
- (void)addPixelBuffer:(CVPixelBufferRef)pixelBuffer {
  CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

  const uint8_t *luma = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 0);
  size_t lumaStride = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 0);

  for (size_t y = 0; y < self.height; y++) {
    const uint8_t *row = luma + y * lumaStride;
    uint32_t *sum = self.lumaSum + y * self.width;

    for (size_t x = 0; x < self.width; x++) {
      sum[x] += row[x];
    }
  }

  // CbCr interleaved 평면
  const uint8_t *chroma = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 1);
  size_t chromaStride = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 1);

  for (size_t y = 0; y < self.chromaHeight; y++) {
    const uint8_t *row = chroma + y * chromaStride;
    uint32_t *sum = self.chromaSum + y * self.chromaWidth * 2;

    for (size_t x = 0; x < self.chromaWidth * 2; x++) {
      sum[x] += row[x];
    }
  }

  CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

  self.frameCount += 1;
}

/// 합친 프레임의 평균 밝기를 0~255로 반환하는 메서드
- (double)brightness {
  uint64_t total = 0;
  size_t count = self.width * self.height;

  for (size_t i = 0; i < count; i++) {
    total += self.lumaSum[i];
  }

  double mean = (double)total / count / self.frameCount;
  double brightness = self.fullRange ? mean : (mean - kLumaBlack) * kMaxBrightness / kLumaRange;

  return MIN(MAX(brightness, 0), kMaxBrightness);
}

/// 합친 프레임으로 밝은 CVPixelBuffer를 만드는 메서드
- (CVPixelBufferRef)createPixelBufferWithGain:(float)gain {
  CVPixelBufferRef output = NULL;
  NSDictionary *attributes = @{(id)kCVPixelBufferIOSurfacePropertiesKey : @{}};
  CVReturn created = CVPixelBufferCreate(kCFAllocatorDefault, self.width, self.height, self.pixelFormat,
                                         (__bridge CFDictionaryRef)attributes, &output);

  if (created != kCVReturnSuccess) {
    return NULL;
  }

  // 색 정보를 원본 프레임과 같게 설정
  if (self.attachments != nil) {
    CVBufferSetAttachments(output, (__bridge CFDictionaryRef)self.attachments, kCVAttachmentMode_ShouldPropagate);
  }

  CVPixelBufferLockBaseAddress(output, 0);

  float scale = gain / self.frameCount;
  float lumaOffset = (self.fullRange ? 0 : kLumaBlack) * (1 - gain);
  float chromaOffset = kChromaCenter * (1 - gain);

  uint8_t *luma = CVPixelBufferGetBaseAddressOfPlane(output, 0);
  size_t lumaStride = CVPixelBufferGetBytesPerRowOfPlane(output, 0);

  for (size_t y = 0; y < self.height; y++) {
    uint8_t *row = luma + y * lumaStride;
    const uint32_t *sum = self.lumaSum + y * self.width;

    for (size_t x = 0; x < self.width; x++) {
      row[x] = (uint8_t)MIN(MAX(sum[x] * scale + lumaOffset, 0), kMaxBrightness);
    }
  }

  uint8_t *chroma = CVPixelBufferGetBaseAddressOfPlane(output, 1);
  size_t chromaStride = CVPixelBufferGetBytesPerRowOfPlane(output, 1);

  for (size_t y = 0; y < self.chromaHeight; y++) {
    uint8_t *row = chroma + y * chromaStride;
    const uint32_t *sum = self.chromaSum + y * self.chromaWidth * 2;

    for (size_t x = 0; x < self.chromaWidth * 2; x++) {
      row[x] = (uint8_t)MIN(MAX(sum[x] * scale + chromaOffset, 0), kMaxBrightness);
    }
  }

  CVPixelBufferUnlockBaseAddress(output, 0);

  return output;
}

@end

static dispatch_queue_t sQueue = nil;
static NSString *sDirectory = nil;
static CIContext *sContext = nil;
static MPPObjectDetector *sDetector = nil;
static FrameCaptureParrotCheck *sCheck = nil;
static atomic_bool sChecking = false;
static atomic_bool sFrameBusy = false;

@implementation FrameCaptureParrotChecker

+ (void)initialize {
  if (self == [FrameCaptureParrotChecker class]) {
    sQueue = dispatch_queue_create("frame-capture.parrot", DISPATCH_QUEUE_SERIAL);
    sContext = [CIContext contextWithOptions:nil];
  }
}

+ (void)setDirectory:(NSString *)directory {
  sDirectory = [directory copy];
}

+ (void)checkWithNightCorrectionEnabled:(BOOL)nightCorrectionEnabled
            nightStartBrightness:(double)nightStartBrightness
                         mergeMs:(double)mergeMs
                         quality:(double)quality
                      completion:(void (^)(NSDictionary<NSString *, id> *, NSError *))completion {
  dispatch_async(sQueue, ^{
    if (sCheck != nil) {
      sCheck.completion(nil, nil);
    }

    FrameCaptureParrotCheck *check = [[FrameCaptureParrotCheck alloc] init];

    check.nightCorrectionEnabled = nightCorrectionEnabled;
    check.nightStartBrightness = nightStartBrightness;
    check.mergeMs = mergeMs;
    check.quality = quality;
    check.completion = completion;

    sCheck = check;
    atomic_store(&sChecking, true);

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)((mergeMs + kFrameWaitMs) * NSEC_PER_MSEC)), sQueue, ^{
      [self finishLate:check];
    });
  });
}

+ (void)handlePixelBuffer:(CVPixelBufferRef)pixelBuffer rotation:(NSInteger)rotation {
  bool idle = false;

  if (!atomic_load(&sChecking) || !atomic_compare_exchange_strong(&sFrameBusy, &idle, true)) {
    return;
  }

  CVPixelBufferRetain(pixelBuffer);

  // 합치기 및 검출은 sQueue에서 실행
  dispatch_async(sQueue, ^{
    [self addPixelBuffer:pixelBuffer rotation:rotation];

    CVPixelBufferRelease(pixelBuffer);
    atomic_store(&sFrameBusy, false);
  });
}

+ (void)addPixelBuffer:(CVPixelBufferRef)pixelBuffer rotation:(NSInteger)rotation {
  FrameCaptureParrotCheck *check = sCheck;

  if (check == nil) {
    return;
  }

  OSType pixelFormat = CVPixelBufferGetPixelFormatType(pixelBuffer);
  size_t width = CVPixelBufferGetWidth(pixelBuffer);
  size_t height = CVPixelBufferGetHeight(pixelBuffer);
  double now = [NSDate date].timeIntervalSince1970 * 1000;

  if (pixelFormat != kCVPixelFormatType_420YpCbCr8BiPlanarFullRange &&
      pixelFormat != kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange) {
    [self finish:check error:[self errorWithMessage:@"Unsupported camera pixel format"]];

    return;
  }

  if (check.frameCount == 0) {
    check.pixelFormat = pixelFormat;
    check.width = width;
    check.height = height;
    check.chromaWidth = CVPixelBufferGetWidthOfPlane(pixelBuffer, 1);
    check.chromaHeight = CVPixelBufferGetHeightOfPlane(pixelBuffer, 1);
    check.lumaSum = calloc(width * height, sizeof(uint32_t));
    check.chromaSum = calloc(check.chromaWidth * check.chromaHeight * 2, sizeof(uint32_t));
    check.attachments = CFBridgingRelease(CVBufferCopyAttachments(pixelBuffer, kCVAttachmentMode_ShouldPropagate));
    check.firstFrameAt = now;
  } else if (pixelFormat != check.pixelFormat || width != check.width || height != check.height) {
    return;
  }

  check.rotation = rotation;
  [check addPixelBuffer:pixelBuffer];

  if (check.frameCount == 1) {
    check.framesMerging = check.nightCorrectionEnabled && [check brightness] < check.nightStartBrightness;
  }

  if (!check.framesMerging || now - check.firstFrameAt >= check.mergeMs) {
    [self finish:check error:nil];
  }
}

/// 시간이 초과된 확인을 종료하는 메서드
+ (void)finishLate:(FrameCaptureParrotCheck *)check {
  if (sCheck != check) {
    return;
  }

  if (check.frameCount == 0) {
    sCheck = nil;
    atomic_store(&sChecking, false);

    check.completion(nil, nil);

    return;
  }

  [self finish:check error:nil];
}

+ (void)finish:(FrameCaptureParrotCheck *)check error:(NSError *)failure {
  sCheck = nil;
  atomic_store(&sChecking, false);

  if (failure != nil) {
    check.completion(nil, failure);

    return;
  }

  double brightness = [check brightness];
  float gain = check.framesMerging ? (float)MAX(1.0, check.nightStartBrightness / MAX(brightness, 1.0)) : 1;
  UIImage *photo = [self uprightPhotoFromCheck:check gain:gain];

  if (photo == nil) {
    check.completion(nil, [self errorWithMessage:@"Photo conversion failed"]);

    return;
  }

  NSError *error = nil;
  CFAbsoluteTime startedAt = CFAbsoluteTimeGetCurrent();
  MPPDetection *detection = [self birdDetectionInPhoto:photo error:&error];
  double inferenceMs = (CFAbsoluteTimeGetCurrent() - startedAt) * 1000;

  if (error != nil) {
    check.completion(nil, error);

    return;
  }

  // 사진 기준 0~1 비율
  CGRect box = detection.boundingBox;
  id birdBox = detection == nil ? [NSNull null] : @{
    @"x" : @(box.origin.x / photo.size.width),
    @"y" : @(box.origin.y / photo.size.height),
    @"width" : @(box.size.width / photo.size.width),
    @"height" : @(box.size.height / photo.size.height),
  };

  NSString *fileName = [NSString stringWithFormat:@"photo-%lld.jpg", (long long)check.firstFrameAt];
  NSString *path = [sDirectory stringByAppendingPathComponent:fileName];
  NSData *jpeg = UIImageJPEGRepresentation(photo, check.quality / 100.0);

  if (![jpeg writeToFile:path options:NSDataWritingAtomic error:&error]) {
    check.completion(nil, error);

    return;
  }

  check.completion(
      @{
        @"uri" : [NSURL fileURLWithPath:path].absoluteString,
        @"capturedAt" : @(check.firstFrameAt),
        @"birdScore" : @([self birdScoreOfDetection:detection]),
        @"birdBox" : birdBox,
        @"photoWidth" : @(photo.size.width),
        @"photoHeight" : @(photo.size.height),
        @"brightness" : @(brightness),
        @"nightCorrected" : @(check.framesMerging),
        @"inferenceMs" : @(inferenceMs),
      },
      nil);
}

/// 합친 프레임으로 방향을 바로잡은 사진을 만드는 메서드
+ (UIImage *)uprightPhotoFromCheck:(FrameCaptureParrotCheck *)check gain:(float)gain {
  CVPixelBufferRef pixelBuffer = [check createPixelBufferWithGain:gain];

  if (pixelBuffer == NULL) {
    return nil;
  }

  CGImagePropertyOrientation orientation = kCGImagePropertyOrientationUp;

  if (check.rotation == 90) {
    orientation = kCGImagePropertyOrientationRight;
  } else if (check.rotation == 180) {
    orientation = kCGImagePropertyOrientationDown;
  } else if (check.rotation == 270) {
    orientation = kCGImagePropertyOrientationLeft;
  }

  CIImage *image = [[CIImage imageWithCVPixelBuffer:pixelBuffer] imageByApplyingCGOrientation:orientation];
  CGImageRef rendered = [sContext createCGImage:image fromRect:image.extent];

  CVPixelBufferRelease(pixelBuffer);

  if (rendered == NULL) {
    return nil;
  }

  UIImage *photo = [UIImage imageWithCGImage:rendered];

  CGImageRelease(rendered);

  return photo;
}

/// 검출 결과의 bird 점수를 반환하는 메서드
+ (float)birdScoreOfDetection:(MPPDetection *)detection {
  float birdScore = 0;

  for (MPPCategory *category in detection.categories) {
    birdScore = MAX(birdScore, category.score);
  }

  return birdScore;
}

/// 사진에서 bird 점수가 가장 높은 검출 결과를 반환하는 메서드
+ (MPPDetection *)birdDetectionInPhoto:(UIImage *)photo error:(NSError **)error {
  MPPObjectDetector *detector = [self loadDetector:error];
  MPPImage *image = detector == nil ? nil : [[MPPImage alloc] initWithUIImage:photo error:error];
  MPPObjectDetectorResult *result = image == nil ? nil : [detector detectImage:image error:error];
  MPPDetection *birdDetection = nil;

  for (MPPDetection *detection in result.detections) {
    if (birdDetection == nil || [self birdScoreOfDetection:detection] > [self birdScoreOfDetection:birdDetection]) {
      birdDetection = detection;
    }
  }

  return birdDetection;
}

+ (MPPObjectDetector *)loadDetector:(NSError **)error {
  if (sDetector != nil) {
    return sDetector;
  }

  NSString *modelPath = [[NSBundle bundleForClass:self] pathForResource:kModelName ofType:kModelExtension]
                            ?: [[NSBundle mainBundle] pathForResource:kModelName ofType:kModelExtension];

  if (modelPath == nil) {
    *error = [self errorWithMessage:@"Detection model is missing"];

    return nil;
  }

  MPPObjectDetectorOptions *options = [[MPPObjectDetectorOptions alloc] init];

  options.baseOptions.modelAssetPath = modelPath;
  options.runningMode = MPPRunningModeImage;
  options.categoryAllowlist = @[ kBirdCategory ];
  // 기준 점수는 JS에서 비교
  options.scoreThreshold = 0;
  options.maxResults = 1;

  sDetector = [[MPPObjectDetector alloc] initWithOptions:options error:error];

  return sDetector;
}

+ (NSError *)errorWithMessage:(NSString *)message {
  return [NSError errorWithDomain:kErrorDomain code:1 userInfo:@{NSLocalizedDescriptionKey : message}];
}

@end
