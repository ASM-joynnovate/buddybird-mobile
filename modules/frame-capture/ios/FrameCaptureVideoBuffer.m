#import "FrameCaptureVideoBuffer.h"

#import <AVFoundation/AVFoundation.h>
#import <VideoToolbox/VideoToolbox.h>
#import <stdatomic.h>

static const int32_t kKeyframeIntervalSeconds = 2;
static const int kMaxPendingFrames = 2;
static const NSTimeInterval kWriterWaitSeconds = 0.005;

static dispatch_queue_t sQueue = nil;
static dispatch_queue_t sWriterQueue = nil;
static NSString *sDirectory = nil;
static atomic_bool sRunning = false;
static atomic_int sPendingFrames = 0;
static atomic_llong sLastFrameNs = 0;
static atomic_llong sFrameIntervalNs = 0;

// sQueue에서만 사용
static int32_t sLongSide = 0;
static int32_t sFrameRate = 0;
static int32_t sBitrate = 0;
static double sBeforeSeconds = 0;
static VTCompressionSessionRef sSession = NULL;
static uintptr_t sSessionGeneration = 0;
static int32_t sWidth = 0;
static int32_t sHeight = 0;
static BOOL sEncoderFailed = NO;
static NSInteger sRotation = 0;
static NSMutableArray *sSamples = nil;
static void (^sClipCompletion)(NSString *, NSError *) = nil;
static NSUInteger sClipGeneration = 0;

static BOOL FrameCaptureIsKeyframe(CMSampleBufferRef sampleBuffer) {
  CFArrayRef attachments = CMSampleBufferGetSampleAttachmentsArray(sampleBuffer, false);

  if (attachments == NULL || CFArrayGetCount(attachments) == 0) {
    return YES;
  }

  return !CFDictionaryContainsKey(CFArrayGetValueAtIndex(attachments, 0), kCMSampleAttachmentKey_NotSync);
}

@interface FrameCaptureVideoBuffer ()
+ (void)addSample:(CMSampleBufferRef)sampleBuffer;
@end

/// 인코더 출력을 받는 callback 함수
static void FrameCaptureDidEncode(void *refCon, void *frameRefCon, OSStatus status, VTEncodeInfoFlags flags,
                                  CMSampleBufferRef sampleBuffer) {
  if (status != noErr || sampleBuffer == NULL || !CMSampleBufferDataIsReady(sampleBuffer)) {
    return;
  }

  uintptr_t generation = (uintptr_t)refCon;

  CFRetain(sampleBuffer);

  dispatch_async(sQueue, ^{
    // 해제한 인코더의 프레임은 무시
    if (generation == sSessionGeneration) {
      [FrameCaptureVideoBuffer addSample:sampleBuffer];
    }

    CFRelease(sampleBuffer);
  });
}

@implementation FrameCaptureVideoBuffer

+ (void)initialize {
  if (self == [FrameCaptureVideoBuffer class]) {
    sQueue = dispatch_queue_create("frame-capture.video", DISPATCH_QUEUE_SERIAL);
    sWriterQueue = dispatch_queue_create("frame-capture.video-writer", DISPATCH_QUEUE_SERIAL);
    sSamples = [NSMutableArray array];
  }
}

+ (void)setDirectory:(NSString *)directory {
  sDirectory = [directory copy];
}

+ (void)startWithWidth:(double)width
                height:(double)height
             frameRate:(double)frameRate
               bitrate:(double)bitrate
              beforeMs:(double)beforeMs {
  [self stop];

  dispatch_sync(sQueue, ^{
    sLongSide = (int32_t)MAX(width, height);
    sFrameRate = (int32_t)frameRate;
    sBitrate = (int32_t)bitrate;
    sBeforeSeconds = beforeMs / 1000;
    sEncoderFailed = NO;
  });

  atomic_store(&sFrameIntervalNs, (long long)(NSEC_PER_SEC / frameRate));
  atomic_store(&sLastFrameNs, 0);
  atomic_store(&sRunning, true);
}

+ (void)stop {
  atomic_store(&sRunning, false);

  dispatch_sync(sQueue, ^{
    [self cancelClip];
    [self releaseSession];
    [sSamples removeAllObjects];
  });
}

+ (void)saveClipAfterMs:(double)afterMs completion:(void (^)(NSString *, NSError *))completion {
  if (!atomic_load(&sRunning)) {
    completion(nil, nil);

    return;
  }

  dispatch_async(sQueue, ^{
    // 저장 중이던 영상은 현재까지만 저장
    [self writeClip];

    sClipCompletion = [completion copy];
    sClipGeneration += 1;

    NSUInteger generation = sClipGeneration;

    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(afterMs * NSEC_PER_MSEC)), sQueue, ^{
      if (generation == sClipGeneration) {
        [self writeClip];
      }
    });
  });
}

