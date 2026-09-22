import { z } from "zod"

import { mockServer } from "@/apis/mock/server"

const userSchema = z.object({
	id: z.uuid(),
	email: z.string().nullable(),
	nickname: z.string().nullable(),
	photo_url: z.string().nullable(),
})

export type User = z.infer<typeof userSchema>

export type UpdateMeInput = { nickname?: string; photo_url?: string | null }

export async function fetchMe(): Promise<User> {
	return userSchema.parse(await mockServer.users.me())
}

export async function updateMe(input: UpdateMeInput): Promise<User> {
	return userSchema.parse(await mockServer.users.update(input))
}
