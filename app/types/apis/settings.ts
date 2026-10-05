import { sleepSettingsSchema } from '@/types/sleep-settings';

import { z } from 'zod';

const notificationSettingsSchema = z.object({
	push_enabled: z.boolean(),
	announcement_enabled: z.boolean(),
	report_enabled: z.boolean(),
	marketing_enabled: z.boolean(),
	marketing_night_enabled: z.boolean(),
});

export const settingsSchema = z.object({
	sleep: sleepSettingsSchema,
	notifications: notificationSettingsSchema,
});

export type Settings = z.infer<typeof settingsSchema>;
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
export type NotificationSetting = keyof NotificationSettings;
