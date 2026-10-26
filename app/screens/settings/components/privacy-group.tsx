import type { UpdateCommunitySettingsRequest } from '@/types/apis/settings';

import { useGetSettings, useUpdateCommunitySettings } from '@/hooks/apis/settings';

import { useTranslation } from 'react-i18next';

import { toast } from 'sonner-native';

import { ItemGroup } from '@/components/ui/item/group';
import { ItemSwitch } from '@/components/ui/item/switch';
import { Toast } from '@/components/ui/toast';

/** 피드 공개 및 리더보드 참여 스위치 컴포넌트 */
const PrivacyGroup = () => {
	const { t } = useTranslation();

	const { data: settingsData } = useGetSettings();

	const { isPending, mutate } = useUpdateCommunitySettings();

	const handleToggle = (data: UpdateCommunitySettingsRequest) => {
		if (isPending) {
			return;
		}

		mutate(
			{ data },
			{
				onError: () => {
					toast.custom(<Toast variant="error" message={t('settings.saveError')} />);
				},
			},
		);
	};

	return (
		<ItemGroup>
			<ItemSwitch
				isFirstInGroup
				label={t('settings.privacy.feed')}
				detail={t('settings.privacy.feedDetail')}
				value={settingsData.community.feed_enabled}
				onChange={(feedEnabled) => handleToggle({ feed_enabled: feedEnabled })}
			/>
			<ItemSwitch
				label={t('settings.privacy.leaderboard')}
				detail={t('settings.privacy.leaderboardDetail')}
				value={settingsData.community.leaderboard_enabled}
				onChange={(leaderboardEnabled) => handleToggle({ leaderboard_enabled: leaderboardEnabled })}
			/>
		</ItemGroup>
	);
};

export default PrivacyGroup;
