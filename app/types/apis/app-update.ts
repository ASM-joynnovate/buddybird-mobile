import { z } from 'zod';

export const appUpdateSchema = z.object({
	latest_version: z.string(),
	min_supported_version: z.string(),
	release_notes: z.array(z.string()),
});

export type AppUpdate = z.infer<typeof appUpdateSchema>;
