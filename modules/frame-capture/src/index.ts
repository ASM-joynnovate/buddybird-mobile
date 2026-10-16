import { requireNativeModule } from 'expo';

export interface ParrotCheckResult {
	uri: string;
	capturedAt: number;
	birdScore: number;
	/** 사진 기준 0~1 비율, 검출 결과가 없으면 null */
	birdBox: { x: number; y: number; width: number; height: number } | null;
	photoWidth: number;
	photoHeight: number;
	brightness: number;
	nightCorrected: boolean;
	inferenceMs: number;
}

interface FrameCaptureNative {
	/** 프레임을 수신하지 못하면 null */
	checkParrot: (
		nightCorrectionEnabled: boolean,
		nightStartBrightness: number,
		mergeMs: number,
		quality: number,
	) => Promise<ParrotCheckResult | null>;
	/** iOS에만 있음 */
	setLowLight: (enabled: boolean, frameRate: number) => void;
	startVideoBuffer: (width: number, height: number, frameRate: number, bitrate: number, beforeMs: number) => void;
	stopVideoBuffer: () => void;
	/** 저장하기 전에 취소하면 null */
	saveVideoClip: (afterMs: number) => Promise<string | null>;
	discardVideoClip: () => void;
}

export const FrameCapture = requireNativeModule<FrameCaptureNative>('FrameCapture');

export const FRAME_CAPTURE_PROCESSOR = 'frameCapture';
