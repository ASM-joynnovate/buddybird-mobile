import { type QueryClient, queryOptions, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import {
	getNotificationSettings,
	getSettings,
	patchNotificationSettingItem,
	patchPushSetting,
	putSleepSettings,
} from '@/apis/settings';

import type { NotificationSettingItem, NotificationSettingList, Settings } from '@/types/apis/settings';

import { apiKeys } from '@/hooks/apis/keys';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

/** 저장 요청 전에 캐시의 설정을 먼저 변경하는 함수 */
const patchCachedSettings = async (queryClient: QueryClient, patch: Partial<Settings>) => {
	await queryClient.cancelQueries({ queryKey: apiKeys.settings() });

	const previousSettings = queryClient.getQueryData<Settings>(apiKeys.settings());

	if (previousSettings) {
		queryClient.setQueryData(apiKeys.settings(), { ...previousSettings, ...patch });
	}

	return { previousSettings };
};

/** 저장 실패 시 캐시의 설정을 이전 값으로 되돌리는 함수 */
const restoreCachedSettings = (
	queryClient: QueryClient,
	context: { previousSettings: Settings | undefined } | undefined,
) => {
	if (context?.previousSettings) {
		queryClient.setQueryData(apiKeys.settings(), context.previousSettings);
	}
};

/** 항목의 켜짐 여부를 바꾸는 함수 */
const withItemEnabled = (notificationSettings: NotificationSettingList, id: string, enabled: boolean) => {
	const updateItem = (item: NotificationSettingItem) => (item.id === id ? { ...item, enabled } : item);

	return {
		...notificationSettings,
		groups: notificationSettings.groups.map((group) => ({ ...group, items: group.items.map(updateItem) })),
		items: notificationSettings.items.map(updateItem),
	};
};

/** 저장 실패 시 캐시의 알림 설정을 이전 값으로 되돌리는 함수 */
const restoreCachedNotificationSettings = (
	queryClient: QueryClient,
	context: { previousNotificationSettings: NotificationSettingList | undefined } | undefined,
) => {
	if (context?.previousNotificationSettings) {
		queryClient.setQueryData(apiKeys.notificationSettings(), context.previousNotificationSettings);
	}
};

/** 설정 조회 Hook에 사용할 옵션 */
export const getSettingsOptions = () => queryOptions({ queryKey: apiKeys.settings(), queryFn: getSettings });
/** 설정 조회 Hook */
export const useGetSettings = () => {
	return useSuspenseQuery(getSettingsOptions());
};

/** 수면 설정 저장 Hook */
export const useUpdateSleepSettings = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'settings', 'sleep'),
		mutationFn: putSleepSettings,
		onMutate: ({ data }) => patchCachedSettings(queryClient, { sleep: data }),
		onError: (error, _variables, context) => {
			restoreCachedSettings(queryClient, context);

			reportError(error, 'sleep_settings_save');
		},
		onSettled: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: apiKeys.settings() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.sessions.running() }),
				queryClient.invalidateQueries({ queryKey: apiKeys.home() }),
			]),
	});
};

/** 알림 설정 조회 Hook에 사용할 옵션 */
export const getNotificationSettingsOptions = () =>
	queryOptions({ queryKey: apiKeys.notificationSettings(), queryFn: getNotificationSettings });
/** 알림 설정 조회 Hook */
export const useGetNotificationSettings = () => {
	return useSuspenseQuery(getNotificationSettingsOptions());
};

/** 전체 알림 설정 저장 Hook */
export const useUpdatePushSetting = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'settings', 'notifications'),
		mutationFn: patchPushSetting,
		onMutate: async ({ data }) => {
			await queryClient.cancelQueries({ queryKey: apiKeys.notificationSettings() });

			const previousNotificationSettings = queryClient.getQueryData<NotificationSettingList>(
				apiKeys.notificationSettings(),
			);

			if (previousNotificationSettings) {
				queryClient.setQueryData(apiKeys.notificationSettings(), {
					...previousNotificationSettings,
					push_enabled: data.push_enabled,
				});
			}

			return { previousNotificationSettings };
		},
		onError: (error, _variables, context) => {
			restoreCachedNotificationSettings(queryClient, context);

			reportError(error, 'push_setting_save');
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: apiKeys.notificationSettings() }),
	});
};

/** 알림 설정 항목 저장 Hook */
export const useUpdateNotificationSettingItem = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'settings', 'notifications', 'item'),
		mutationFn: patchNotificationSettingItem,
		onMutate: async ({ id, data }) => {
			await queryClient.cancelQueries({ queryKey: apiKeys.notificationSettings() });

			const previousNotificationSettings = queryClient.getQueryData<NotificationSettingList>(
				apiKeys.notificationSettings(),
			);

			if (previousNotificationSettings) {
				queryClient.setQueryData(
					apiKeys.notificationSettings(),
					withItemEnabled(previousNotificationSettings, id, data.enabled),
				);
			}

			return { previousNotificationSettings };
		},
		onError: (error, _variables, context) => {
			restoreCachedNotificationSettings(queryClient, context);

			reportError(error, 'notification_setting_item_save');
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: apiKeys.notificationSettings() }),
	});
};
