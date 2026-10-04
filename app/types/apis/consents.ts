import { timestampSchema, uuidSchema } from '@/types/apis/primitives';

import { z } from 'zod';

const consentStatusSchema = z.enum(['granted', 'denied']);

export const consentSchema = z.object({
	id: uuidSchema,
	kind: z.string(),
	version: z.number().int().positive(),
	title: z.string(),
	body: z.string(),
	is_required: z.boolean(),
	published_at: timestampSchema,
	status: consentStatusSchema.nullable(),
});

const saveConsentRequestSchema = z.object({
	consent_id: uuidSchema,
	status: consentStatusSchema,
});

export type Consent = z.infer<typeof consentSchema>;
export type SaveConsentRequest = z.infer<typeof saveConsentRequestSchema>;
