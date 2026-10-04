import { z } from 'zod';

export const appUpdateSchema = z.object({
	latest: z.object({ version: z.string(), release_notes: z.array(z.string()) }),
	min_supported: z.object({ version: z.string() }),
});

export type AppUpdate = z.infer<typeof appUpdateSchema>;
