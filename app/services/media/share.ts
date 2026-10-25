import { Directory, File, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

import { WAV_HEADER_BYTES } from '@/config/units';

const CHUNK_ID_BYTES = 4;
const CHUNK_HEADER_BYTES = 8;
const RIFF_HEADER_BYTES = 12;
const PCM_FORMAT_BYTES = 16;
const DATA_HEADER_OFFSET = 36;

const sharedFileTypes = {
	wav: { mimeType: 'audio/wav', UTI: 'com.microsoft.waveform-audio' },
	mp4: { mimeType: 'video/mp4', UTI: 'public.mpeg-4' },
	jpg: { mimeType: 'image/jpeg', UTI: 'public.jpeg' },
};

type SharedFileType = keyof typeof sharedFileTypes;

interface ShareFileParams {
	url: string;
	fileName: string;
	fileType: SharedFileType;
}

interface ShareJoinedWavParams {
	urls: string[];
	fileName: string;
}

/** 공유 폴더를 비우고 반환하는 함수 */
const emptySharedDirectory = () => {
	const directory = new Directory(Paths.cache, 'shared-files');

	if (directory.exists) {
		directory.delete();
	}

	directory.create({ intermediates: true });

	return directory;
};

/** WAV 파일의 구간을 읽는 함수 */
const readWavChunks = (bytes: Uint8Array) => {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let format: Uint8Array | null = null;
	let wavData: Uint8Array | null = null;

	for (let offset = RIFF_HEADER_BYTES; offset + CHUNK_HEADER_BYTES <= bytes.length;) {
		const chunkId = String.fromCharCode(...bytes.subarray(offset, offset + CHUNK_ID_BYTES));
		const chunkSize = view.getUint32(offset + CHUNK_ID_BYTES, true);
		const chunk = bytes.subarray(offset + CHUNK_HEADER_BYTES, offset + CHUNK_HEADER_BYTES + chunkSize);

		if (chunkId === 'fmt ') {
			format = chunk;
		} else if (chunkId === 'data') {
			wavData = chunk;
		}

		offset += CHUNK_HEADER_BYTES + chunkSize + (chunkSize % 2);
	}

	if (!format || !wavData) {
		throw new Error('WAV chunks are missing');
	}

	return { format, wavData };
};

/** 글자를 바이트로 변환하는 함수 */
const textBytes = (text: string) => {
	return Uint8Array.from(text, (char) => char.charCodeAt(0));
};

/** 같은 형식의 WAV 파일을 이어 붙이는 함수 */
const joinWav = (wavs: Uint8Array[]) => {
	const chunks = wavs.map(readWavChunks);
	const dataSize = chunks.reduce((size, chunk) => size + chunk.wavData.length, 0);
	const joinedWavBytes = new Uint8Array(WAV_HEADER_BYTES + dataSize);
	const view = new DataView(joinedWavBytes.buffer);

	/** chunk 헤더 기록 함수 */
	const writeChunkHeader = (offset: number, chunkId: string, chunkSize: number) => {
		joinedWavBytes.set(textBytes(chunkId), offset);
		view.setUint32(offset + CHUNK_ID_BYTES, chunkSize, true);
	};

	writeChunkHeader(0, 'RIFF', joinedWavBytes.length - CHUNK_HEADER_BYTES);
	joinedWavBytes.set(textBytes('WAVE'), CHUNK_HEADER_BYTES);
	writeChunkHeader(RIFF_HEADER_BYTES, 'fmt ', PCM_FORMAT_BYTES);
	joinedWavBytes.set(chunks[0].format.subarray(0, PCM_FORMAT_BYTES), RIFF_HEADER_BYTES + CHUNK_HEADER_BYTES);
	writeChunkHeader(DATA_HEADER_OFFSET, 'data', dataSize);

	chunks.reduce((offset, chunk) => {
		joinedWavBytes.set(chunk.wavData, offset);

		return offset + chunk.wavData.length;
	}, WAV_HEADER_BYTES);

	return joinedWavBytes;
};

/** 파일을 내려받아 공유하는 함수 */
export const shareFile = async ({ url, fileName, fileType }: ShareFileParams) => {
	const file = await File.downloadFileAsync(url, new File(emptySharedDirectory(), `${fileName}.${fileType}`));

	await shareAsync(file.uri, sharedFileTypes[fileType]);
};

/** WAV 파일을 이어 붙여 공유하는 함수 */
export const shareJoinedWav = async ({ urls, fileName }: ShareJoinedWavParams) => {
	const directory = emptySharedDirectory();
	const wavs = await Promise.all(
		urls.map(async (url, index) => {
			const file = await File.downloadFileAsync(url, new File(directory, `${index}.wav`));

			return file.bytes();
		}),
	);
	const joinedFile = new File(directory, `${fileName}.wav`);

	joinedFile.write(joinWav(wavs));

	await shareAsync(joinedFile.uri, sharedFileTypes.wav);
};
