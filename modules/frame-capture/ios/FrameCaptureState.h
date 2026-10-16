#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// WebRTC 카메라에 연결하는 클래스
@interface FrameCaptureState : NSObject

+ (void)registerProcessorWithName:(NSString *)name
                        directory:(NSString *)directory NS_SWIFT_NAME(registerProcessor(name:directory:));
+ (void)setLowLight:(BOOL)enabled frameRate:(double)frameRate NS_SWIFT_NAME(setLowLight(_:frameRate:));

@end

NS_ASSUME_NONNULL_END
