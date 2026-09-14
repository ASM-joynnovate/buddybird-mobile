import { audioFile, codePoints } from "@/apis/collection/metadata"
import { deviceForm, post } from "@/apis/collection/request"
import { resolveRecordingUri } from "@/services/media/uri"
import { WORD_NAME_LIMIT, type Word } from "@/types/word"

export async function sendWordReference(word: Word, uid: string, signal?: AbortSignal) {
	const uri = resolveRecordingUri(word.audioUri)
	const form = deviceForm(uid)

	form.append("client_word_id", word.id)
	form.append("label", codePoints(word.label, WORD_NAME_LIMIT))
	form.append("audio_file", { uri, ...audioFile(uri) } as unknown as Blob)

	return post("/api/v1/words", form, 30_000, signal)
}
