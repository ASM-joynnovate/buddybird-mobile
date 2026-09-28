import { mutationOptions, queryOptions } from '@tanstack/react-query';

import { getSettings, putNotificationSettings, putSleepSettings } from '@/apis/settings';

import type { NotificationSettings, Settings } from '@/types/apis/settings';

import { invalidate } from '@/hooks/apis/invalidate';
import { apiKeys } from '@/hooks/apis/keys';

import { queryClient } from '@/lib/query-client';

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

export const settingsQueryOptions = () => queryOptions({ queryKey: apiKeys.settings(), queryFn: getSettings });

export const updateSleepMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('users', 'me', 'settings', 'sleep'),
		mutationFn: ({ sleep, idempotencyKey }: { sleep: Settings['sleep']; idempotencyKey: string }) =>
			putSleepSettings({ data: sleep, idempotencyKey }),
		onMutate: ({ sleep }) => patchCachedSettings({ sleep }),
		onError: (_error, _variables, context) => restoreCachedSettings(context),
		onSettled: () => invalidate(apiKeys.settings(), apiKeys.sessions.running(), apiKeys.home()),
	});

export const updateNotificationsMutationOptions = () =>
	mutationOptions({
		mutationKey: apiKeys.mutation('users', 'me', 'settings', 'notifications'),
		mutationFn: ({
			notifications,
			idempotencyKey,
		}: {
			notifications: NotificationSettings;
			idempotencyKey: string;
		}) => putNotificationSettings({ data: notifications, idempotencyKey }),
		onMutate: ({ notifications }) => patchCachedSettings({ notifications }),
		onError: (_error, _variables, context) => restoreCachedSettings(context),
		onSettled: () => invalidate(apiKeys.settings(), apiKeys.sessions.running(), apiKeys.home()),
	});
