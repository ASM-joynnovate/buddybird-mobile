import { Asset } from "expo-asset"
import { File } from "expo-file-system"

import { resolveRecordingUri } from "@/services/media/uri"
import { presetByAudioUri } from "@/services/words/presets"
import type { WordSnapshot } from "@/types/word"

const careAssets = [
	require("@assets/audio/stress-care/track-02.m4a"),
	require("@assets/audio/stress-care/track-03.m4a"),
	require("@assets/audio/stress-care/track-04.m4a"),
]

async function localAsset(id: number) {
	const asset = await Asset.fromModule(id).downloadAsync()

	if (!asset.localUri) {
		throw new Error("Audio asset unavailable")
	}

	return asset.localUri
}

export async function resolveAudio(word: WordSnapshot) {
	if (word.sourceType === "preset") {
		const preset = presetByAudioUri(word.audioUri)

		if (!preset) {
			throw new Error("Unknown preset audio")
		}

		return localAsset(preset.asset)
	}

	const uri = resolveRecordingUri(word.audioUri)

	if (!new File(uri).exists) {
		throw new Error("Recording unavailable")
	}

	return uri
}

export function resolvePreviewAudio(word: WordSnapshot) {
	if (word.sourceType === "recording" && word.transformedAudioUri) {
		const transformed = resolveRecordingUri(word.transformedAudioUri)

		if (new File(transformed).exists) {
			return Promise.resolve(transformed)
		}
	}

	return resolveAudio(word)
}

export function stressCareAudio() {
	return Promise.all(careAssets.map(localAsset))
}
