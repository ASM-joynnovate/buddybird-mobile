import { sleepSettingsSchema } from '@/types/sleep-settings';

import { z } from 'zod';

const notificationSettingsSchema = z.object({
	notice: z.boolean(),
	report: z.boolean(),
	marketing: z.boolean(),
});

export const settingsSchema = z.object({
	sleep: sleepSettingsSchema,
	notifications: notificationSettingsSchema,
});

export type Settings = z.infer<typeof settingsSchema>;
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type NotificationSetting = keyof NotificationSettings;
