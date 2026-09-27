import { z } from "zod"

export const CLOCK_FORMAT = "HH:mm:ss"

const clock = z.string().regex(/^\d{2}:\d{2}:\d{2}$/)

export const sleepSettingsSchema = z.object({ sleep_at: clock, wake_at: clock })

export type SleepSettings = z.infer<typeof sleepSettingsSchema>
