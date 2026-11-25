import { requireNativeModule } from 'expo';

export interface ParrotCheckResult {
	uri: string;
	capturedAt: number;
	birdScore: number;
	/** 검출 영역의 0~1 비율 */
	birdBox: { x: number; y: number; width: number; height: number } | null;
	photoWidth: number;
	photoHeight: number;
	brightness: number;
	nightCorrected: boolean;
	inferenceMs: number;
}

export interface PersonMaskSettings {
	scoreThreshold: number;
	/** 사방으로 넓힐 박스 크기 비율 */
	margin: number;
	intervalMs: number;
	mergeMs: number;
}

interface FrameCaptureNative {
	/** 프레임을 수신하지 못하면 null, 사람 영역을 가리지 못하면 reject */
	checkParrot: (
		nightCorrectionEnabled: boolean,
		nightStartBrightness: number,
		mergeMs: number,
		quality: number,
		personMask: PersonMaskSettings,
	) => Promise<ParrotCheckResult | null>;
	/** iOS에만 있음 */
	setLowLight: (enabled: boolean, frameRate: number) => void;
	startVideoBuffer: (
		width: number,
		height: number,
		frameRate: number,
		bitrate: number,
		beforeMs: number,
		personMask: PersonMaskSettings,
	) => void;
	stopVideoBuffer: () => void;
	/** 저장하기 전에 취소하면 null, 사람 영역을 가리지 못하면 reject */
	saveVideoClip: (afterMs: number) => Promise<string | null>;
	discardVideoClip: () => void;
}

export const FrameCapture = requireNativeModule<FrameCaptureNative>('FrameCapture');

export const FRAME_CAPTURE_PROCESSOR = 'frameCapture';
