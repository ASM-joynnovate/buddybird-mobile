import { fetchAndActivate, getBoolean, getRemoteConfig } from '@react-native-firebase/remote-config';

const EMERGENCY_AUDIO_EVENT_KEY = 'show_emergency_audio_event';

/** Remote Config 값을 받아 적용하는 함수 */
export const initializeRemoteConfig = async () => {
	const remoteConfig = getRemoteConfig();

	remoteConfig.defaultConfig = { [EMERGENCY_AUDIO_EVENT_KEY]: false };

	await fetchAndActivate(remoteConfig);
};

/** 응급 상황 소리를 보여 줄지 반환하는 함수 */
export const shouldShowEmergencyAudioEvent = () => {
	return getBoolean(getRemoteConfig(), EMERGENCY_AUDIO_EVENT_KEY);
};
