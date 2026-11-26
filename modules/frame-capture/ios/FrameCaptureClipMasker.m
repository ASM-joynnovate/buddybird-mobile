#import "FrameCaptureClipMasker.h"
#import "FrameCaptureMedia.h"
#import "FrameCapturePersonMasker.h"

#import <AVFoundation/AVFoundation.h>

static const size_t kChangeGridLong = 16;
static const size_t kChangeGridShort = 9;
static const size_t kChangeSamplesPerSide = 160;
static const float kChangeThreshold = 10;

/// 검출 시점의 사람 영역
@interface FrameCapturePersonFrame : NSObject
@property(nonatomic, assign) double timeMs;
@property(nonatomic, copy) NSArray<NSValue *> *boxes;
@end

@implementation FrameCapturePersonFrame
@end

@implementation FrameCaptureClipMasker

/// input 영상의 사람을 가려 output에 저장하는 메서드
+ (NSError *)maskClipAtURL:(NSURL *)input
                     toURL:(NSURL *)output
                  rotation:(NSInteger)rotation
                  settings:(FrameCapturePersonMaskSettings *)settings
                   bitrate:(int32_t)bitrate
                 frameRate:(int32_t)frameRate
               isCancelled:(BOOL (^)(void))isCancelled {
  AVURLAsset *asset = [AVURLAsset URLAssetWithURL:input options:nil];
  NSError *error = nil;
  AVAssetTrack *track = [self videoTrackOfAsset:asset error:&error];

  if (track == nil) {
    return [self errorWithCode:FrameCaptureErrorCodeClipMaskDetect
                         cause:error ?: [self errorWithMessage:@"Video clip has no video track"]];
  }

  NSArray<FrameCapturePersonFrame *> *personFrames = [self detectPeopleInTrack:track
                                                                          asset:asset
                                                                       rotation:rotation
                                                                       settings:settings
                                                                    isCancelled:isCancelled
                                                                          error:&error];

  if (personFrames.count == 0) {
    return [self errorWithCode:FrameCaptureErrorCodeClipMaskDetect
                         cause:error ?: [self errorWithMessage:@"Video clip has no frames"]];
  }

  NSUInteger firstPersonIndex =
      [personFrames indexOfObjectPassingTest:^BOOL(FrameCapturePersonFrame *frame, NSUInteger index, BOOL *stop) {
        return frame.boxes.count > 0;
      }];

  // 사람이 없으면 다시 인코딩하지 않음
  if (firstPersonIndex == NSNotFound) {
    if ([[NSFileManager defaultManager] moveItemAtURL:input toURL:output error:&error]) {
      return nil;
    }

    return [self errorWithCode:FrameCaptureErrorCodeClipMaskWrite
                         cause:error ?: [self errorWithMessage:@"Video clip move failed"]];
  }

  NSError *writeError = [self writeTrack:track
                                   asset:asset
                                   toURL:output
                            personFrames:personFrames
                                rotation:rotation
                                settings:settings
                                 bitrate:bitrate
                               frameRate:frameRate
                             isCancelled:isCancelled];

  return writeError == nil ? nil : [self errorWithCode:FrameCaptureErrorCodeClipMaskWrite cause:writeError];
}

/// 실패한 가림 단계 오류 생성 메서드
+ (NSError *)errorWithCode:(FrameCaptureErrorCode)code cause:(NSError *)cause {
  // 취소는 단계와 관계없이 그대로 반환
  if ([cause.domain isEqualToString:FrameCaptureErrorDomain] && cause.code == FrameCaptureErrorCodeClipCancelled) {
    return cause;
  }

  return FrameCaptureError(code, cause.localizedDescription);
}

