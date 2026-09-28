import { createAudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';

import { SECOND } from '@/utils/units';

export async function measureRecordingDuration(url: string): Promise<number> {
	const file = await File.downloadFileAsync(url, Paths.cache, { idempotent: true });
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

		file.delete();
	}
}
