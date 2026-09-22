import { z } from "zod"

import { mockServer } from "@/apis/mock/server"

const parrotSchema = z.object({
	id: z.uuid(),
	name: z.string().min(1).max(20),
	species: z.string().min(1).max(50),
	birthdate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.nullable(),
	photo_url: z.string().nullable(),
})

export type Parrot = z.infer<typeof parrotSchema>

export type ParrotInput = Omit<Parrot, "id">

export async function fetchParrots(): Promise<Parrot[]> {
	return z.array(parrotSchema).parse(await mockServer.parrots.list())
}

export async function createParrot(input: ParrotInput, _idempotencyKey: string): Promise<Parrot> {
	return parrotSchema.parse(await mockServer.parrots.create(input))
}

export async function updateParrot(
	id: string,
	input: ParrotInput,
	_idempotencyKey: string,
): Promise<Parrot> {
	return parrotSchema.parse(await mockServer.parrots.update(id, input))
}

export async function deleteParrot(id: string, _idempotencyKey: string): Promise<void> {
	await mockServer.parrots.remove(id)
}
