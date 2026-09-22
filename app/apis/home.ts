import { z } from "zod"

import { emergencyBriefSchema } from "@/apis/emergencies"
import { mockServer } from "@/apis/mock/server"
import { noticeSchema } from "@/apis/notices"
import { runningSessionSchema, soundSchema } from "@/apis/sessions"

const homeSummarySchema = z.object({
	running_session: runningSessionSchema.nullable(),
	unread_notification_count: z.number().int().nonnegative(),
	streak_days: z.number().int().nonnegative(),
	latest_mimicry: soundSchema.nullable(),
	unconfirmed_emergency: emergencyBriefSchema.nullable(),
	unread_notices: z.array(noticeSchema),
})

export type HomeSummary = z.infer<typeof homeSummarySchema>

export async function fetchHomeSummary(): Promise<HomeSummary> {
	return homeSummarySchema.parse(await mockServer.home.summary())
}
