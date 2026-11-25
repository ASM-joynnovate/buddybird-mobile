#import <AVFoundation/AVFoundation.h>
#import <CoreVideo/CoreVideo.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import "FrameCaptureCamera.h"

@class MPPObjectDetector;

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT const int32_t FrameCaptureKeyframeIntervalSeconds;
FOUNDATION_EXPORT const uint8_t FrameCaptureLumaBlack;
FOUNDATION_EXPORT const uint8_t FrameCaptureChromaCenter;
FOUNDATION_EXPORT const float FrameCaptureLumaRange;
FOUNDATION_EXPORT const float FrameCaptureMaxBrightness;

/// 모듈 오류 생성 함수
FOUNDATION_EXPORT NSError *FrameCaptureError(FrameCaptureErrorCode code, NSString *message);
/// video range 밝기의 0~255 변환 함수
FOUNDATION_EXPORT double FrameCaptureVideoRangeBrightness(double luma);
/// 방향을 바로잡은 이미지 생성 함수
FOUNDATION_EXPORT UIImage *_Nullable FrameCaptureUprightImage(CVPixelBufferRef pixelBuffer, NSInteger rotation);
/// 검출 모델 생성 함수
FOUNDATION_EXPORT MPPObjectDetector *_Nullable FrameCaptureCreateDetector(NSString *modelName,
                                                                          NSString *category,
                                                                          float scoreThreshold,
                                                                          NSInteger maxResults,
                                                                          FrameCaptureErrorCode errorCode,
                                                                          NSError **error);
/// 인코더 입력 대기 함수
FOUNDATION_EXPORT void FrameCaptureWaitForInput(AVAssetWriter *writer, AVAssetWriterInput *input);
/// 파일 쓰기 완료 함수
FOUNDATION_EXPORT BOOL FrameCaptureFinishWriting(AVAssetWriter *writer, AVAssetWriterInput *input);

NS_ASSUME_NONNULL_END
