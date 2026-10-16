import { Directory, File, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

const CHUNK_ID_BYTES = 4;
const CHUNK_HEADER_BYTES = CHUNK_ID_BYTES * 2;
const RIFF_HEADER_BYTES = CHUNK_HEADER_BYTES + CHUNK_ID_BYTES;
const PCM_FORMAT_BYTES = 16;
const DATA_HEADER_OFFSET = RIFF_HEADER_BYTES + CHUNK_HEADER_BYTES + PCM_FORMAT_BYTES;
const WAV_HEADER_BYTES = DATA_HEADER_OFFSET + CHUNK_HEADER_BYTES;

const sharedFileTypes = {
	wav: { mimeType: 'audio/wav', UTI: 'com.microsoft.waveform-audio' },
	mp4: { mimeType: 'video/mp4', UTI: 'public.mpeg-4' },
	jpg: { mimeType: 'image/jpeg', UTI: 'public.jpeg' },
};

export type SharedFileType = keyof typeof sharedFileTypes;

/** 공유 폴더를 비우고 반환하는 함수 */
const _emptySharedDirectory = () => {
	const directory = new Directory(Paths.cache, 'shared-files');

	if (directory.exists) {
		directory.delete();
	}

	directory.create({ intermediates: true });

	return directory;
};

/** WAV 파일의 구간을 읽는 함수 */
const _readWavChunks = (bytes: Uint8Array) => {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
	let format: Uint8Array | null = null;
	let data: Uint8Array | null = null;

	for (let offset = RIFF_HEADER_BYTES; offset + CHUNK_HEADER_BYTES <= bytes.length;) {
		const chunkId = String.fromCharCode(...bytes.subarray(offset, offset + CHUNK_ID_BYTES));
		const chunkSize = view.getUint32(offset + CHUNK_ID_BYTES, true);
		const chunk = bytes.subarray(offset + CHUNK_HEADER_BYTES, offset + CHUNK_HEADER_BYTES + chunkSize);

		if (chunkId === 'fmt ') {
			format = chunk;
		} else if (chunkId === 'data') {
			data = chunk;
		}

		offset += CHUNK_HEADER_BYTES + chunkSize + (chunkSize % 2);
	}

	if (!format || !data) {
		throw new Error('WAV chunks are missing');
	}

	return { format, data };
};

/** 글자를 바이트로 바꾸는 함수 */
const _textBytes = (text: string) => {
	return Uint8Array.from(text, (char) => char.charCodeAt(0));
};

/** 같은 형식의 WAV 파일을 이어 붙이는 함수 */
const _joinWav = (wavs: Uint8Array[]) => {
	const chunks = wavs.map(_readWavChunks);
	const dataSize = chunks.reduce((size, chunk) => size + chunk.data.length, 0);
	const joined = new Uint8Array(WAV_HEADER_BYTES + dataSize);
	const view = new DataView(joined.buffer);
	const writeChunkHeader = (offset: number, chunkId: string, chunkSize: number) => {
		joined.set(_textBytes(chunkId), offset);
		view.setUint32(offset + CHUNK_ID_BYTES, chunkSize, true);
	};

	writeChunkHeader(0, 'RIFF', joined.length - CHUNK_HEADER_BYTES);
	joined.set(_textBytes('WAVE'), CHUNK_HEADER_BYTES);
	writeChunkHeader(RIFF_HEADER_BYTES, 'fmt ', PCM_FORMAT_BYTES);
	joined.set(chunks[0].format.subarray(0, PCM_FORMAT_BYTES), RIFF_HEADER_BYTES + CHUNK_HEADER_BYTES);
	writeChunkHeader(DATA_HEADER_OFFSET, 'data', dataSize);

	chunks.reduce((offset, chunk) => {
		joined.set(chunk.data, offset);

		return offset + chunk.data.length;
	}, WAV_HEADER_BYTES);

	return joined;
};

/** 파일을 내려받아 공유하는 함수 */
export const shareFile = async ({
	url,
	fileName,
	fileType,
}: {
	url: string;
	fileName: string;
	fileType: SharedFileType;
}) => {
	const file = await File.downloadFileAsync(url, new File(_emptySharedDirectory(), `${fileName}.${fileType}`));

	await shareAsync(file.uri, sharedFileTypes[fileType]);
};

/** WAV 파일을 이어 붙여 공유하는 함수 */
export const shareJoinedWav = async ({ urls, fileName }: { urls: string[]; fileName: string }) => {
	const directory = _emptySharedDirectory();
	const wavs = await Promise.all(
		urls.map(async (url, index) => {
			const file = await File.downloadFileAsync(url, new File(directory, `${index}.wav`));

			return file.bytes();
		}),
	);
	const joinedFile = new File(directory, `${fileName}.wav`);

	joinedFile.write(_joinWav(wavs));

	await shareAsync(joinedFile.uri, sharedFileTypes.wav);
};
