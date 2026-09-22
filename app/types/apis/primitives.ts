import { z } from "zod"

export const clock = z.string().regex(/^\d{2}:\d{2}:\d{2}$/)
export const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
export const timestamp = z.iso.datetime({ offset: true })
export const uuid = z.uuid()