/// 영상 트랙을 불러오는 메서드
+ (AVAssetTrack *)videoTrackOfAsset:(AVAsset *)asset error:(NSError **)error {
  __block AVAssetTrack *track = nil;
  __block NSError *loadError = nil;
  dispatch_semaphore_t loadedSemaphore = dispatch_semaphore_create(0);

  [asset loadTracksWithMediaType:AVMediaTypeVideo
               completionHandler:^(NSArray<AVAssetTrack *> *tracks, NSError *tracksError) {
                 track = tracks.firstObject;
                 loadError = tracksError;
                 dispatch_semaphore_signal(loadedSemaphore);
               }];
  dispatch_semaphore_wait(loadedSemaphore, DISPATCH_TIME_FOREVER);

  if (error != NULL) {
    *error = loadError;
  }

  return track;
}

/// 영상 프레임을 차례로 읽어 넘기는 메서드
+ (NSError *)readTrack:(AVAssetTrack *)track
                 asset:(AVAsset *)asset
           isCancelled:(BOOL (^)(void))isCancelled
          frameHandler:(NSError * (^)(CMSampleBufferRef sample))frameHandler {
  NSError *error = nil;
  AVAssetReader *reader = [AVAssetReader assetReaderWithAsset:asset error:&error];

  if (reader == nil) {
    return error ?: [self errorWithMessage:@"Video clip reading failed"];
  }

  NSDictionary *outputSettings =
      @{(id)kCVPixelBufferPixelFormatTypeKey : @(kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange)};
  AVAssetReaderTrackOutput *output = [AVAssetReaderTrackOutput assetReaderTrackOutputWithTrack:track
                                                                                outputSettings:outputSettings];

  [reader addOutput:output];

  if (![reader startReading]) {
    return reader.error ?: [self errorWithMessage:@"Video clip reading failed"];
  }

  CMSampleBufferRef sample = NULL;
  // autoreleasepool 밖에서 오류를 유지
  NSError *frameError = nil;

  while (frameError == nil && (sample = [output copyNextSampleBuffer]) != NULL) {
    if (isCancelled()) {
      frameError = FrameCaptureError(FrameCaptureErrorCodeClipCancelled, @"Video clip masking cancelled");
    } else {
      @autoreleasepool {
        frameError = frameHandler(sample);
      }
    }

    CFRelease(sample);
  }

  if (frameError != nil) {
    [reader cancelReading];

    return frameError;
  }

  if (reader.status != AVAssetReaderStatusCompleted) {
    return reader.error ?: [self errorWithMessage:@"Video clip reading failed"];
  }

  return nil;
}

/// 일정 간격으로 사람을 검출하는 메서드
+ (NSArray<FrameCapturePersonFrame *> *)detectPeopleInTrack:(AVAssetTrack *)track
                                                      asset:(AVAsset *)asset
                                                   rotation:(NSInteger)rotation
                                                   settings:(FrameCapturePersonMaskSettings *)settings
                                                isCancelled:(BOOL (^)(void))isCancelled
                                                      error:(NSError **)error {
  NSMutableArray<FrameCapturePersonFrame *> *personFrames = [NSMutableArray array];
  __block double nextMs = -DBL_MAX;
  __block NSData *detectedBrightness = nil;
  NSError * (^detectFrame)(CMSampleBufferRef) = ^NSError *(CMSampleBufferRef sample) {
    double timeMs = CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(sample)) * 1000;
    CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sample);

    if (pixelBuffer == NULL || timeMs < nextMs) {
      return nil;
    }

    NSData *brightness = [self cellBrightnessOfPixelBuffer:pixelBuffer];
    FrameCapturePersonFrame *lastFrame = personFrames.lastObject;
    FrameCapturePersonFrame *frame = [[FrameCapturePersonFrame alloc] init];

    // 마지막 검출 이후 화면이 그대로면 검출 결과를 재사용
    if (lastFrame != nil && ![self hasBrightness:brightness changedFrom:detectedBrightness]) {
      frame.boxes = lastFrame.boxes;
    } else {
      NSError *detectionError = nil;
      NSArray<NSValue *> *boxes = [self detectPeopleInPixelBuffer:pixelBuffer
                                                         rotation:rotation
                                                   scoreThreshold:settings.scoreThreshold
                                                            error:&detectionError];

      if (boxes == nil) {
        return detectionError ?: [self errorWithMessage:@"Person detection failed"];
      }

      frame.boxes = boxes;
      detectedBrightness = brightness;
    }

    frame.timeMs = timeMs;
    [personFrames addObject:frame];
    nextMs = timeMs + settings.intervalMs;

    return nil;
  };

  NSError *readError = [self readTrack:track asset:asset isCancelled:isCancelled frameHandler:detectFrame];

  if (readError != nil) {
    if (error != NULL) {
      *error = readError;
    }

    return nil;
  }

  return personFrames;
}

