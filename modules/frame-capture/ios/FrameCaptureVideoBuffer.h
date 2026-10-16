#import <CoreVideo/CoreVideo.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// 최근 영상을 압축해 유지하는 클래스
@interface FrameCaptureVideoBuffer : NSObject

+ (void)setDirectory:(NSString *)directory;
+ (void)startWithWidth:(double)width
                height:(double)height
             frameRate:(double)frameRate
               bitrate:(double)bitrate
              beforeMs:(double)beforeMs NS_SWIFT_NAME(start(width:height:frameRate:bitrate:beforeMs:));
+ (void)stop;
+ (void)saveClipAfterMs:(double)afterMs
             completion:(void (^)(NSString *_Nullable uri, NSError *_Nullable error))completion
    NS_SWIFT_NAME(saveClip(afterMs:completion:));
+ (void)discardClip;
+ (void)handlePixelBuffer:(CVPixelBufferRef)pixelBuffer rotation:(NSInteger)rotation timeNs:(int64_t)timeNs;

@end

NS_ASSUME_NONNULL_END
