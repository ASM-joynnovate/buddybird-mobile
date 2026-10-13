import { useMutation } from '@tanstack/react-query';

import { postPetcamTurnCredential } from '@/apis/petcam';

import { apiKeys } from '@/hooks/apis/keys';

/** TURN 접속 정보 발급 Hook */
export const useIssuePetcamTurnCredential = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('petcam', 'turn-credential'),
		mutationFn: postPetcamTurnCredential,
		retry: false,
	});
};