/// 칸별 평균 밝기 목록 반환
+ (NSData *)cellBrightnessOfPixelBuffer:(CVPixelBufferRef)pixelBuffer {
  if (CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly) != kCVReturnSuccess) {
    return nil;
  }

  const uint8_t *luma = CVPixelBufferGetBaseAddressOfPlane(pixelBuffer, 0);

  if (luma == NULL) {
    CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

    return nil;
  }

  size_t width = CVPixelBufferGetWidthOfPlane(pixelBuffer, 0);
  size_t height = CVPixelBufferGetHeightOfPlane(pixelBuffer, 0);
  size_t bytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(pixelBuffer, 0);
  BOOL isLandscape = width >= height;
  size_t columns = isLandscape ? kChangeGridLong : kChangeGridShort;
  size_t rows = isLandscape ? kChangeGridShort : kChangeGridLong;
  size_t cellCount = columns * rows;
  size_t stepX = MAX(width / kChangeSamplesPerSide, 1);
  size_t stepY = MAX(height / kChangeSamplesPerSide, 1);
  double *sums = calloc(cellCount, sizeof(double));
  size_t *counts = calloc(cellCount, sizeof(size_t));
  float *cellBrightness = malloc(cellCount * sizeof(float));

  for (size_t y = 0; y < height; y += stepY) {
    size_t rowCell = y * rows / height * columns;

    for (size_t x = 0; x < width; x += stepX) {
      size_t cell = rowCell + x * columns / width;

      sums[cell] += luma[y * bytesPerRow + x];
      counts[cell]++;
    }
  }

  CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

  for (size_t cell = 0; cell < cellCount; cell++) {
    cellBrightness[cell] = FrameCaptureVideoRangeBrightness(sums[cell] / counts[cell]);
  }

  free(sums);
  free(counts);

  return [NSData dataWithBytesNoCopy:cellBrightness length:cellCount * sizeof(float) freeWhenDone:YES];
}

/// 밝기가 바뀐 칸 확인 메서드
+ (BOOL)hasBrightness:(NSData *)brightness changedFrom:(NSData *)previous {
  // 비교할 수 없으면 바뀐 것으로 처리
  if (brightness == nil || previous == nil || brightness.length != previous.length) {
    return YES;
  }

  const float *current = brightness.bytes;
  const float *last = previous.bytes;

  for (size_t cell = 0; cell < brightness.length / sizeof(float); cell++) {
    if (fabsf(current[cell] - last[cell]) >= kChangeThreshold) {
      return YES;
    }
  }

  return NO;
}

/// 프레임 속 사람 영역 목록 반환
+ (NSArray<NSValue *> *)detectPeopleInPixelBuffer:(CVPixelBufferRef)pixelBuffer
                                         rotation:(NSInteger)rotation
                                   scoreThreshold:(float)scoreThreshold
                                            error:(NSError **)error {
  UIImage *frameImage = FrameCaptureUprightImage(pixelBuffer, rotation);

  if (frameImage == nil) {
    if (error != NULL) {
      *error = [self errorWithMessage:@"Video frame conversion failed"];
    }

    return nil;
  }

  NSArray<NSValue *> *uprightBoxes = [FrameCapturePersonMasker detectPeopleInImage:frameImage
                                                                    scoreThreshold:scoreThreshold
                                                                             error:error];

  if (uprightBoxes == nil) {
    return nil;
  }

  CGFloat width = CVPixelBufferGetWidth(pixelBuffer);
  CGFloat height = CVPixelBufferGetHeight(pixelBuffer);
  NSMutableArray<NSValue *> *boxes = [NSMutableArray arrayWithCapacity:uprightBoxes.count];

  for (NSValue *uprightBox in uprightBoxes) {
    CGRect box = [self frameBox:uprightBox.CGRectValue rotation:rotation width:width height:height];

    [boxes addObject:[NSValue valueWithCGRect:box]];
  }

  return boxes;
}

