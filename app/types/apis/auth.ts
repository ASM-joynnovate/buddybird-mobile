import { z } from "zod"

import { uuid } from "@/types/apis/primitives"

export const loginRequestSchema = z.object({
	google: z.object({ refresh_token: z.string() }).optional(),
	apple: z.object({ client_id: z.string(), authorization_code: z.string() }).optional(),
	language: z.enum(["ko", "en"]),
})

export const loginSchema = z.object({ user_id: uuid, is_new_user: z.boolean() })

export const withdrawalSchema = z.object({ user_id: uuid })

export const mergeRequestSchema = z.object({ anonymous_access_token: z.string().min(1) })

export type LoginRequest = z.infer<typeof loginRequestSchema>
export type Login = z.infer<typeof loginSchema>
export type Withdrawal = z.infer<typeof withdrawalSchema>
export type MergeRequest = z.infer<typeof mergeRequestSchema>
