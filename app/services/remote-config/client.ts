import { fetchAndActivate, getBoolean, getNumber, getRemoteConfig } from '@react-native-firebase/remote-config';

import { PETCAM_VIDEO } from '@/config';

const EMERGENCY_AUDIO_EVENT_KEY = 'show_emergency_audio_event';
const PETCAM_KEY = 'show_petcam';
const PETCAM_VIDEO_WIDTH_KEY = 'petcam_video_width';
const PETCAM_VIDEO_HEIGHT_KEY = 'petcam_video_height';
const PETCAM_VIDEO_FRAME_RATE_KEY = 'petcam_video_frame_rate';

/** Remote Config 값을 받아 적용하는 함수 */
export const initializeRemoteConfig = async () => {
	const remoteConfig = getRemoteConfig();

	remoteConfig.defaultConfig = {
		[EMERGENCY_AUDIO_EVENT_KEY]: false,
		[PETCAM_KEY]: false,
		[PETCAM_VIDEO_WIDTH_KEY]: PETCAM_VIDEO.width,
		[PETCAM_VIDEO_HEIGHT_KEY]: PETCAM_VIDEO.height,
		[PETCAM_VIDEO_FRAME_RATE_KEY]: PETCAM_VIDEO.frameRate,
	};

	await fetchAndActivate(remoteConfig);
};

/** 0보다 큰 숫자 값을 반환하는 함수 */
const readPositiveNumber = (key: string, fallback: number) => {
	const value = getNumber(getRemoteConfig(), key);

	return value > 0 ? value : fallback;
};

/** 응급 상황 소리를 보여 줄지 반환하는 함수 */
export const shouldShowEmergencyAudioEvent = () => {
	return getBoolean(getRemoteConfig(), EMERGENCY_AUDIO_EVENT_KEY);
};

/** 펫캠을 보여 줄지 반환하는 함수 */
export const shouldShowPetcam = () => {
	return getBoolean(getRemoteConfig(), PETCAM_KEY);
};

/** 펫캠 영상 설정을 반환하는 함수 */
export const getPetcamVideo = () => {
	return {
		...PETCAM_VIDEO,
		width: readPositiveNumber(PETCAM_VIDEO_WIDTH_KEY, PETCAM_VIDEO.width),
		height: readPositiveNumber(PETCAM_VIDEO_HEIGHT_KEY, PETCAM_VIDEO.height),
		frameRate: readPositiveNumber(PETCAM_VIDEO_FRAME_RATE_KEY, PETCAM_VIDEO.frameRate),
	};
};
