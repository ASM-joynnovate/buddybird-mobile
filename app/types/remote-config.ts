import { z } from 'zod';

import {
	FEEDBACK_PROMPT_THRESHOLDS,
	PETCAM_CAMERA_REQUEST_TIMEOUT_MS,
	PETCAM_CONNECT_TIMEOUT_MS,
	PETCAM_STATS_INTERVAL_MS,
	PETCAM_VIDEO,
	VAD,
	WORD_REPLAY_DELAY_FACTOR,
} from '@/config';
import { HOUR, MINUTE, SECOND } from '@/config/units';

export const remoteConfigSchema = z.object({
	show_emergency_audio_event: z.boolean().catch(false),
	show_petcam: z.boolean().catch(false),

	petcam_video_width: z.int().min(160).max(3840).catch(PETCAM_VIDEO.width),
	petcam_video_height: z.int().min(120).max(2160).catch(PETCAM_VIDEO.height),
	petcam_video_frame_rate: z.int().min(1).max(240).catch(PETCAM_VIDEO.frameRate),
	petcam_connect_timeout_ms: z
		.int()
		.min(5 * SECOND)
		.max(5 * MINUTE)
		.catch(PETCAM_CONNECT_TIMEOUT_MS),
	petcam_stats_interval_ms: z
		.int()
		.min(5 * SECOND)
		.max(HOUR)
		.catch(PETCAM_STATS_INTERVAL_MS),
	petcam_camera_request_timeout_ms: z.int().min(SECOND).max(MINUTE).catch(PETCAM_CAMERA_REQUEST_TIMEOUT_MS),

	vad_threshold: z.number().gt(0).lt(1).catch(VAD.threshold),
	vad_min_sound_ms: z.int().min(100).max(500).catch(VAD.minSoundMs),
	vad_min_silence_ms: z.int().min(100).max(MINUTE).catch(VAD.minSilenceMs),
	vad_ignore_after_playback_ms: z.int().min(0).max(MINUTE).catch(VAD.ignoreAfterPlaybackMs),
	vad_max_segment_ms: z
		.int()
		.min(SECOND)
		.max(160 * SECOND)
		.catch(VAD.maxSegmentMs),
	word_replay_delay_factor: z.number().min(0).max(100).catch(WORD_REPLAY_DELAY_FACTOR),

	feedback_prompt_thresholds: z
		.array(z.int().min(1).max(365))
		.min(1)
		.max(20)
		.catch([...FEEDBACK_PROMPT_THRESHOLDS]),
});

export type RemoteConfigValues = z.infer<typeof remoteConfigSchema>;
