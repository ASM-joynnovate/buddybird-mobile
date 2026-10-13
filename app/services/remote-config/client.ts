import { remoteConfigSchema } from '@/types/remote-config';

import { activate, fetchAndActivate, getRemoteConfig, getValue } from '@react-native-firebase/remote-config';

import { PETCAM_VIDEO, REMOTE_CONFIG_MIN_FETCH_INTERVAL_MS, VAD } from '@/config';
import { recordRemoteConfig } from '@/services/telemetry/client';

const configListeners = new Set<() => void>();

/** JSON 문자열을 값으로 변환하는 함수 */
const parseJson = (text: string): unknown => {
	try {
		return JSON.parse(text) as unknown;
	} catch {
		// JSON이 아니면 문자열 그대로 사용
		return text;
	}
};

/** 적용된 Remote Config 값을 반환하는 함수 */
const readConfigValues = () => {
	const remoteConfig = getRemoteConfig();

	return remoteConfigSchema.parse(
		Object.fromEntries(
			Object.keys(remoteConfigSchema.shape).map((key) => [
				key,
				parseJson(getValue(remoteConfig, key).asString()),
			]),
		),
	);
};

/** Remote Config 값을 받아 적용하는 함수 */
export const initializeRemoteConfig = async () => {
	const remoteConfig = getRemoteConfig();

	remoteConfig.settings = {
		...remoteConfig.settings,
		minimumFetchIntervalMillis: REMOTE_CONFIG_MIN_FETCH_INTERVAL_MS,
	};

	try {
		await activate(remoteConfig);
		await fetchAndActivate(remoteConfig);
	} finally {
		recordRemoteConfig(readConfigValues());

		for (const listener of configListeners) {
			listener();
		}
	}
};

/** Remote Config 값을 받은 뒤 실행할 함수를 등록하는 함수 */
export const subscribeRemoteConfig = (listener: () => void) => {
	configListeners.add(listener);

	return () => {
		configListeners.delete(listener);
	};
};

/** 응급 상황 소리를 보여 줄지 반환하는 함수 */
export const shouldShowEmergencyAudioEvent = () => {
	return readConfigValues().show_emergency_audio_event;
};

/** 펫캠을 보여 줄지 반환하는 함수 */
export const shouldShowPetcam = () => {
	return readConfigValues().show_petcam;
};

/** 펫캠 영상 설정을 반환하는 함수 */
export const getPetcamVideo = () => {
	const configValues = readConfigValues();

	return {
		...PETCAM_VIDEO,
		width: configValues.petcam_video_width,
		height: configValues.petcam_video_height,
		frameRate: configValues.petcam_video_frame_rate,
	};
};

/** 펫캠 연결 제한 시간을 반환하는 함수 */
export const getPetcamConnectTimeoutMs = () => {
	return readConfigValues().petcam_connect_timeout_ms;
};

/** 펫캠 영상 통계 기록 주기를 반환하는 함수 */
export const getPetcamStatsIntervalMs = () => {
	return readConfigValues().petcam_stats_interval_ms;
};

/** 카메라 요청 제한 시간을 반환하는 함수 */
export const getPetcamCameraRequestTimeoutMs = () => {
	return readConfigValues().petcam_camera_request_timeout_ms;
};

/** 소리 감지 설정을 반환하는 함수 */
export const getVad = () => {
	const configValues = readConfigValues();

	return {
		...VAD,
		threshold: configValues.vad_threshold,
		minSoundMs: configValues.vad_min_sound_ms,
		minSilenceMs: configValues.vad_min_silence_ms,
		ignoreAfterPlaybackMs: configValues.vad_ignore_after_playback_ms,
		maxSegmentMs: configValues.vad_max_segment_ms,
	};
};

/** 단어 재생 간격 배수를 반환하는 함수 */
export const getWordReplayDelayFactor = () => {
	return readConfigValues().word_replay_delay_factor;
};

/** 피드백 요청 접속일 수 목록을 반환하는 함수 */
export const getFeedbackPromptThresholds = () => {
	return readConfigValues().feedback_prompt_thresholds;
};

/** 최소 지원 버전을 반환하는 함수 */
export const getMinSupportedVersion = () => {
	return readConfigValues().min_supported_version;
};
