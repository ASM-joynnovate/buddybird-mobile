import { z } from "zod"

import { mockServer } from "@/apis/mock/server"
import { type Page, pageMetaSchema } from "@/types/apis/common"
import { parrotSoundSchema } from "@/types/apis/parrot-sounds"
import type { SessionSound } from "@/types/apis/sessions"

export async function fetchParrotSounds(page: number): Promise<Page<SessionSound>> {
	const { data, meta } = await mockServer.parrotSounds.list(page)

	return { data: z.array(parrotSoundSchema).parse(data), meta: pageMetaSchema.parse(meta) }
}