/// 회전 전 프레임 좌표 변환 메서드
+ (CGRect)frameBox:(CGRect)box rotation:(NSInteger)rotation width:(CGFloat)width height:(CGFloat)height {
  CGFloat x = box.origin.x;
  CGFloat y = box.origin.y;
  CGFloat boxWidth = box.size.width;
  CGFloat boxHeight = box.size.height;

  if (rotation == 90) {
    return CGRectMake(y, height - x - boxWidth, boxHeight, boxWidth);
  }

  if (rotation == 180) {
    return CGRectMake(width - x - boxWidth, height - y - boxHeight, boxWidth, boxHeight);
  }

  if (rotation == 270) {
    return CGRectMake(width - y - boxHeight, x, boxHeight, boxWidth);
  }

  return box;
}

/// 앞뒤 검출 결과를 합친 영역 목록 반환
+ (NSArray<NSValue *> *)boxesAtTimeMs:(double)timeMs
                         personFrames:(NSArray<FrameCapturePersonFrame *> *)personFrames
                             settings:(FrameCapturePersonMaskSettings *)settings
                                 size:(CGSize)size {
  NSMutableArray<NSValue *> *boxes = [NSMutableArray array];

  for (FrameCapturePersonFrame *frame in personFrames) {
    if (fabs(frame.timeMs - timeMs) > settings.mergeMs) {
      continue;
    }

    for (NSValue *box in frame.boxes) {
      CGRect expanded = [FrameCapturePersonMasker expandedBox:box.CGRectValue margin:settings.margin size:size];

      [boxes addObject:[NSValue valueWithCGRect:expanded]];
    }
  }

  return boxes;
}

/// 사람 영역을 가린 영상을 쓰는 메서드
+ (NSError *)writeTrack:(AVAssetTrack *)track
                  asset:(AVAsset *)asset
                  toURL:(NSURL *)url
           personFrames:(NSArray<FrameCapturePersonFrame *> *)personFrames
               rotation:(NSInteger)rotation
               settings:(FrameCapturePersonMaskSettings *)settings
                bitrate:(int32_t)bitrate
              frameRate:(int32_t)frameRate
            isCancelled:(BOOL (^)(void))isCancelled {
  __block AVAssetWriter *writer = nil;
  __block AVAssetWriterInputPixelBufferAdaptor *adaptor = nil;
  NSError * (^writeFrame)(CMSampleBufferRef) = ^NSError *(CMSampleBufferRef sample) {
    CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sample);
    CMTime time = CMSampleBufferGetPresentationTimeStamp(sample);

    if (pixelBuffer == NULL) {
      return nil;
    }

    // 첫 프레임 크기로 인코더 생성
    if (writer == nil) {
      CGSize size = CGSizeMake(CVPixelBufferGetWidth(pixelBuffer), CVPixelBufferGetHeight(pixelBuffer));
      AVAssetWriter *startedWriter = nil;
      NSError *writerError = nil;

      adaptor = [self startWritingToURL:url
                                   size:size
                               rotation:rotation
                                bitrate:bitrate
                              frameRate:frameRate
                              startTime:time
                                 writer:&startedWriter
                                  error:&writerError];

      if (adaptor == nil) {
        return writerError ?: [self errorWithMessage:@"Video clip writing failed"];
      }

      writer = startedWriter;
    }

    return [self appendPixelBuffer:pixelBuffer
                              time:time
                           adaptor:adaptor
                            writer:writer
                      personFrames:personFrames
                          settings:settings];
  };

  NSError *error = [self readTrack:track asset:asset isCancelled:isCancelled frameHandler:writeFrame];

  if (error == nil && writer == nil) {
    error = [self errorWithMessage:@"Video clip has no frames"];
  }

  if (error != nil) {
    [writer cancelWriting];

    return error;
  }

  if (!FrameCaptureFinishWriting(writer, adaptor.assetWriterInput)) {
    return writer.error ?: [self errorWithMessage:@"Video clip writing failed"];
  }

  return nil;
}

