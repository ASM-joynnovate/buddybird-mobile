#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString *const FrameCaptureErrorDomain;

typedef NS_ENUM(NSInteger, FrameCaptureErrorCode) {
  FrameCaptureErrorCodeParrotCheck = 1,
  FrameCaptureErrorCodeVideoClip = 2,
  FrameCaptureErrorCodePersonMask = 3,
  FrameCaptureErrorCodeClipMask = 4,
  FrameCaptureErrorCodeClipCancelled = 5,
  FrameCaptureErrorCodeClipMaskDetect = 6,
  FrameCaptureErrorCodeClipMaskWrite = 7,
};

/// WebRTC 카메라에 연결하는 클래스
@interface FrameCaptureCamera : NSObject

/// 이전 실행에서 남은 파일 삭제 메서드
+ (void)removeLeftoverFilesInDirectory:(NSString *)directory NS_SWIFT_NAME(removeLeftoverFiles(directory:));
/// 프레임 처리기 등록 메서드
+ (void)registerProcessorWithName:(NSString *)name
                        directory:(NSString *)directory NS_SWIFT_NAME(registerProcessor(name:directory:));
/// 저조도 촬영 설정 메서드
+ (void)setLowLight:(BOOL)enabled frameRate:(double)frameRate NS_SWIFT_NAME(setLowLight(_:frameRate:));

@end

NS_ASSUME_NONNULL_END
