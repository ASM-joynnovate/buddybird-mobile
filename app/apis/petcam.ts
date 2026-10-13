import { type PetcamTurnCredential, petcamTurnCredentialSchema } from '@/types/apis/petcam';

import { apiRequest } from '@/lib/api';

export const postPetcamTurnCredential = async (): Promise<PetcamTurnCredential> => {
	const { data: turnCredential } = await apiRequest('/api/v1/petcam/turn-credentials', petcamTurnCredentialSchema, {
		method: 'POST',
	});

	return turnCredential;
};
