import { z } from 'zod';

export const CLOCK_FORMAT = 'HH:mm:ss';

const clockSchema = z.string().regex(/^\d{2}:\d{2}:\d{2}$/);

export const sleepSettingsSchema = z.object({ sleep_at: clockSchema, wake_at: clockSchema });

export type SleepSettings = z.infer<typeof sleepSettingsSchema>;
