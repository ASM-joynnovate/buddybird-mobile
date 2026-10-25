import { useMutation } from '@tanstack/react-query';

import { apiKeys } from '@/hooks/apis/keys';

import { shareFile } from '@/services/media/share';
import { reportError } from '@/services/telemetry/client';

/** 세션 기록 파일 공유 Hook */
const useShareSessionFile = () => {
	return useMutation({
		mutationKey: apiKeys.mutation('sessions', 'shareFile'),
		mutationFn: shareFile,
		onError: (error) => reportError(error, 'session_file_share'),
	});
};

export default useShareSessionFile;
