import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { reportError } from '@/services/telemetry/client';

export interface SoundPlayer {
	playingId: string | null;
	finishedIds: ReadonlySet<string>;
	failedId: string | null;
	toggle: (id: string, url: string) => void;
	stop: () => void;
}

/** 녹음 재생 Hook */
const useSoundPlayer = () => {
	const player = useAudioPlayer(null, { updateInterval: 100 });
	const status = useAudioPlayerStatus(player);

	const [playingId, setPlayingId] = useState<string | null>(null);
	const [failedId, setFailedId] = useState<string | null>(null);
	const [finishedIds, setFinishedIds] = useState<ReadonlySet<string>>(new Set());

	const playSequenceRef = useRef(0);

	/** 재생 정지 함수 */
	const stop = useCallback(() => {
		playSequenceRef.current++;
		player.pause();

		setPlayingId(null);
	}, [player]);

	/** 컴포넌트 unmount 시 재생 정지 */
	useLayoutEffect(() => stop, [stop]);

	/** 재생 종료 시 녹음 ID 저장 */
	useEffect(() => {
		if (!playingId) {
			return;
		}

		if (status.playbackState === 'failed') {
			setFailedId(playingId);

			stop();
		} else if (status.didJustFinish) {
			const finishedId = playingId;

			setFinishedIds((prev) => new Set([...prev, finishedId]));

			stop();
		}
	}, [playingId, status.didJustFinish, status.playbackState, stop]);

	/** 녹음 재생 또는 정지 함수 */
	const toggle = (id: string, url: string) => {
		if (playingId === id) {
			stop();

			return;
		}

		const token = ++playSequenceRef.current;

		player.pause();

		setFailedId(null);

		void setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false })
			.then(async () => {
				if (token !== playSequenceRef.current) {
					return;
				}

				player.replace({ uri: url });
				await player.seekTo(0);
				player.play();

				setPlayingId(id);
			})
			.catch((error: unknown) => {
				if (token === playSequenceRef.current) {
					setFailedId(id);
					setPlayingId(null);

					reportError(error, 'sound_playback');
				}
			});
	};

	return { playingId, finishedIds, failedId, toggle, stop };
};

export default useSoundPlayer;
