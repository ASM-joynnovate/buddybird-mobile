import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { getSettings, putNotificationSettings, putSleepSettings } from '@/apis/settings';

import type { Settings } from '@/types/apis/settings';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { queryClient } from '@/lib/query-client';

import { reportError } from '@/services/telemetry/client';

async function patchCachedSettings(patch: Partial<Settings>) {
	await queryClient.cancelQueries({ queryKey: apiKeys.settings() });

	const previousSettings = queryClient.getQueryData<Settings>(apiKeys.settings());

	if (previousSettings) {
		queryClient.setQueryData(apiKeys.settings(), { ...previousSettings, ...patch });
	}

	return { previousSettings };
}

function restoreCachedSettings(context: { previousSettings: Settings | undefined } | undefined) {
	if (context?.previousSettings) {
		queryClient.setQueryData(apiKeys.settings(), context.previousSettings);
	}
}

/** 설정 조회 옵션 */
export const getSettingsOptions = () => queryOptions({ queryKey: apiKeys.settings(), queryFn: getSettings });
/** 설정 조회 훅 */
export const useGetSettings = () => {
	return useSuspenseQuery(getSettingsOptions());
};

/** 수면 설정 저장 훅 */
export const useUpdateSleepSettings = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'settings', 'sleep'),
		mutationFn: putSleepSettings,
		onMutate: ({ data }) => patchCachedSettings({ sleep: data }),
		onError: (error, _variables, context) => {
			restoreCachedSettings(context);

			reportError(error, 'sleep_settings_save');
		},
		onSettled: () => invalidate(apiKeys.settings(), apiKeys.sessions.running(), apiKeys.home()),
	});
};

/** 알림 설정 저장 훅 */
export const useUpdateNotificationSettings = () => {
	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'settings', 'notifications'),
		mutationFn: putNotificationSettings,
		onMutate: ({ data }) => patchCachedSettings({ notifications: data }),
		onError: (error, _variables, context) => {
			restoreCachedSettings(context);

			reportError(error, 'notification_settings_save');
		},
		onSettled: () => invalidate(apiKeys.settings(), apiKeys.sessions.running(), apiKeys.home()),
	});
};
