import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { reportError } from '@/services/telemetry/client';

export interface SoundPlayer {
	playingId: string | null;
	finishedIds: ReadonlySet<string>;
	failedId: string | null;
	progress: number;
	toggle: (id: string, ...urls: string[]) => void;
	stop: () => void;
}

/** 녹음 재생 Hook */
const useSoundPlayer = () => {
	const player = useAudioPlayer(null, { updateInterval: 100, keepAudioSessionActive: true });
	const status = useAudioPlayerStatus(player);

	const [playingId, setPlayingId] = useState<string | null>(null);
	const [failedId, setFailedId] = useState<string | null>(null);
	const [finishedIds, setFinishedIds] = useState<ReadonlySet<string>>(new Set());

	const playSequenceRef = useRef(0);
	const nextUrlsRef = useRef<string[]>([]);

	const progress = playingId && status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;

	/** 재생 정지 함수 */
	const stop = useCallback(() => {
		playSequenceRef.current++;
		player.pause();

		setPlayingId(null);
	}, [player]);

	/** 소리를 불러와 처음부터 재생하는 함수 */
	const playFromStart = useCallback(
		async (url: string, token: number) => {
			player.replace({ uri: url });

			// 불러오기 전에 재생하면 iOS가 끝까지 재생된 이전 소리에 재생을 적용한 뒤 바로 멈춤
			await new Promise<void>((resolve, reject) => {
				const subscription = player.addListener('playbackStatusUpdate', (nextStatus) => {
					if (nextStatus.isLoaded) {
						subscription.remove();

						resolve();
					} else if (nextStatus.playbackState === 'failed') {
						subscription.remove();

						reject(new Error('Sound could not be loaded'));
					}
				});
			});

			if (token !== playSequenceRef.current) {
				return false;
			}

			await player.seekTo(0);
			player.play();

			return true;
		},
		[player],
	);

	/** 컴포넌트 unmount 시 재생 정지 */
	useLayoutEffect(() => stop, [stop]);

	/** 재생이 끝나면 다음 소리로 넘어감 */
	useEffect(() => {
		if (!playingId) {
			return;
		}

		if (status.playbackState === 'failed') {
			setFailedId(playingId);

			stop();
		} else if (status.didJustFinish) {
			const [nextUrl, ...restUrls] = nextUrlsRef.current;

			if (nextUrl) {
				const token = playSequenceRef.current;

				nextUrlsRef.current = restUrls;

				void playFromStart(nextUrl, token).catch((error: unknown) => {
					if (token === playSequenceRef.current) {
						setFailedId(playingId);

						stop();

						reportError(error, 'sound_playback');
					}
				});

				return;
			}

			const finishedId = playingId;

			setFinishedIds((prev) => new Set([...prev, finishedId]));

			stop();
		}
	}, [playFromStart, playingId, status.didJustFinish, status.playbackState, stop]);

	/** 녹음 재생 또는 정지 함수 */
	const toggle = (id: string, ...urls: string[]) => {
		if (playingId === id) {
			stop();

			return;
		}

		const [firstUrl, ...nextUrls] = urls;
		const token = ++playSequenceRef.current;

		player.pause();

		nextUrlsRef.current = nextUrls;

		setFailedId(null);

		void setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false })
			.then(async () => {
				if (token !== playSequenceRef.current) {
					return;
				}

				if (await playFromStart(firstUrl, token)) {
					setPlayingId(id);
				}
			})
			.catch((error: unknown) => {
				if (token === playSequenceRef.current) {
					setFailedId(id);
					setPlayingId(null);

					reportError(error, 'sound_playback');
				}
			});
	};

	return { playingId, finishedIds, failedId, progress, toggle, stop };
};

export default useSoundPlayer;
