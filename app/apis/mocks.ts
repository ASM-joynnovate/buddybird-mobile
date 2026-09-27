import { z } from "zod"

import { mockServer } from "@/mocks/server"
import { type Session, sessionSchema } from "@/types/apis/sessions"
import type { Upload } from "@/types/apis/uploads"

export async function putUpload(upload: Upload, uri: string): Promise<void> {
	await mockServer.uploads.put(upload.file_id, uri)
}

export async function fetchSessionsInRange(from: Date, to: Date): Promise<Session[]> {
	return z
		.array(sessionSchema)
		.parse(await mockServer.sessions.range(from.getTime(), to.getTime()))
}
