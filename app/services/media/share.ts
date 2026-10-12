import { Directory, File, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

/** 소리 파일을 내려받아 공유하는 함수 */
export const shareAudioFile = async ({ url, fileName }: { url: string; fileName: string }) => {
	const directory = new Directory(Paths.cache, 'shared-sounds');

	// 이전에 공유한 파일 삭제
	if (directory.exists) {
		directory.delete();
	}

	directory.create({ intermediates: true });

	const file = await File.downloadFileAsync(url, new File(directory, fileName));

	await shareAsync(file.uri, { mimeType: 'audio/wav', UTI: 'com.microsoft.waveform-audio' });
};
