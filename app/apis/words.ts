import { z } from "zod"

import { putUpload } from "@/apis/mocks"
import { issueRecordingUpload } from "@/apis/uploads"
import { mockServer } from "@/mocks/server"
import { type Word, wordSchema } from "@/types/apis/words"

export async function fetchWords(): Promise<Word[]> {
	return z.array(wordSchema).parse(await mockServer.words.list())
}

export async function fetchWord(id: string): Promise<Word> {
	return wordSchema.parse(await mockServer.words.get(id))
}

export async function createWord(name: string, _idempotencyKey: string): Promise<Word> {
	return wordSchema.parse(await mockServer.words.create(name))
}

export async function renameWord(id: string, name: string, _idempotencyKey: string): Promise<Word> {
	return wordSchema.parse(await mockServer.words.update(id, name))
}

export async function deleteWord(id: string, _idempotencyKey: string): Promise<void> {
	await mockServer.words.remove(id)
}

export async function addWordRecording(
	wordId: string,
	file: { uri: string; durationMs: number },
	idempotencyKey: string,
): Promise<void> {
	await putUpload(await issueRecordingUpload(wordId, idempotencyKey), file.uri, file.durationMs)
}

export async function deleteWordRecording(
	wordId: string,
	recordingId: string,
	_idempotencyKey: string,
): Promise<void> {
	await mockServer.words.removeRecording(wordId, recordingId)
}
