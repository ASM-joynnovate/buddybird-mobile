#import "FrameCaptureState.h"

#import <CoreImage/CoreImage.h>
#import <WebRTC/RTCCVPixelBuffer.h>
#import <WebRTC/RTCVideoFrame.h>
#import <WebRTC/RTCVideoFrameBuffer.h>
#import <react-native-webrtc/ProcessorProvider.h>
#import <react-native-webrtc/VideoFrameProcessor.h>

static BOOL sEnabled = NO;
static double sIntervalMs = 5000;
static double sQuality = 0.7;
static NSDictionary<NSString *, id> *sLast = nil;
static NSInteger sCount = 0;
static NSObject *sLock = nil;

/// 송출 중인 카메라 프레임을 일정 간격으로 JPEG 파일로 저장하는 처리기
@interface FrameCaptureProcessor : NSObject <VideoFrameProcessorDelegate>
@property (nonatomic, copy) NSString *directory;
@property (nonatomic, strong) dispatch_queue_t encoder;
@property (nonatomic, strong) CIContext *context;
@property (nonatomic, assign) int64_t lastCaptureAt;
@end

@implementation FrameCaptureProcessor

- (instancetype)initWithDirectory:(NSString *)directory {
  if (self = [super init]) {
    _directory = [directory copy];
    _encoder = dispatch_queue_create("frame-capture.encoder", DISPATCH_QUEUE_SERIAL);
    _context = [CIContext contextWithOptions:nil];
    _lastCaptureAt = 0;
  }
  return self;
}

- (RTCVideoFrame *)capturer:(RTCVideoCapturer *)capturer didCaptureVideoFrame:(RTCVideoFrame *)frame {
  int64_t now = (int64_t)([[NSDate date] timeIntervalSince1970] * 1000);

  @synchronized (sLock) {
    if (!sEnabled || now - self.lastCaptureAt < sIntervalMs) {
      return frame;
    }
    self.lastCaptureAt = now;
  }

  // iOS 카메라 프레임은 CVPixelBuffer, 인코딩은 별도 큐에서 처리해 송출이 막히지 않게 함
  if (![frame.buffer isKindOfClass:[RTCCVPixelBuffer class]]) {
    return frame;
  }

  CVPixelBufferRef pixelBuffer = ((RTCCVPixelBuffer *)frame.buffer).pixelBuffer;
  CVPixelBufferRetain(pixelBuffer);
  RTCVideoRotation rotation = frame.rotation;
  double quality = sQuality;

  dispatch_async(self.encoder, ^{
    CFAbsoluteTime started = CFAbsoluteTimeGetCurrent();
    CIImage *image = [CIImage imageWithCVPixelBuffer:pixelBuffer];
    CGColorSpaceRef colorSpace = CGColorSpaceCreateWithName(kCGColorSpaceSRGB);
    NSData *jpeg = [self.context JPEGRepresentationOfImage:image
                                               colorSpace:colorSpace
                                                  options:@{(id)kCGImageDestinationLossyCompressionQuality: @(quality)}];
    CGColorSpaceRelease(colorSpace);
    size_t width = CVPixelBufferGetWidth(pixelBuffer);
    size_t height = CVPixelBufferGetHeight(pixelBuffer);
    CVPixelBufferRelease(pixelBuffer);

    if (jpeg == nil) {
      return;
    }

    NSString *path = [self.directory stringByAppendingPathComponent:[NSString stringWithFormat:@"frame-%lld.jpg", now]];
    if (![jpeg writeToFile:path atomically:YES]) {
      return;
    }

    @synchronized (sLock) {
      sCount += 1;
      sLast = @{
        @"path": path,
        @"capturedAt": @(now),
        @"width": @(width),
        @"height": @(height),
        @"rotation": @(rotation),
        @"bytes": @(jpeg.length),
        @"encodeMs": @((CFAbsoluteTimeGetCurrent() - started) * 1000),
        @"count": @(sCount),
      };
    }
  });

  return frame;
}

@end

@implementation FrameCaptureState

+ (void)initialize {
  if (self == [FrameCaptureState class]) {
    sLock = [NSObject new];
  }
}

+ (void)registerProcessorWithName:(NSString *)name directory:(NSString *)directory {
  [[NSFileManager defaultManager] createDirectoryAtPath:directory withIntermediateDirectories:YES attributes:nil error:nil];
  [ProcessorProvider addProcessor:[[FrameCaptureProcessor alloc] initWithDirectory:directory] forName:name];
}

+ (void)configureEnabled:(BOOL)enabled intervalMs:(double)intervalMs quality:(double)quality {
  @synchronized (sLock) {
    sEnabled = enabled;
    sIntervalMs = intervalMs;
    // JS는 안드로이드와 같은 0~100 값을 넘기므로 0~1로 변환
    sQuality = quality / 100.0;
  }
}

+ (NSDictionary<NSString *, id> *)lastCapture {
  @synchronized (sLock) {
    return sLast;
  }
}

@end
