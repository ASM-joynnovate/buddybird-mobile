#import "FrameCapturePersonMasker.h"
#import "FrameCaptureMedia.h"

#import <MediaPipeTasksVision/MediaPipeTasksVision.h>

static NSString *const kPersonModelName = @"deim_n_person";
static NSString *const kPersonCategory = @"person";
static const NSInteger kUnlimitedResults = -1;

// @synchronized(FrameCapturePersonMasker) 안에서만 사용
static MPPObjectDetector *sDetector = nil;
static float sDetectorScoreThreshold = 0;

@implementation FrameCapturePersonMaskSettings

- (instancetype)initWithScoreThreshold:(double)scoreThreshold
                                margin:(double)margin
                            intervalMs:(double)intervalMs
                               mergeMs:(double)mergeMs {
  self = [super init];

  if (self) {
    _scoreThreshold = (float)scoreThreshold;
    _margin = margin;
    _intervalMs = intervalMs;
    _mergeMs = mergeMs;
  }

  return self;
}

@end

@implementation FrameCapturePersonMasker

/// 사진 속 사람 영역 목록 반환
+ (NSArray<NSValue *> *)detectPeopleInImage:(UIImage *)image
                              scoreThreshold:(float)scoreThreshold
                                       error:(NSError **)error {
  @synchronized(self) {
    MPPObjectDetector *detector = [self loadDetectorWithScoreThreshold:scoreThreshold error:error];
    MPPImage *detectorImage = detector == nil ? nil : [[MPPImage alloc] initWithUIImage:image error:error];
    MPPObjectDetectorResult *result = detectorImage == nil ? nil : [detector detectImage:detectorImage error:error];

    if (result == nil) {
      return nil;
    }

    NSMutableArray<NSValue *> *boxes = [NSMutableArray arrayWithCapacity:result.detections.count];

    for (MPPDetection *detection in result.detections) {
      [boxes addObject:[NSValue valueWithCGRect:detection.boundingBox]];
    }

    return boxes;
  }
}

/// 사람 영역을 검정으로 칠한 사진 반환
+ (UIImage *)maskedImage:(UIImage *)image boxes:(NSArray<NSValue *> *)boxes margin:(CGFloat)margin {
  if (boxes.count == 0) {
    return image;
  }

  UIGraphicsImageRendererFormat *format = [UIGraphicsImageRendererFormat preferredFormat];

  format.scale = image.scale;
  format.opaque = YES;

  UIGraphicsImageRenderer *renderer = [[UIGraphicsImageRenderer alloc] initWithSize:image.size format:format];

  return [renderer imageWithActions:^(UIGraphicsImageRendererContext *context) {
    [image drawAtPoint:CGPointZero];
    [[UIColor blackColor] setFill];

    for (NSValue *box in boxes) {
      UIRectFill([self expandedBox:box.CGRectValue margin:margin size:image.size]);
    }
  }];
}

/// 사방으로 margin 비율만큼 넓힌 영역 반환
+ (CGRect)expandedBox:(CGRect)box margin:(CGFloat)margin size:(CGSize)size {
  CGRect expanded = CGRectInset(box, -box.size.width * margin, -box.size.height * margin);

  return CGRectIntersection(expanded, CGRectMake(0, 0, size.width, size.height));
}

/// NV12 프레임의 사람 영역을 검정으로 칠하는 메서드
+ (BOOL)blackOutPixelBuffer:(CVPixelBufferRef)pixelBuffer boxes:(NSArray<NSValue *> *)boxes {
  if (CVPixelBufferGetPixelFormatType(pixelBuffer) != kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange) {
    return NO;
  }

  if (boxes.count == 0) {
    return YES;
  }

  CGRect bounds = CGRectMake(0, 0, CVPixelBufferGetWidth(pixelBuffer), CVPixelBufferGetHeight(pixelBuffer));

  CVPixelBufferLockBaseAddress(pixelBuffer, 0);

  uint8_t *luma = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 0);
  size_t lumaStride = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 0);
  // CbCr interleaved 평면
  uint8_t *chroma = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 1);
  size_t chromaStride = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 1);
  size_t chromaHeight = CVPixelBufferGetHeightOfPlane(pixelBuffer, 1);

  for (NSValue *box in boxes) {
    CGRect area = CGRectIntegral(CGRectIntersection(box.CGRectValue, bounds));

    if (CGRectIsEmpty(area)) {
      continue;
    }

    size_t left = (size_t)CGRectGetMinX(area);
    size_t top = (size_t)CGRectGetMinY(area);
    size_t right = (size_t)CGRectGetMaxX(area);
    size_t bottom = (size_t)CGRectGetMaxY(area);

    for (size_t y = top; y < bottom; y++) {
      memset(luma + y * lumaStride + left, FrameCaptureLumaBlack, right - left);
    }

    size_t chromaLeft = left / 2 * 2;
    size_t chromaRight = (right + 1) / 2 * 2;

    for (size_t y = top / 2; y < MIN((bottom + 1) / 2, chromaHeight); y++) {
      memset(chroma + y * chromaStride + chromaLeft, FrameCaptureChromaCenter, chromaRight - chromaLeft);
    }
  }

  CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);

  return YES;
}

/// 검출 모델 생성 메서드
+ (MPPObjectDetector *)loadDetectorWithScoreThreshold:(float)scoreThreshold error:(NSError **)error {
  // 기준 점수가 같으면 재사용
  if (sDetector != nil && sDetectorScoreThreshold == scoreThreshold) {
    return sDetector;
  }

  sDetector = FrameCaptureCreateDetector(kPersonModelName,
                                         kPersonCategory,
                                         scoreThreshold,
                                         kUnlimitedResults,
                                         FrameCaptureErrorCodePersonMask,
                                         error);
  sDetectorScoreThreshold = scoreThreshold;

  return sDetector;
}

@end
