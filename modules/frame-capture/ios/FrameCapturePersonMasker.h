#import <CoreVideo/CoreVideo.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/// 사람 가림 설정
@interface FrameCapturePersonMaskSettings : NSObject

@property(nonatomic, readonly) float scoreThreshold;
/// 사방으로 넓힐 박스 크기 비율
@property(nonatomic, readonly) CGFloat margin;
@property(nonatomic, readonly) double intervalMs;
@property(nonatomic, readonly) double mergeMs;

- (instancetype)initWithScoreThreshold:(double)scoreThreshold
                                margin:(double)margin
                            intervalMs:(double)intervalMs
                               mergeMs:(double)mergeMs NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

@end

/// 사람을 검출해 검정으로 가리는 클래스
@interface FrameCapturePersonMasker : NSObject

+ (nullable NSArray<NSValue *> *)detectPeopleInImage:(UIImage *)image
                                      scoreThreshold:(float)scoreThreshold
                                               error:(NSError **)error;
+ (UIImage *)maskedImage:(UIImage *)image boxes:(NSArray<NSValue *> *)boxes margin:(CGFloat)margin;
+ (CGRect)expandedBox:(CGRect)box margin:(CGFloat)margin size:(CGSize)size;
+ (BOOL)blackOutPixelBuffer:(CVPixelBufferRef)pixelBuffer boxes:(NSArray<NSValue *> *)boxes;

@end

NS_ASSUME_NONNULL_END
