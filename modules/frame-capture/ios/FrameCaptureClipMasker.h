#import <Foundation/Foundation.h>

@class FrameCapturePersonMaskSettings;

NS_ASSUME_NONNULL_BEGIN

/// 저장한 영상의 사람을 검정으로 가리는 클래스
@interface FrameCaptureClipMasker : NSObject

/// 가리지 못하거나 취소되면 오류 반환
+ (nullable NSError *)maskClipAtURL:(NSURL *)input
                              toURL:(NSURL *)output
                           rotation:(NSInteger)rotation
                           settings:(FrameCapturePersonMaskSettings *)settings
                            bitrate:(int32_t)bitrate
                          frameRate:(int32_t)frameRate
                        isCancelled:(BOOL (^)(void))isCancelled;

@end

NS_ASSUME_NONNULL_END
