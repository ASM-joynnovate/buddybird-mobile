import { useCallback, useEffect, useRef, useState } from 'react';

import { useIssuePetcamTurnCredential } from '@/hooks/apis/petcam';

import { mediaDevices, type MediaStream } from 'react-native-webrtc';

import { PETCAM_ENABLED, PETCAM_VIDEO } from '@/config';
import { createStationPetcam, type StationPetcam } from '@/services/petcam/connection';
import { reportError } from '@/services/telemetry/client';

interface Options {
	sessionId: string;
	cameraOn: boolean;
	onRemoteCamera: (on: boolean) => void;
	onCameraFailed: () => void;
}

/** 카메라 영상 닫기 함수 */
const closeStream = (stream: MediaStream) => {
	stream.getTracks().forEach((track) => track.stop());
	stream.release();
};

/** 학습 중인 기기의 카메라 영상을 열어 보는 기기로 보내는 Hook */
const useStationPetcam = ({ sessionId, cameraOn, onRemoteCamera, onCameraFailed }: Options) => {
	const [stream, setStream] = useState<MediaStream | null>(null);

	const { mutateAsync: issueTurnCredential } = useIssuePetcamTurnCredential();

	const stationRef = useRef<StationPetcam | null>(null);
	const onRemoteCameraRef = useRef(onRemoteCamera);
	const onCameraFailedRef = useRef(onCameraFailed);

	/** 카메라 요청과 실패 처리에 사용할 최신 함수 저장 */
	useEffect(() => {
		onRemoteCameraRef.current = onRemoteCamera;
		onCameraFailedRef.current = onCameraFailed;
	}, [onCameraFailed, onRemoteCamera]);

	/** 보는 기기와 연결 정보를 주고받는 채널 열기 */
	useEffect(() => {
		if (!PETCAM_ENABLED) {
			return;
		}

		const station = createStationPetcam({
			sessionId,
			issueTurnCredential,
			onCameraRequest: (on) => onRemoteCameraRef.current(on),
			onError: (error) => reportError(error, 'petcam_station'),
		});

		stationRef.current = station;

		return () => {
			stationRef.current = null;

			station.close();
		};
	}, [issueTurnCredential, sessionId]);

	/** 카메라가 켜져 있는 동안 후면 카메라 영상 열기 */
	useEffect(() => {
		if (!cameraOn) {
			return;
		}

		let opened: MediaStream | null = null;
		let cancelled = false;

		void mediaDevices
			.getUserMedia({ audio: false, video: PETCAM_VIDEO })
			.then((media) => {
				if (cancelled) {
					closeStream(media);

					return;
				}

				opened = media;

				setStream(media);
				stationRef.current?.setStream(media);
			})
			.catch((error: unknown) => {
				reportError(error, 'petcam_camera');

				if (!cancelled) {
					onCameraFailedRef.current();
				}
			});

		return () => {
			cancelled = true;

			if (opened) {
				closeStream(opened);
			}

			setStream(null);
			stationRef.current?.setStream(null);
		};
	}, [cameraOn]);

	/** 카메라 권한이 없어 켜지 못했음을 보는 기기에 알리는 함수 */
	const reportPermissionDenied = useCallback(() => stationRef.current?.reportPermissionDenied(), []);

	return { stream, reportPermissionDenied };
};

export default useStationPetcam;
