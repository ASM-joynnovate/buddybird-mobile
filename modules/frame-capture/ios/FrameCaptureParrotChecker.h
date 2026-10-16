#import <CoreVideo/CoreVideo.h>
#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// 카메라 프레임에서 앵무새를 검출하는 클래스
@interface FrameCaptureParrotChecker : NSObject

+ (void)setDirectory:(NSString *)directory;
+ (void)checkWithNightCorrectionEnabled:(BOOL)nightCorrectionEnabled
            nightStartBrightness:(double)nightStartBrightness
                         mergeMs:(double)mergeMs
                         quality:(double)quality
                      completion:(void (^)(NSDictionary<NSString *, id> *_Nullable result,
                                           NSError *_Nullable error))completion
    NS_SWIFT_NAME(check(nightCorrectionEnabled:nightStartBrightness:mergeMs:quality:completion:));
+ (void)handlePixelBuffer:(CVPixelBufferRef)pixelBuffer rotation:(NSInteger)rotation;

@end

NS_ASSUME_NONNULL_END
