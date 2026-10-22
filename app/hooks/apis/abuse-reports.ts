import { postAbuseReport } from '@/apis/abuse-reports';

import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

/** 신고 전송 Hook */
export const useSendAbuseReport = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('abuse-reports', 'create'),
		mutationFn: postAbuseReport,
		retry: false,
		onError: (error) => reportError(error, 'abuse_report_send'),
	});
};
