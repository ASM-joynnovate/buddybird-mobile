import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getConsentList, postConsent } from '@/apis/consents';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

/** 동의 목록 조회 옵션 */
export const getConsentListOptions = () => queryOptions({ queryKey: apiKeys.consents.all(), queryFn: getConsentList });
/** 동의 목록 조회 훅 */
export const useGetConsentList = () => {
	return useSuspenseQuery(getConsentListOptions());
};

/** 동의 저장 훅 */
export const useSaveConsent = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'consents'),
		mutationFn: postConsent,
		onSuccess: () => invalidate(apiKeys.consents.all()),
		onError: (error) => reportError(error, 'consent_save'),
	});
};
