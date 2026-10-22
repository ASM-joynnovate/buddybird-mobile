import { uuidSchema } from '@/types/apis/primitives';

import { sleepSettingsSchema } from '@/types/sleep-settings';

import { z } from 'zod';

export const settingsSchema = z.object({
	sleep: sleepSettingsSchema,
});

const notificationSettingItemSchema = z.object({
	id: uuidSchema,
	kind: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	enabled: z.boolean(),
});

const notificationSettingGroupSchema = z.object({
	id: uuidSchema,
	title: z.string(),
	description: z.string().nullable(),
	items: z.array(notificationSettingItemSchema),
});

export const notificationSettingListSchema = z.object({
	push_enabled: z.boolean(),
	groups: z.array(notificationSettingGroupSchema),
	items: z.array(notificationSettingItemSchema),
});

const updateCommunitySettingsRequestSchema = z.object({
	leaderboard_enabled: z.boolean().optional(),
});

const updatePushSettingRequestSchema = z.object({
	push_enabled: z.boolean(),
});

const updateNotificationSettingItemRequestSchema = z.object({
	enabled: z.boolean(),
});

export type Settings = z.infer<typeof settingsSchema>;
export type NotificationSettingItem = z.infer<typeof notificationSettingItemSchema>;
export type NotificationSettingList = z.infer<typeof notificationSettingListSchema>;
export type UpdateCommunitySettingsRequest = z.infer<typeof updateCommunitySettingsRequestSchema>;
export type UpdatePushSettingRequest = z.infer<typeof updatePushSettingRequestSchema>;
export type UpdateNotificationSettingItemRequest = z.infer<typeof updateNotificationSettingItemRequestSchema>;
