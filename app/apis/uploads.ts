import { mockServer } from "@/apis/mock/server"
import { type Upload, uploadSchema } from "@/types/apis/uploads"

export async function issuePhotoUpload(): Promise<Upload> {
	return uploadSchema.parse(await mockServer.users.issuePhotoUpload())
}

export async function issueParrotPhotoUpload(
	parrotId: string,
	_idempotencyKey: string,
): Promise<Upload> {
	return uploadSchema.parse(await mockServer.parrots.issuePhotoUpload(parrotId))
}

export async function issueRecordingUpload(
	wordId: string,
	_idempotencyKey: string,
): Promise<Upload> {
	return uploadSchema.parse(await mockServer.words.issueRecordingUpload(wordId))
}

export async function issueSoundUpload(
	sessionId: string,
	capturedAt: string,
	_idempotencyKey: string,
): Promise<Upload> {
	return uploadSchema.parse(await mockServer.sessions.issueSoundUpload(sessionId, capturedAt))
}
