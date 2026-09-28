import { sleepSettingsSchema } from '@/types/sleep-settings';

import { z } from 'zod';

const notificationsSchema = z.object({
	notice: z.boolean(),
	report: z.boolean(),
	marketing: z.boolean(),
});

export const settingsSchema = z.object({
	sleep: sleepSettingsSchema,
	notifications: notificationsSchema,
});

export type Settings = z.infer<typeof settingsSchema>;
export type NotificationSettings = z.infer<typeof notificationsSchema>;
export type NotificationSetting = keyof NotificationSettings;
