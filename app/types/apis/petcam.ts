import { z } from 'zod';

// react-native-webrtc가 null인 접속 정보를 처리하지 못해, 값이 없는 서버는 주소만 남김
const iceServerSchema = z
	.object({ urls: z.array(z.string()), username: z.string().nullable(), credential: z.string().nullable() })
	.transform(({ urls, username, credential }) =>
		username !== null && credential !== null ? { urls, username, credential } : { urls },
	);

export const petcamTurnCredentialSchema = z.object({ ice_servers: z.array(iceServerSchema) });

export type PetcamTurnCredential = z.infer<typeof petcamTurnCredentialSchema>;
