import { createAudioPlayer } from 'expo-audio';
import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

import { SECOND } from '@/config/units';

/** 소리 파일의 재생 길이를 측정하는 함수 */
export const measureAudioDuration = async (url: string) => {
	const directory = new Directory(Paths.cache, 'audio-durations', randomUUID());

	directory.create({ intermediates: true });

	try {
		const file = await File.downloadFileAsync(url, directory);
		const player = createAudioPlayer(file.uri);

		try {
			const seconds = await new Promise<number>((resolve, reject) => {
				const subscription = player.addListener('playbackStatusUpdate', (status) => {
					if (status.isLoaded) {
						subscription.remove();

						resolve(status.duration);
					} else if (status.playbackState === 'failed') {
						subscription.remove();

						reject(new Error('Recording could not be loaded'));
					}
				});
			});

			return Math.round(seconds * SECOND);
		} finally {
			player.remove();
		}
	} finally {
		directory.delete();
	}
};
