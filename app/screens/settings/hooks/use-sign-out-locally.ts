import { useMutation } from '@tanstack/react-query';

import { apiKeys } from '@/hooks/apis/keys';

import { signOutLocally } from '@/services/auth/session';
import { reportError } from '@/services/telemetry/client';

/** 이 기기에서 로그아웃하는 Hook */
const useSignOutLocally = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('auth', 'signOutLocally'),
		mutationFn: signOutLocally,
		onError: (error) => reportError(error, 'sign_out'),
	});
};

export default useSignOutLocally;
