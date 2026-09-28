import { useMutation } from '@tanstack/react-query';

import { postFeedback } from '@/apis/feedback';

import { apiKeys } from '@/hooks/apis/keys';

import { reportError } from '@/services/telemetry/client';

/** 의견 전송 훅 */
export const useSendFeedback = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('feedback', 'create'),
		mutationFn: postFeedback,
		retry: false,
		onError: (error) => reportError(error, 'feedback_send'),
	});
};
