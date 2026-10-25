#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString *const FrameCaptureErrorDomain;

/// WebRTC 카메라에 연결하는 클래스
@interface FrameCaptureCamera : NSObject

/// 프레임 처리기 등록 메서드
+ (void)registerProcessorWithName:(NSString *)name
                        directory:(NSString *)directory NS_SWIFT_NAME(registerProcessor(name:directory:));
/// 저조도 촬영 설정 메서드
+ (void)setLowLight:(BOOL)enabled frameRate:(double)frameRate NS_SWIFT_NAME(setLowLight(_:frameRate:));

@end

NS_ASSUME_NONNULL_END