+ (void)discardClip {
  dispatch_async(sQueue, ^{
    [self cancelClip];
  });
}

+ (void)handlePixelBuffer:(CVPixelBufferRef)pixelBuffer rotation:(NSInteger)rotation timeNs:(int64_t)timeNs {
  if (!atomic_load(&sRunning)) {
    return;
  }

  // 설정한 프레임 수를 넘는 프레임은 제외
  if (timeNs - atomic_load(&sLastFrameNs) < atomic_load(&sFrameIntervalNs) * 3 / 4 ||
      atomic_load(&sPendingFrames) >= kMaxPendingFrames) {
    return;
  }

  atomic_store(&sLastFrameNs, timeNs);
  atomic_fetch_add(&sPendingFrames, 1);
  CVPixelBufferRetain(pixelBuffer);

  dispatch_async(sQueue, ^{
    if (atomic_load(&sRunning)) {
      [self encodePixelBuffer:pixelBuffer rotation:rotation timeNs:timeNs];
    }

    CVPixelBufferRelease(pixelBuffer);
    atomic_fetch_sub(&sPendingFrames, 1);
  });
}

+ (void)encodePixelBuffer:(CVPixelBufferRef)pixelBuffer rotation:(NSInteger)rotation timeNs:(int64_t)timeNs {
  if (sEncoderFailed) {
    return;
  }

  int32_t frameWidth = (int32_t)CVPixelBufferGetWidth(pixelBuffer);
  int32_t frameHeight = (int32_t)CVPixelBufferGetHeight(pixelBuffer);
  int32_t shortSide = sLongSide * MIN(frameWidth, frameHeight) / MAX(frameWidth, frameHeight) / 2 * 2;
  int32_t width = frameWidth >= frameHeight ? sLongSide : shortSide;
  int32_t height = frameWidth >= frameHeight ? shortSide : sLongSide;

  // 크기가 바뀌면 새 인코더로 다시 시작
  if (sSession == NULL || width != sWidth || height != sHeight) {
    [self cancelClip];
    [self releaseSession];
    [sSamples removeAllObjects];

    if (![self createSessionWithWidth:width height:height]) {
      sEncoderFailed = YES;

      return;
    }
  }

  sRotation = rotation;

  OSStatus status = VTCompressionSessionEncodeFrame(sSession, pixelBuffer, CMTimeMake(timeNs, NSEC_PER_SEC),
                                                    kCMTimeInvalid, NULL, NULL, NULL);

  // 인코더가 무효가 되면 다음 프레임에서 다시 생성
  if (status != noErr) {
    [self releaseSession];
  }
}

+ (BOOL)createSessionWithWidth:(int32_t)width height:(int32_t)height {
  OSStatus status = VTCompressionSessionCreate(kCFAllocatorDefault, width, height, kCMVideoCodecType_H264, NULL, NULL,
                                               NULL, FrameCaptureDidEncode, (void *)sSessionGeneration, &sSession);

  if (status != noErr) {
    sSession = NULL;

    NSLog(@"[FrameCapture] Video encoder setup failed: %d", (int)status);

    return NO;
  }

  VTSessionSetProperty(sSession, kVTCompressionPropertyKey_RealTime, kCFBooleanTrue);
  VTSessionSetProperty(sSession, kVTCompressionPropertyKey_ProfileLevel, kVTProfileLevel_H264_Main_AutoLevel);
  VTSessionSetProperty(sSession, kVTCompressionPropertyKey_AllowFrameReordering, kCFBooleanFalse);
  VTSessionSetProperty(sSession, kVTCompressionPropertyKey_AverageBitRate, (__bridge CFTypeRef) @(sBitrate));
  VTSessionSetProperty(sSession, kVTCompressionPropertyKey_ExpectedFrameRate, (__bridge CFTypeRef) @(sFrameRate));
  VTSessionSetProperty(sSession, kVTCompressionPropertyKey_MaxKeyFrameIntervalDuration,
                       (__bridge CFTypeRef) @(kKeyframeIntervalSeconds));
  VTCompressionSessionPrepareToEncodeFrames(sSession);

  sWidth = width;
  sHeight = height;

  return YES;
}

+ (void)releaseSession {
  if (sSession == NULL) {
    return;
  }

  VTCompressionSessionCompleteFrames(sSession, kCMTimeInvalid);
  VTCompressionSessionInvalidate(sSession);
  CFRelease(sSession);

  sSession = NULL;
  sSessionGeneration += 1;
}

