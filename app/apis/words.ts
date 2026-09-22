import { z } from "zod"

import { mockServer } from "@/apis/mock/server"

export const wordRefSchema = z.object({ id: z.uuid(), name: z.string() })

const recordingSchema = z.object({
	id: z.uuid(),
	url: z.string(),
	duration_ms: z.number().int().nonnegative(),
	status: z.enum(["processing", "ready"]),
	created_at: z.iso.datetime({ offset: true }),
})

const wordSchema = z.object({
	id: z.uuid(),
	name: z.string().min(1).max(50),
	recordings: z.array(recordingSchema),
})

export type WordRef = z.infer<typeof wordRefSchema>
export type Recording = z.infer<typeof recordingSchema>
export type Word = z.infer<typeof wordSchema>

export type RecordingFile = { uri: string; duration_ms: number }

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
	return wordSchema.parse(await mockServer.words.rename(id, name))
}

export async function deleteWord(id: string, _idempotencyKey: string): Promise<void> {
	await mockServer.words.remove(id)
}

export async function addWordRecording(
	wordId: string,
	file: RecordingFile,
	_idempotencyKey: string,
): Promise<Recording> {
	return recordingSchema.parse(await mockServer.words.addRecording(wordId, file))
}

export async function deleteWordRecording(
	wordId: string,
	recordingId: string,
	_idempotencyKey: string,
): Promise<void> {
	await mockServer.words.removeRecording(wordId, recordingId)
}
