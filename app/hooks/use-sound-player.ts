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

/** 녹음 하나를 재생하거나 멈추고 재생 중, 끝까지 들은, 재생에 실패한 녹음 ID를 돌려주는 훅 */
const useSoundPlayer = () => {
	const player = useAudioPlayer(null, { updateInterval: 100 });
	const status = useAudioPlayerStatus(player);

	const [playingId, setPlayingId] = useState<string | null>(null);
	const [failedId, setFailedId] = useState<string | null>(null);
	const [finishedIds, setFinishedIds] = useState<ReadonlySet<string>>(new Set());

	const playSequenceRef = useRef(0);

	/** 준비 중인 재생을 무시하고 재생 멈춤 */
	const stop = useCallback(() => {
		playSequenceRef.current++;
		player.pause();

		setPlayingId(null);
	}, [player]);

	/** 컴포넌트가 사라질 때 재생 멈춤 */
	useLayoutEffect(() => stop, [stop]);

	/** 재생이 실패하거나 끝나면 그 녹음 ID를 저장하고 재생 멈춤 */
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

	/** 재생 중인 녹음이면 멈추고 아니면 처음부터 재생 */
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
