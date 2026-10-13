import { useCallback, useEffect, useRef, useState } from 'react';

import type { PetcamState } from '@/types/apis/petcam';

import { useIssuePetcamTurnCredential } from '@/hooks/apis/petcam';

import type { MediaStream } from 'react-native-webrtc';

import { createViewerPetcam } from '@/services/petcam/connection';
import { reportError } from '@/services/telemetry/client';

type ViewerPetcam = ReturnType<typeof createViewerPetcam>;

/** 다른 기기에서 진행 중인 학습의 카메라 영상을 받는 Hook */
const useViewerPetcam = (sessionId: string) => {
	const [state, setState] = useState<PetcamState | null>(null);
	const [stream, setStream] = useState<MediaStream | null>(null);

	const { mutateAsync: issueTurnCredential } = useIssuePetcamTurnCredential();

	const viewerRef = useRef<ViewerPetcam | null>(null);

	/** 학습 중인 기기와 연결 정보를 주고받는 채널 열기 */
	useEffect(() => {
		const viewer = createViewerPetcam({
			sessionId,
			issueTurnCredential,
			onState: setState,
			onStream: setStream,
			onError: (error) => reportError(error, 'petcam_viewer'),
		});

		viewerRef.current = viewer;

		return () => {
			viewerRef.current = null;

			viewer.close();

			setState(null);
			setStream(null);
		};
	}, [issueTurnCredential, sessionId]);

	/** 학습 중인 기기의 카메라를 켜거나 끄도록 요청하는 함수 */
	const setCamera = useCallback((on: boolean) => viewerRef.current?.setCamera(on), []);

	return { state, stream, setCamera };
};

export default useViewerPetcam;
