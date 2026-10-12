#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// JS 설정과 처리기가 함께 쓰는 캡처 상태, react-native-webrtc 처리기 등록
@interface FrameCaptureState : NSObject

+ (void)registerProcessorWithName:(NSString *)name directory:(NSString *)directory;
+ (void)configureEnabled:(BOOL)enabled intervalMs:(double)intervalMs quality:(double)quality;
+ (nullable NSDictionary<NSString *, id> *)lastCapture;

@end

NS_ASSUME_NONNULL_END
