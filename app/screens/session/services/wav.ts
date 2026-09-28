import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';

const HEADER_BYTES = 44;
const RIFF_PREAMBLE_BYTES = 8;
const FMT_CHUNK_BYTES = 16;
const PCM_FORMAT = 1;
const CHANNELS = 1;
const BITS_PER_BYTE = 8;
const BYTES_PER_SAMPLE = Int16Array.BYTES_PER_ELEMENT;
const INT16_MAX = 32767;

/** 샘플을 16비트 모노 WAV 파일 바이트로 변환 */
const encodeWav = (samples: Float32Array, sampleRate: number) => {
	const dataBytes = samples.length * BYTES_PER_SAMPLE;
	const bytes = new Uint8Array(HEADER_BYTES + dataBytes);
	const view = new DataView(bytes.buffer);

	let offset = 0;

	/** 글자를 한 바이트씩 기록 */
	const writeText = (value: string) => {
		for (const character of value) {
			view.setUint8(offset, character.charCodeAt(0));
			offset += Uint8Array.BYTES_PER_ELEMENT;
		}
	};

	/** 32비트 정수를 리틀 엔디언으로 기록 */
	const writeUint32 = (value: number) => {
		view.setUint32(offset, value, true);
		offset += Uint32Array.BYTES_PER_ELEMENT;
	};

	/** 16비트 정수를 리틀 엔디언으로 기록 */
	const writeUint16 = (value: number) => {
		view.setUint16(offset, value, true);
		offset += Uint16Array.BYTES_PER_ELEMENT;
	};

	writeText('RIFF');
	writeUint32(HEADER_BYTES - RIFF_PREAMBLE_BYTES + dataBytes);
	writeText('WAVE');
	writeText('fmt ');
	writeUint32(FMT_CHUNK_BYTES);
	writeUint16(PCM_FORMAT);
	writeUint16(CHANNELS);
	writeUint32(sampleRate);
	writeUint32(sampleRate * CHANNELS * BYTES_PER_SAMPLE);
	writeUint16(CHANNELS * BYTES_PER_SAMPLE);
	writeUint16(BYTES_PER_SAMPLE * BITS_PER_BYTE);
	writeText('data');
	writeUint32(dataBytes);

	for (const sample of samples) {
		view.setInt16(offset, Math.round(Math.max(-1, Math.min(1, sample)) * INT16_MAX), true);
		offset += BYTES_PER_SAMPLE;
	}

	return bytes;
};

/** 샘플을 캐시 폴더에 WAV 파일로 저장하고 파일 주소 반환 */
export const saveWav = (samples: Float32Array, sampleRate: number) => {
	const directory = new Directory(Paths.cache, 'session-sounds');

	directory.create({ idempotent: true, intermediates: true });

	const file = new File(directory, `${randomUUID()}.wav`);

	file.write(encodeWav(samples, sampleRate));

	return file.uri;
};
