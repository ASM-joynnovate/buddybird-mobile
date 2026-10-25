import { useMutation } from '@tanstack/react-query';

import { apiKeys } from '@/hooks/apis/keys';

import { shareJoinedWav } from '@/services/media/share';
import { reportError } from '@/services/telemetry/client';

/** 이어 붙인 세션 소리 공유 Hook */
const useShareSessionJoinedSound = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('sessions', 'shareJoinedSound'),
		mutationFn: shareJoinedWav,
		onError: (error) => reportError(error, 'parrot_sound_share'),
	});
};

export default useShareSessionJoinedSound;
