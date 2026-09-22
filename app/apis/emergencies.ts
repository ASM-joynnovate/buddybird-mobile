import { z } from "zod"

import { mockServer } from "@/apis/mock/server"

export const emergencyKindSchema = z.enum([
	"audio_cry",
	"video_escape",
	"video_no_motion",
	"video_seizure",
])

export const emergencyBriefSchema = z.object({
	id: z.uuid(),
	session_id: z.uuid(),
	kind: emergencyKindSchema,
	detected_at: z.iso.datetime({ offset: true }),
})

const emergencySchema = emergencyBriefSchema.extend({
	media: z.object({ type: z.enum(["audio", "video"]), url: z.string() }).nullable(),
	is_confirmed: z.boolean(),
	session_running: z.boolean(),
})

export type EmergencyKind = z.infer<typeof emergencyKindSchema>
export type EmergencyBrief = z.infer<typeof emergencyBriefSchema>
export type Emergency = z.infer<typeof emergencySchema>

export async function fetchEmergency(id: string): Promise<Emergency> {
	return emergencySchema.parse(await mockServer.emergencies.get(id))
}

export async function confirmEmergency(id: string, _idempotencyKey: string): Promise<void> {
	await mockServer.emergencies.confirm(id)
}

export async function deleteEmergency(id: string, _idempotencyKey: string): Promise<void> {
	await mockServer.emergencies.remove(id)
}