/// 가린 영상을 쓸 인코더 생성 메서드
+ (AVAssetWriterInputPixelBufferAdaptor *)startWritingToURL:(NSURL *)url
                                                       size:(CGSize)size
                                                   rotation:(NSInteger)rotation
                                                    bitrate:(int32_t)bitrate
                                                  frameRate:(int32_t)frameRate
                                                  startTime:(CMTime)startTime
                                                     writer:(AVAssetWriter **)writer
                                                      error:(NSError **)error {
  AVAssetWriter *startedWriter = [AVAssetWriter assetWriterWithURL:url fileType:AVFileTypeMPEG4 error:error];
  NSDictionary *outputSettings = @{
    AVVideoCodecKey : AVVideoCodecTypeH264,
    AVVideoWidthKey : @(size.width),
    AVVideoHeightKey : @(size.height),
    AVVideoCompressionPropertiesKey : @{
      AVVideoAverageBitRateKey : @(bitrate),
      AVVideoExpectedSourceFrameRateKey : @(frameRate),
      AVVideoMaxKeyFrameIntervalDurationKey : @(FrameCaptureKeyframeIntervalSeconds),
      AVVideoProfileLevelKey : AVVideoProfileLevelH264MainAutoLevel,
    },
  };
  AVAssetWriterInput *input = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo
                                                                 outputSettings:outputSettings];

  input.expectsMediaDataInRealTime = NO;
  // 재생할 때 방향을 바로잡음
  input.transform = CGAffineTransformMakeRotation(rotation * M_PI / 180);

  if (startedWriter == nil || ![startedWriter canAddInput:input]) {
    return nil;
  }

  [startedWriter addInput:input];

  if (![startedWriter startWriting]) {
    if (error != NULL) {
      *error = startedWriter.error;
    }

    return nil;
  }

  [startedWriter startSessionAtSourceTime:startTime];
  *writer = startedWriter;

  return [AVAssetWriterInputPixelBufferAdaptor assetWriterInputPixelBufferAdaptorWithAssetWriterInput:input
                                                                          sourcePixelBufferAttributes:nil];
}

/// 프레임 하나를 가려 인코더에 넣는 메서드
+ (NSError *)appendPixelBuffer:(CVPixelBufferRef)pixelBuffer
                          time:(CMTime)time
                       adaptor:(AVAssetWriterInputPixelBufferAdaptor *)adaptor
                        writer:(AVAssetWriter *)writer
                  personFrames:(NSArray<FrameCapturePersonFrame *> *)personFrames
                      settings:(FrameCapturePersonMaskSettings *)settings {
  CGSize size = CGSizeMake(CVPixelBufferGetWidth(pixelBuffer), CVPixelBufferGetHeight(pixelBuffer));
  NSArray<NSValue *> *boxes = [self boxesAtTimeMs:CMTimeGetSeconds(time) * 1000
                                     personFrames:personFrames
                                         settings:settings
                                             size:size];

  if (![FrameCapturePersonMasker blackOutPixelBuffer:pixelBuffer boxes:boxes]) {
    return [self errorWithMessage:@"Unsupported video frame format"];
  }

  FrameCaptureWaitForInput(writer, adaptor.assetWriterInput);

  if (![adaptor appendPixelBuffer:pixelBuffer withPresentationTime:time]) {
    return writer.error ?: [self errorWithMessage:@"Video clip writing failed"];
  }

  return nil;
}

/// 오류 생성 메서드
+ (NSError *)errorWithMessage:(NSString *)message {
  return FrameCaptureError(FrameCaptureErrorCodeClipMask, message);
}

@end
