import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getConsentList, postConsent } from '@/apis/consents';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

/** 약관 동의 목록 조회 Hook에 사용할 옵션 */
export const getConsentListOptions = () => queryOptions({ queryKey: apiKeys.consents.all(), queryFn: getConsentList });
/** 약관 동의 목록 조회 Hook */
export const useGetConsentList = () => {
	return useSuspenseQuery(getConsentListOptions());
};

/** 약관 동의 저장 Hook */
export const useSaveConsent = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'consents'),
		mutationFn: postConsent,
		onSuccess: () => invalidate(apiKeys.consents.all()),
		onError: (error) => reportError(error, 'consent_save'),
	});
};