+ (void)addSample:(CMSampleBufferRef)sampleBuffer {
  [sSamples addObject:(__bridge id)sampleBuffer];

  // 영상을 저장하는 동안에는 삭제하지 않음
  if (sClipCompletion != nil) {
    return;
  }

  // 유지할 길이보다 오래된 키프레임 앞까지 삭제
  CMTime cutoff = CMTimeSubtract(CMSampleBufferGetPresentationTimeStamp(sampleBuffer),
                                 CMTimeMakeWithSeconds(sBeforeSeconds, NSEC_PER_SEC));

  for (NSInteger index = (NSInteger)sSamples.count - 1; index > 0; index--) {
    CMSampleBufferRef kept = (__bridge CMSampleBufferRef)sSamples[index];

    if (FrameCaptureIsKeyframe(kept) && CMTIME_COMPARE_INLINE(CMSampleBufferGetPresentationTimeStamp(kept), <=, cutoff)) {
      [sSamples removeObjectsInRange:NSMakeRange(0, index)];

      return;
    }
  }
}

+ (void)cancelClip {
  sClipGeneration += 1;

  if (sClipCompletion != nil) {
    sClipCompletion(nil, nil);
    sClipCompletion = nil;
  }
}

/// 버퍼의 영상을 MP4 파일로 저장하는 메서드
+ (void)writeClip {
  void (^completion)(NSString *, NSError *) = sClipCompletion;

  if (completion == nil) {
    return;
  }

  sClipCompletion = nil;
  sClipGeneration += 1;

  NSUInteger firstKeyframe = [sSamples indexOfObjectPassingTest:^BOOL(id sample, NSUInteger index, BOOL *stop) {
    return FrameCaptureIsKeyframe((__bridge CMSampleBufferRef)sample);
  }];

  if (firstKeyframe == NSNotFound) {
    completion(nil, nil);

    return;
  }

  NSArray *clip = [sSamples subarrayWithRange:NSMakeRange(firstKeyframe, sSamples.count - firstKeyframe)];
  NSInteger rotation = sRotation;
  NSString *fileName =
      [NSString stringWithFormat:@"clip-%lld.mp4", (long long)([NSDate date].timeIntervalSince1970 * 1000)];
  NSURL *url = [NSURL fileURLWithPath:[sDirectory stringByAppendingPathComponent:fileName]];

  dispatch_async(sWriterQueue, ^{
    NSError *error = [self writeSamples:clip rotation:rotation toURL:url];

    if (error == nil) {
      completion(url.absoluteString, nil);
    } else {
      [[NSFileManager defaultManager] removeItemAtURL:url error:nil];
      completion(nil, error);
    }
  });
}

/// 압축 프레임을 MP4 파일로 저장하는 메서드
+ (NSError *)writeSamples:(NSArray *)samples rotation:(NSInteger)rotation toURL:(NSURL *)url {
  NSError *error = nil;
  AVAssetWriter *writer = [AVAssetWriter assetWriterWithURL:url fileType:AVFileTypeMPEG4 error:&error];

  if (writer == nil) {
    return error;
  }

  CMSampleBufferRef first = (__bridge CMSampleBufferRef)samples.firstObject;
  AVAssetWriterInput *input =
      [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo
                                         outputSettings:nil
                                       sourceFormatHint:CMSampleBufferGetFormatDescription(first)];

  input.expectsMediaDataInRealTime = NO;
  // 재생할 때 방향을 바로잡음
  input.transform = CGAffineTransformMakeRotation(rotation * M_PI / 180);

  [writer addInput:input];

  NSError *unknownError = [NSError errorWithDomain:@"FrameCapture"
                                              code:2
                                          userInfo:@{NSLocalizedDescriptionKey : @"Video clip writing failed"}];

  if (![writer startWriting]) {
    return writer.error ?: unknownError;
  }

  [writer startSessionAtSourceTime:CMSampleBufferGetPresentationTimeStamp(first)];

  for (id sample in samples) {
    while (!input.isReadyForMoreMediaData && writer.status == AVAssetWriterStatusWriting) {
      [NSThread sleepForTimeInterval:kWriterWaitSeconds];
    }

    if (![input appendSampleBuffer:(__bridge CMSampleBufferRef)sample]) {
      NSError *appendError = writer.error ?: unknownError;

      [writer cancelWriting];

      return appendError;
    }
  }

  [input markAsFinished];

  dispatch_semaphore_t finished = dispatch_semaphore_create(0);

  [writer finishWritingWithCompletionHandler:^{
    dispatch_semaphore_signal(finished);
  }];
  dispatch_semaphore_wait(finished, DISPATCH_TIME_FOREVER);

  if (writer.status != AVAssetWriterStatusCompleted) {
    return writer.error ?: unknownError;
  }

  return nil;
}

@end
