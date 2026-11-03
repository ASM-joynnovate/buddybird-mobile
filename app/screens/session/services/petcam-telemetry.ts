import type { PetcamVideoSettings, PetcamVideoStats } from '@/types/petcam';

import * as Sentry from '@sentry/react-native';

import type { ParrotCheckResult } from '@modules/frame-capture/src';

/** 요청한 영상 설정의 Sentry 속성을 반환하는 함수 */
const requestedVideoAttributes = (video: PetcamVideoSettings) => ({
	'petcam.requested_width': video.width,
	'petcam.requested_height': video.height,
	'petcam.requested_frame_rate': video.frameRate,
});

/** 카메라 시작을 span으로 기록하는 함수 */
export const tracePetcamCamera = <Result>(video: PetcamVideoSettings, openCamera: () => Promise<Result>) => {
	return Sentry.startSpan({ name: 'petcam.camera', attributes: requestedVideoAttributes(video) }, openCamera);
};

/** 영상 통계를 metric으로 기록하는 함수 */
export const recordPetcamVideoStats = (role: 'sender' | 'receiver', stats: PetcamVideoStats) => {
	const attributes = {
		role,
		...(stats.qualityLimitation ? { quality_limitation: stats.qualityLimitation } : {}),
	};

	Sentry.metrics.distribution('petcam.frame_rate', stats.frameRate, { attributes });
	Sentry.metrics.distribution('petcam.frame_width', stats.frameWidth, { attributes });
	Sentry.metrics.distribution('petcam.frame_height', stats.frameHeight, { attributes });

	if (stats.bitrate !== null) {
		Sentry.metrics.distribution('petcam.bitrate', stats.bitrate, { unit: 'kbps', attributes });
	}
};

/** 앵무새 확인 결과를 metric으로 기록하는 함수 */
export const recordParrotCheck = (checkResult: ParrotCheckResult) => {
	const attributes = { night_corrected: checkResult.nightCorrected };

	Sentry.metrics.distribution('petcam.bird_score', checkResult.birdScore, { attributes });
	Sentry.metrics.distribution('petcam.photo_brightness', checkResult.brightness, { attributes });
	Sentry.metrics.distribution('petcam.inference_duration', checkResult.inferenceMs, {
		unit: 'millisecond',
		attributes,
	});
};

/** 앵무새 box IoU를 metric으로 기록하는 함수 */
export const recordParrotMotionIou = (iou: number) => {
	Sentry.metrics.distribution('petcam.bird_box_iou', iou);
};

/** 펫캠 파일 업로드를 metric으로 기록하는 함수 */
export const recordPetcamUpload = (fileKind: 'photo' | 'video', bytes: number, durationMs: number) => {
	const attributes = { fileKind };

	Sentry.metrics.distribution('petcam.upload_size', bytes, { unit: 'byte', attributes });
	Sentry.metrics.distribution('petcam.upload_duration', durationMs, { unit: 'millisecond', attributes });
};

/** 펫캠 파일 업로드 실패를 metric으로 기록하는 함수 */
export const recordPetcamUploadFailure = (file: 'photo' | 'video') => {
	Sentry.metrics.count('petcam.upload_failure', 1, { attributes: { file } });
};
