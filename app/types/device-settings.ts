import { locales } from '@/types/locale';

import { z } from 'zod';

const legacyMigrationSchema = z.object({
	settingsImported: z.boolean(),
	upload: z.enum(['pending', 'started', 'finished']),
	parrotId: z.string().nullable(),
	photoUploaded: z.boolean(),
	words: z.record(z.string(), z.object({ wordId: z.string().nullable(), done: z.boolean() })),
	idempotencyKeys: z.record(z.string(), z.string()).default({}),
});

export type LegacyMigration = z.infer<typeof legacyMigrationSchema>;

export const initialLegacyMigration: LegacyMigration = {
	settingsImported: false,
	upload: 'pending',
	parrotId: null,
	photoUploaded: false,
	words: {},
	idempotencyKeys: {},
};

export const deviceSettingsSchema = z.object({
	locale: z.enum(locales),
	analyticsConsent: z.enum(['unknown', 'granted', 'denied', 'not_applicable']),
	update: z.object({ dismissedVersion: z.string().nullable() }),
	feedback: z.object({
		version: z.literal(1),
		lastCountedDate: z.string().nullable(),
		dayCount: z.number().nonnegative(),
		thresholdIndex: z.number().nonnegative(),
	}),
	guides: z.object({ recording: z.boolean() }),
	onboardingCompleted: z.boolean(),
	legacyMigration: legacyMigrationSchema.default(initialLegacyMigration),
});

export type LegacySettings = Partial<Pick<DeviceSettings, 'locale' | 'analyticsConsent' | 'update' | 'feedback'>>;

export type DeviceSettings = z.infer<typeof deviceSettingsSchema>;

export type Guide = keyof DeviceSettings['guides'];
