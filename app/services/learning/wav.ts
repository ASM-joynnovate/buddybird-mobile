import { randomUUID } from "expo-crypto"
import { Directory, File, Paths } from "expo-file-system"

const HEADER_BYTES = 44
const RIFF_PREAMBLE_BYTES = 8
const FMT_CHUNK_BYTES = 16
const PCM_FORMAT = 1
const CHANNELS = 1
const BITS_PER_BYTE = 8
const BYTES_PER_SAMPLE = Int16Array.BYTES_PER_ELEMENT
const INT16_MAX = 32767

export function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
	const dataBytes = samples.length * BYTES_PER_SAMPLE
	const bytes = new Uint8Array(HEADER_BYTES + dataBytes)
	const view = new DataView(bytes.buffer)

	let offset = 0

	const text = (value: string) => {
		for (const character of value) {
			view.setUint8(offset, character.charCodeAt(0))
			offset += Uint8Array.BYTES_PER_ELEMENT
		}
	}
	const uint32 = (value: number) => {
		view.setUint32(offset, value, true)
		offset += Uint32Array.BYTES_PER_ELEMENT
	}
	const uint16 = (value: number) => {
		view.setUint16(offset, value, true)
		offset += Uint16Array.BYTES_PER_ELEMENT
	}

	text("RIFF")
	uint32(HEADER_BYTES - RIFF_PREAMBLE_BYTES + dataBytes)
	text("WAVE")
	text("fmt ")
	uint32(FMT_CHUNK_BYTES)
	uint16(PCM_FORMAT)
	uint16(CHANNELS)
	uint32(sampleRate)
	uint32(sampleRate * CHANNELS * BYTES_PER_SAMPLE)
	uint16(CHANNELS * BYTES_PER_SAMPLE)
	uint16(BYTES_PER_SAMPLE * BITS_PER_BYTE)
	text("data")
	uint32(dataBytes)

	for (const sample of samples) {
		view.setInt16(offset, Math.round(Math.max(-1, Math.min(1, sample)) * INT16_MAX), true)
		offset += BYTES_PER_SAMPLE
	}

	return bytes
}

export function saveWav(samples: Float32Array, sampleRate: number): string {
	const directory = new Directory(Paths.cache, "session-sounds")

	directory.create({ idempotent: true, intermediates: true })

	const file = new File(directory, `${randomUUID()}.wav`)

	file.write(encodeWav(samples, sampleRate))

	return file.uri
}
