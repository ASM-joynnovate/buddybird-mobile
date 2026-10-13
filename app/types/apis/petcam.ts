import { z } from 'zod';

const iceServerSchema = z
	.object({ urls: z.array(z.string()), username: z.string().nullable(), credential: z.string().nullable() })
	.transform(({ urls, username, credential }) =>
		username !== null && credential !== null ? { urls, username, credential } : { urls },
	);

export const petcamTurnCredentialSchema = z.object({ ice_servers: z.array(iceServerSchema) });

export type PetcamTurnCredential = z.infer<typeof petcamTurnCredentialSchema>;
