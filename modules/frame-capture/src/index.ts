import { requireNativeModule } from 'expo-modules-core';

export interface FrameCaptureResult {
	path: string;
	capturedAt: number;
	width: number;
	height: number;
	rotation: number;
	bytes: number;
	encodeMs: number;
	count: number;
}

interface FrameCaptureNative {
	configure: (enabled: boolean, intervalMs: number, quality: number) => void;
	getLastCapture: () => FrameCaptureResult | null;
}

export const FrameCapture = requireNativeModule<FrameCaptureNative>('FrameCapture');

/** react-native-webrtc 비디오 트랙에 연결할 처리기 이름 */
export const FRAME_CAPTURE_PROCESSOR = 'frameCapture';
