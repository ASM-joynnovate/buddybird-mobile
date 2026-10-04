import { locales } from '@/types/locale';

import { z } from 'zod';

const legacyMigrationSchema = z.object({
	settingsImported: z.boolean(),
	uploadStatus: z.enum(['pending', 'started', 'finished']),
	parrotId: z.string().nullable(),
	photoUploaded: z.boolean(),
	wordProgress: z.record(z.string(), z.object({ wordId: z.string().nullable(), done: z.boolean() })),
	idempotencyKeys: z.record(z.string(), z.string()).default({}),
});

export type LegacyMigration = z.infer<typeof legacyMigrationSchema>;

export const initialLegacyMigration: LegacyMigration = {
	settingsImported: false,
	uploadStatus: 'pending',
	parrotId: null,
	photoUploaded: false,
	wordProgress: {},
	idempotencyKeys: {},
};

export const deviceSettingsSchema = z.object({
	locale: z.enum(locales),
	analyticsConsent: z.enum(['unknown', 'granted', 'denied', 'not_applicable']),
	updatePrompt: z.object({ dismissedVersion: z.string().nullable() }),
	feedbackPrompt: z.object({
		formatVersion: z.literal(1),
		lastCountedDate: z.string().nullable(),
		dayCount: z.number().nonnegative(),
		thresholdIndex: z.number().nonnegative(),
	}),
	onboardingCompleted: z.boolean(),
	legacyMigration: legacyMigrationSchema.default(initialLegacyMigration),
});

export type LegacySettings = Partial<
	Pick<DeviceSettings, 'locale' | 'analyticsConsent' | 'updatePrompt' | 'feedbackPrompt'>
>;

export type DeviceSettings = z.infer<typeof deviceSettingsSchema>;
