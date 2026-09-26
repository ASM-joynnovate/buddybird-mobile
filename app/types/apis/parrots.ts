import { z } from "zod"

import { localDate, uuid } from "@/types/apis/primitives"

export const PARROT_NAME_LIMIT = 20

export const parrotSchema = z.object({
	id: uuid,
	name: z.string(),
	species: z.string(),
	birthdate: localDate.nullable(),
	photo: z.object({ url: z.string() }).nullable(),
})

export const createParrotRequestSchema = z.object({
	name: z.string(),
	species: z.string(),
	birthdate: localDate.nullable().optional(),
})

export const updateParrotRequestSchema = z.object({
	name: z.string().optional(),
	species: z.string().optional(),
	birthdate: localDate.nullable().optional(),
})

export type Parrot = z.infer<typeof parrotSchema>
export type CreateParrotRequest = z.infer<typeof createParrotRequestSchema>
export type UpdateParrotRequest = z.infer<typeof updateParrotRequestSchema>
