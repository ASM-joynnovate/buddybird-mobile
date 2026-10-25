import { type QueryClient, queryOptions, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';

import {
	getNotificationSettings,
	getSettings,
	patchCommunitySettings,
	patchNotificationSettingItem,
	patchPushSetting,
	putSleepSettings,
} from '@/apis/settings';

import type { NotificationSettingItem, NotificationSettingList, Settings } from '@/types/apis/settings';

import { apiKeys } from '@/hooks/apis/keys';
import { homeKeys } from '@/hooks/apis/keys/home';
import { leaderboardKeys } from '@/hooks/apis/keys/leaderboard';
import { sessionKeys } from '@/hooks/apis/keys/sessions';
import { settingKeys } from '@/hooks/apis/keys/settings';
import { useIdempotentMutation } from '@/hooks/apis/use-idempotent-mutation';

import { reportError } from '@/services/telemetry/client';

interface SettingsMutationContext {
	previousSettings: Settings | undefined;
}

interface NotificationSettingsMutationContext {
	previousNotificationSettings: NotificationSettingList | undefined;
}

/** 저장 요청 전에 캐시의 설정을 먼저 변경하는 함수 */
const patchCachedSettings = async (queryClient: QueryClient, patch: Partial<Settings>) => {
	await queryClient.cancelQueries({ queryKey: settingKeys.all() });

	const previousSettings = queryClient.getQueryData<Settings>(settingKeys.all());

	if (previousSettings) {
		queryClient.setQueryData(settingKeys.all(), { ...previousSettings, ...patch });
	}

	return { previousSettings };
};

/** 저장 실패 시 캐시의 설정을 이전 값으로 되돌리는 함수 */
const restoreCachedSettings = (queryClient: QueryClient, context: SettingsMutationContext | undefined) => {
	if (context?.previousSettings) {
		queryClient.setQueryData(settingKeys.all(), context.previousSettings);
	}
};

/** 항목의 켜짐 여부 변경 함수 */
const withItemEnabled = (notificationSettings: NotificationSettingList, id: string, enabled: boolean) => {
	/** 항목 켜짐 여부 변경 함수 */
	const updateSettingItem = (settingItem: NotificationSettingItem) =>
		settingItem.id === id ? { ...settingItem, enabled } : settingItem;

	return {
		...notificationSettings,
		groups: notificationSettings.groups.map((group) => ({ ...group, items: group.items.map(updateSettingItem) })),
		items: notificationSettings.items.map(updateSettingItem),
	};
};

/** 캐시의 알림 설정을 반환하는 함수 */
const cancelAndReadCachedNotificationSettings = async (queryClient: QueryClient) => {
	await queryClient.cancelQueries({ queryKey: settingKeys.notifications() });

	return queryClient.getQueryData<NotificationSettingList>(settingKeys.notifications());
};

/** 캐시의 알림 설정 복원 함수 */
const restoreCachedNotificationSettings = (
	queryClient: QueryClient,
	context: NotificationSettingsMutationContext | undefined,
) => {
	if (context?.previousNotificationSettings) {
		queryClient.setQueryData(settingKeys.notifications(), context.previousNotificationSettings);
	}
};

/** 설정 조회 Hook에 사용할 옵션 */
export const getSettingsOptions = () => queryOptions({ queryKey: settingKeys.all(), queryFn: getSettings });
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
				queryClient.invalidateQueries({ queryKey: settingKeys.all() }),
				queryClient.invalidateQueries({ queryKey: sessionKeys.running() }),
				queryClient.invalidateQueries({ queryKey: homeKeys.all() }),
			]),
	});
};

/** 커뮤니티 설정 저장 Hook */
export const useUpdateCommunitySettings = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'settings', 'community'),
		mutationFn: patchCommunitySettings,
		onSuccess: () =>
			Promise.all([
				queryClient.invalidateQueries({ queryKey: settingKeys.all() }),
				queryClient.invalidateQueries({ queryKey: leaderboardKeys.all() }),
			]),
		onError: (error) => reportError(error, 'community_settings_save'),
	});
};

/** 알림 설정 조회 Hook에 사용할 옵션 */
export const getNotificationSettingsOptions = () =>
	queryOptions({ queryKey: settingKeys.notifications(), queryFn: getNotificationSettings });
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
			const previousNotificationSettings = await cancelAndReadCachedNotificationSettings(queryClient);

			if (previousNotificationSettings) {
				queryClient.setQueryData(settingKeys.notifications(), {
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
		onSettled: () => queryClient.invalidateQueries({ queryKey: settingKeys.notifications() }),
	});
};

/** 알림 설정 항목 저장 Hook */
export const useUpdateNotificationSettingItem = () => {
	const queryClient = useQueryClient();

	return useIdempotentMutation({
		mutationKey: apiKeys.mutation('users', 'me', 'settings', 'notifications', 'item'),
		mutationFn: patchNotificationSettingItem,
		onMutate: async ({ id, data }) => {
			const previousNotificationSettings = await cancelAndReadCachedNotificationSettings(queryClient);

			if (previousNotificationSettings) {
				queryClient.setQueryData(
					settingKeys.notifications(),
					withItemEnabled(previousNotificationSettings, id, data.enabled),
				);
			}

			return { previousNotificationSettings };
		},
		onError: (error, _variables, context) => {
			restoreCachedNotificationSettings(queryClient, context);

			reportError(error, 'notification_setting_item_save');
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: settingKeys.notifications() }),
	});
};
