// [SPIKE BB-657] WebRTC 카메라 영상에서 5초마다 프레임을 추출할 수 있는지 검증하는 임시 코드, 머지하지 않음
import { useEffect, useState } from 'react';

import { Image, StyleSheet, Text, View } from 'react-native';

import { mediaDevices, type MediaStream, RTCView } from 'react-native-webrtc';

import { FRAME_CAPTURE_PROCESSOR, FrameCapture, type FrameCaptureResult } from '../../../../modules/frame-capture/src';

import { reportError } from '@/services/telemetry/client';
import { sessionColors } from '@/theme/session-colors';

const CAPTURE_INTERVAL_MS = 5000;
const POLL_MS = 1000;
const JPEG_QUALITY = 70;

/** 학습 화면 뒤에 깔리는 Station 카메라 영상 컴포넌트 */
const StationCamera = () => {
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [last, setLast] = useState<FrameCaptureResult | null>(null);

	/** 후면 카메라 영상을 열고 프레임 처리기 연결 */
	useEffect(() => {
		let opened: MediaStream | null = null;

		void mediaDevices
			.getUserMedia({ audio: false, video: { facingMode: 'environment', width: 1280, height: 720, frameRate: 24 } })
			.then((media) => {
				opened = media;

				const [track] = media.getVideoTracks();

				track?._setVideoEffect(FRAME_CAPTURE_PROCESSOR);
				FrameCapture.configure(true, CAPTURE_INTERVAL_MS, JPEG_QUALITY);
				setStream(media);
			})
			.catch((error: unknown) => reportError(error, 'spike_station_camera'));

		return () => {
			FrameCapture.configure(false, CAPTURE_INTERVAL_MS, JPEG_QUALITY);
			opened?.getTracks().forEach((track) => track.stop());
			opened?.release();
		};
	}, []);

	/** 최근 캡처 결과 확인 */
	useEffect(() => {
		const timer = setInterval(() => setLast(FrameCapture.getLastCapture()), POLL_MS);

		return () => clearInterval(timer);
	}, []);

	return (
		<View style={StyleSheet.absoluteFill} pointerEvents="none">
			{stream && <RTCView streamURL={stream.toURL()} objectFit="cover" style={StyleSheet.absoluteFill} />}

			{/*학습 정보가 잘 보이도록 영상을 어둡게 덮음*/}
			<View style={styles.scrim} />

			{last && (
				<View style={styles.debug}>
					<Image source={{ uri: `file://${last.path}` }} style={styles.thumb} />
					<Text style={styles.debugText}>
						{`#${last.count} ${last.width}x${last.height} r${last.rotation}\n${Math.round(last.bytes / 1024)}KB encode ${last.encodeMs}ms\n${new Date(last.capturedAt).toLocaleTimeString()}`}
					</Text>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	scrim: { ...StyleSheet.absoluteFill, backgroundColor: sessionColors.videoScrim },
	debug: { position: 'absolute', left: 16, top: 140, flexDirection: 'row', gap: 8, alignItems: 'center' },
	thumb: { width: 120, height: 68, backgroundColor: '#222' },
	debugText: { color: '#0f0', fontSize: 12 },
});

export default StationCamera;
